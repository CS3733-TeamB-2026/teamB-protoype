const ML_SERVICE = process.env.ML_SERVICE_URL ?? 'http://localhost:3001';

export async function generateEmbedding(text: string): Promise<number[]> {
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