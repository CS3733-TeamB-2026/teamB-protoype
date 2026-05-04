import { pipeline, env } from '@xenova/transformers';

let embedder: Awaited<ReturnType<typeof pipeline>> | null = null;

env.cacheDir = './models';
// @ts-ignore - skip image processor to avoid sharp dependency
env.backends.onnx.wasm.numThreads = 1;

async function getEmbedder() {
    if (!embedder) {
        console.log('[embeddings] Loading model (first time may take a moment)...');
        embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        console.log('[embeddings] Model loaded.');
    }
    return embedder;
}

export async function generateEmbedding(text: string): Promise<number[]> {
    const embedder = await getEmbedder();

    const truncated = text.slice(0, 4000);

    // @ts-ignore - output type is too broad in @xenova/transformers types
    const output = await embedder(truncated, { pooling: 'mean', normalize: true });

    // @ts-ignore
    return Array.from(output.data) as number[];
}



const ML_SERVICE = process.env.ML_SERVICE_URL ?? 'http://localhost:3001';

export async function generateEmbedding2(text: string): Promise<number[]> {
    const truncated = text.slice(0, 4000);  // Number can be increased significantly

    const res = await fetch(`${ML_SERVICE}/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: truncated })
    });
    if (!res.ok) throw new Error(`ML Service /embed failed: ${res.status}`);
    const { embedding } = await res.json() as { embedding: number[] };
    return embedding;
}

export function embeddingToSql(embedding: number[]): string {
    return `[${embedding.join(',')}]`;
}