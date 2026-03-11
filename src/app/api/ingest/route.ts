import { NextRequest } from 'next/server';
import { ingestFile, type DocumentSummary } from '@/lib/rag';

// Allow up to 120s for large documents (embedding + summarization)
export const maxDuration = 120;

type IngestEvent =
  | { type: 'progress'; message: string }
  | { type: 'result'; filename: string; chunks: number; summary: DocumentSummary }
  | { type: 'error'; filename: string; message: string }
  | { type: 'done' };

function encode(event: IngestEvent): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`);
}

export async function POST(req: NextRequest) {
  let files: File[];

  try {
    const formData = await req.formData();
    files = formData.getAll('files') as File[];
    if (!files.length) {
      return Response.json({ error: 'No files provided' }, { status: 400 });
    }
  } catch {
    return Response.json({ error: 'Could not parse form data' }, { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      for (const file of files) {
        controller.enqueue(encode({ type: 'progress', message: `Processing ${file.name}…` }));
        try {
          const buffer = Buffer.from(await file.arrayBuffer());
          controller.enqueue(encode({ type: 'progress', message: `Indexing & summarising ${file.name}…` }));
          const { chunks, summary } = await ingestFile(buffer, file.name);
          controller.enqueue(encode({ type: 'result', filename: file.name, chunks, summary }));
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Ingestion failed';
          controller.enqueue(encode({ type: 'error', filename: file.name, message }));
        }
      }
      controller.enqueue(encode({ type: 'done' }));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      // Prevent proxies/nginx from buffering the SSE stream
      'X-Accel-Buffering': 'no',
    },
  });
}
