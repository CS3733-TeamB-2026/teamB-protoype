const ML_SERVICE = process.env.ML_SERVICE_URL ?? 'http://localhost:3001';

export async function generateEmbedding(text: string): Promise<number[]> {
    const res = await fetch(`${ML_SERVICE}/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error(`ML service /embed failed: ${res.status}`);
    const { embedding } = await res.json() as { embedding: number[] };
    return embedding;
}
