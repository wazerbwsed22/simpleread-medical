import { NextRequest, NextResponse } from 'next/server';
import { ingestFile, type DocumentSummary } from '@/lib/rag';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files.length) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const results: { filename: string; chunks: number; summary: DocumentSummary }[] = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const { chunks, summary } = await ingestFile(buffer, file.name);
      results.push({ filename: file.name, chunks, summary });
    }

    return NextResponse.json({ success: true, results });
  } catch (err) {
    console.error('[/api/ingest]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Ingestion failed' },
      { status: 500 }
    );
  }
}
