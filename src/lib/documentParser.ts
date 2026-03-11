import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import pdfParse from 'pdf-parse';

export interface ParsedChunk {
  text: string;
  metadata: {
    source: string;
    chunkIndex: number;
    fileType: string;
  };
}

export async function parseAndChunkFile(
  buffer: Buffer,
  filename: string
): Promise<ParsedChunk[]> {
  const ext = filename.split('.').pop()?.toLowerCase();
  let fullText = '';

  if (ext === 'pdf') {
    const parsed = await pdfParse(buffer);
    fullText = parsed.text;
  } else if (ext === 'docx' || ext === 'doc') {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    fullText = result.value;
  } else {
    fullText = buffer.toString('utf-8');
  }

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const chunks = await splitter.splitText(fullText);

  return chunks.map((text, chunkIndex) => ({
    text,
    metadata: { source: filename, chunkIndex, fileType: ext ?? 'txt' },
  }));
}
