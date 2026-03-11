/**
 * Simple in-memory vector store with cosine similarity search.
 * Persists for the lifetime of the Next.js server process (dev & prod).
 */

export interface VectorRecord {
  id: string;
  values: number[];
  metadata: Record<string, unknown>;
}

export interface QueryMatch {
  score: number;
  metadata: Record<string, unknown>;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot  += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB) || 1);
}

class InMemoryVectorStore {
  private records = new Map<string, VectorRecord>();

  upsert(vectors: VectorRecord[]): void {
    for (const v of vectors) {
      this.records.set(v.id, v);
    }
  }

  query(vector: number[], topK: number): QueryMatch[] {
    return Array.from(this.records.values())
      .map((r) => ({ score: cosineSimilarity(vector, r.values), metadata: r.metadata }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  clear(): void {
    this.records.clear();
  }

  get size(): number {
    return this.records.size;
  }
}

// Module-level singleton — shared across all requests in the same process
const globalStore = globalThis as typeof globalThis & { __vectorStore?: InMemoryVectorStore };
if (!globalStore.__vectorStore) {
  globalStore.__vectorStore = new InMemoryVectorStore();
}

export const vectorStore = globalStore.__vectorStore;
