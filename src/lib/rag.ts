import {
  BedrockRuntimeClient,
  ConverseCommand,
  ConverseStreamCommand,
  type Message,
} from '@aws-sdk/client-bedrock-runtime';
import { embedText, embedTexts } from './embeddings';
import { vectorStore } from './vectorStore';
import { parseAndChunkFile } from './documentParser';

const client = new BedrockRuntimeClient({ region: process.env.AWS_REGION ?? 'us-east-1' });
// Cross-region inference profile required for Claude 3.5 Sonnet v2
const CLAUDE_MODEL_ID = 'us.anthropic.claude-3-5-sonnet-20241022-v2:0';

// ─── Document Summary ─────────────────────────────────────────────────────────

export interface DocumentSummary {
  documentType: string;
  date: string;
  patientInfo: string;
  keyFindings: string[];
  diagnoses: string[];
  recommendations: string[];
  overallAssessment: string;
}

async function summarizeDocument(text: string): Promise<DocumentSummary> {
  // Truncate to stay within token limits while covering the main content
  const truncated = text.slice(0, 10000);

  const response = await client.send(
    new ConverseCommand({
      modelId: CLAUDE_MODEL_ID,
      system: [
        {
          text: `You are a medical document summarizer. Extract key information from the document and return ONLY a valid JSON object — no markdown fences, no extra text. Use this exact shape:
{
  "documentType": "string (e.g. Lab Report, Radiology Report, Discharge Summary)",
  "date": "string (report date or 'Not specified')",
  "patientInfo": "string (name/age/ID if present, or 'Not specified')",
  "keyFindings": ["finding 1", "finding 2"],
  "diagnoses": ["diagnosis 1"],
  "recommendations": ["recommendation 1"],
  "overallAssessment": "string (1-2 sentence overall assessment)"
}`,
        },
      ],
      messages: [
        {
          role: 'user',
          content: [{ text: `Summarize this medical document:\n\n${truncated}` }],
        },
      ],
      inferenceConfig: { maxTokens: 1024 },
    })
  );

  const raw =
    response.output?.message?.content?.map((b) => b.text ?? '').join('') ?? '{}';

  try {
    return JSON.parse(raw) as DocumentSummary;
  } catch {
    return {
      documentType: 'Medical Document',
      date: 'Not specified',
      patientInfo: 'Not specified',
      keyFindings: [raw.slice(0, 300)],
      diagnoses: [],
      recommendations: [],
      overallAssessment: '',
    };
  }
}

// ─── Ingestion ────────────────────────────────────────────────────────────────

export interface IngestResult {
  chunks: number;
  summary: DocumentSummary;
}

export async function ingestFile(buffer: Buffer, filename: string): Promise<IngestResult> {
  const parsedChunks = await parseAndChunkFile(buffer, filename);

  const fallbackSummary: DocumentSummary = {
    documentType: 'Medical Document',
    date: 'Not specified',
    patientInfo: 'Not specified',
    keyFindings: [],
    diagnoses: [],
    recommendations: [],
    overallAssessment: 'No content could be extracted from this document.',
  };

  if (parsedChunks.length === 0) return { chunks: 0, summary: fallbackSummary };

  const texts = parsedChunks.map((c) => c.text);

  // Run embedding and summarization in parallel
  const [embeddings, summary] = await Promise.all([
    embedTexts(texts),
    summarizeDocument(texts.join('\n\n')),
  ]);

  vectorStore.upsert(
    parsedChunks.map((chunk, i) => ({
      id: `${filename}-chunk-${chunk.metadata.chunkIndex}`,
      values: embeddings[i],
      metadata: {
        text: chunk.text,
        source: chunk.metadata.source,
        chunkIndex: chunk.metadata.chunkIndex,
        fileType: chunk.metadata.fileType,
      },
    }))
  );

  return { chunks: parsedChunks.length, summary };
}

// ─── Retrieval ────────────────────────────────────────────────────────────────

export interface RetrievedChunk {
  text: string;
  source: string;
  score: number;
}

export async function retrieveRelevantChunks(
  query: string,
  topK = 5
): Promise<RetrievedChunk[]> {
  const queryEmbedding = await embedText(query);
  const matches = vectorStore.query(queryEmbedding, topK);

  return matches.map((match) => ({
    text: String(match.metadata?.text ?? ''),
    source: String(match.metadata?.source ?? 'Unknown'),
    score: match.score,
  }));
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function buildContext(chunks: RetrievedChunk[]): string {
  return chunks
    .map((c, i) => `[${i + 1}] Source: ${c.source}\n${c.text}`)
    .join('\n\n---\n\n');
}

const SYSTEM_PROMPT = (context: string) =>
  `You are a helpful medical document assistant. Use the provided context excerpts to answer the user's question accurately and concisely. If the answer is not in the context, say so clearly. Always cite which sources you used.

Context from medical documents:
${context}`;

function buildMessages(history: ChatMessage[], userQuery: string): Message[] {
  return [
    ...history.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: [{ text: m.content }],
    })),
    { role: 'user' as const, content: [{ text: userQuery }] },
  ];
}

// ─── Streaming Generation (SSE) ───────────────────────────────────────────────

export async function streamRagAnswer(
  userQuery: string,
  history: ChatMessage[] = []
): Promise<{ textStream: AsyncIterable<string>; sources: string[] }> {
  const chunks = await retrieveRelevantChunks(userQuery, 5);
  const sources = [...new Set(chunks.map((c) => c.source))];
  const context = buildContext(chunks);

  const response = await client.send(
    new ConverseStreamCommand({
      modelId: CLAUDE_MODEL_ID,
      system: [{ text: SYSTEM_PROMPT(context) }],
      messages: buildMessages(history, userQuery),
      inferenceConfig: { maxTokens: 1024 },
    })
  );

  async function* textStream(): AsyncIterable<string> {
    for await (const event of response.stream ?? []) {
      const text = event.contentBlockDelta?.delta?.text;
      if (text) yield text;
    }
  }

  return { textStream: textStream(), sources };
}

// ─── Non-streaming Generation ─────────────────────────────────────────────────

export async function generateRagAnswer(
  userQuery: string,
  history: ChatMessage[] = []
): Promise<{ answer: string; sources: string[] }> {
  const chunks = await retrieveRelevantChunks(userQuery, 5);
  const sources = [...new Set(chunks.map((c) => c.source))];
  const context = buildContext(chunks);

  const response = await client.send(
    new ConverseCommand({
      modelId: CLAUDE_MODEL_ID,
      system: [{ text: SYSTEM_PROMPT(context) }],
      messages: buildMessages(history, userQuery),
      inferenceConfig: { maxTokens: 1024 },
    })
  );

  const answer =
    response.output?.message?.content
      ?.map((block) => block.text ?? '')
      .join('') ?? '';

  return { answer, sources };
}
