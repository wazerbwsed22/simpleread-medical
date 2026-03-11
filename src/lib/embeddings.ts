import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const client = new BedrockRuntimeClient({ region: process.env.AWS_REGION ?? 'us-east-1' });

export async function embedText(text: string): Promise<number[]> {
  const response = await client.send(
    new InvokeModelCommand({
      modelId: 'amazon.titan-embed-text-v2:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({ inputText: text }),
    })
  );
  const result = JSON.parse(new TextDecoder().decode(response.body)) as { embedding: number[] };
  return result.embedding;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  return Promise.all(texts.map(embedText));
}
