import { embed, embedMany } from 'ai';
import { bedrock } from '@ai-sdk/amazon-bedrock';

// Amazon Titan Text Embeddings V2 — 1024 dimensions, no extra API key needed
const EMBEDDING_MODEL = bedrock.textEmbeddingModel('amazon.titan-embed-text-v2:0');

export async function embedText(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: EMBEDDING_MODEL,
    value: text,
  });
  return embedding;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const { embeddings } = await embedMany({
    model: EMBEDDING_MODEL,
    values: texts,
  });
  return embeddings;
}
