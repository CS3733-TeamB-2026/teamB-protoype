/** Embedding service URL. Defaults to the local ML sidecar on port 3001. */
const ML_SERVICE = process.env.ML_SERVICE_URL ?? 'http://localhost:3001';

/**
 * Generates a numeric embedding vector for the given text by calling the ML
 * microservice at `ML_SERVICE_URL/embed`.
 *
 * The sidecar wraps `text-embedding-3-small` (1536 dimensions). Throws if the
 * service is unreachable or returns a non-2xx status.
 */
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
