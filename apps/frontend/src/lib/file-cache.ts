// Caches file content to avoid re-fetching when navigating between ViewContent and ViewSingleFile.
// Keyed by download URL (e.g., "/api/content/download/5").

const textCache = new Map<string, string>();
const blobCache = new Map<string, Blob>();

export function getCachedText(src: string): string | undefined {
    return textCache.get(src);
}

export function setCachedText(src: string, text: string): void {
    textCache.set(src, text);
}

export function getCachedBlob(src: string): Blob | undefined {
    return blobCache.get(src);
}

export function setCachedBlob(src: string, blob: Blob): void {
    blobCache.set(src, blob);
}

// Call after saving a file edit so the stale cached content is discarded.
export function invalidateFileCacheById(id: number): void {
    const src = `/api/content/download/${id}`;
    textCache.delete(src);
    blobCache.delete(src);
}
