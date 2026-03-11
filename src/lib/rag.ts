import { streamText, generateText, type CoreMessage } from 'ai';
import { bedrock } from '@ai-sdk/amazon-bedrock';
import { embedText, embedTexts } from './embeddings';
import { vectorStore } from './vectorStore';
import { parseAndChunkFile } from './documentParser';

// Claude 3.5 Sonnet on Bedrock
const CLAUDE_MODEL = bedrock('anthropic.claude-3-5-sonnet-20241022-v2:0');

// ─── Ingestion ────────────────────────────────────────────────────────────────

export async function ingestFile(buffer: Buffer, filename: string): Promise<number> {
  const chunks = await parseAndChunkFile(buffer, filename);
  if (chunks.length === 0) return 0;

  const texts = chunks.map((c) => c.text);
  const embeddings = await embedTexts(texts);

  vectorStore.upsert(
    chunks.map((chunk, i) => ({
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

  return chunks.length;
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

// ─── Streaming Generation (SSE) ───────────────────────────────────────────────

export async function streamRagAnswer(
  userQuery: string,
  history: ChatMessage[] = []
): Promise<{ stream: ReturnType<typeof streamText>; sources: string[] }> {
  const chunks = await retrieveRelevantChunks(userQuery, 5);
  const sources = [...new Set(chunks.map((c) => c.source))];
  const context = buildContext(chunks);

  const messages: CoreMessage[] = [
    ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content: userQuery },
  ];

  const stream = streamText({
    model: CLAUDE_MODEL,
    system: SYSTEM_PROMPT(context),
    messages,
    maxTokens: 1024,
  });

  return { stream, sources };
}

// ─── Non-streaming Generation ─────────────────────────────────────────────────

export async function generateRagAnswer(
  userQuery: string,
  history: ChatMessage[] = []
): Promise<{ answer: string; sources: string[] }> {
  const chunks = await retrieveRelevantChunks(userQuery, 5);
  const sources = [...new Set(chunks.map((c) => c.source))];
  const context = buildContext(chunks);

  const messages: CoreMessage[] = [
    ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content: userQuery },
  ];

  const { text } = await generateText({
    model: CLAUDE_MODEL,
    system: SYSTEM_PROMPT(context),
    messages,
    maxTokens: 1024,
  });

  return { answer: text, sources };
}
