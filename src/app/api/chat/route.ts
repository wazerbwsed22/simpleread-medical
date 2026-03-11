import { NextRequest, NextResponse } from 'next/server';
import { streamRagAnswer, type ChatMessage } from '@/lib/rag';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { query, history = [] }: { query: string; history: ChatMessage[] } =
      await req.json();

    if (!query?.trim()) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const { textStream, sources } = await streamRagAnswer(query, history);

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        // Send sources first so the UI can show them before the text arrives
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'sources', sources })}\n\n`)
        );

        for await (const delta of textStream) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'text', text: delta })}\n\n`)
          );
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    console.error('[/api/chat]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Chat failed' },
      { status: 500 }
    );
  }
}
