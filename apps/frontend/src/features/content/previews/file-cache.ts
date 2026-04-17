/**
 * Module-level cache for downloaded file content.
 *
 * Avoids re-fetching the same file when the user navigates between
 * ViewContent (inline preview) and ViewSingleFile (full-page preview).
 * Both caches are keyed by the download URL, e.g. "/api/content/download/5".
 *
 * The cache lives for the entire browser session and is never automatically
 * evicted — call {@link invalidateFileCacheById} after a file is edited so the
 * stale bytes don't show up in the next preview.
 */

const textCache = new Map<string, string>();
const blobCache = new Map<string, Blob>();

/**
 * Returns the cached text content for the given URL, or `undefined` if it has
 * not been fetched yet.
 */
export function getCachedText(src: string): string | undefined {
    return textCache.get(src);
}

/**
 * Stores text content in the cache under the given URL.
 * Called by {@link FilePreview} after a successful text fetch.
 */
export function setCachedText(src: string, text: string): void {
    textCache.set(src, text);
}

/**
 * Returns the cached Blob for the given URL, or `undefined` if it has not been
 * fetched yet. Used for binary formats (images, PDFs, spreadsheets, etc.).
 */
export function getCachedBlob(src: string): Blob | undefined {
    return blobCache.get(src);
}

/**
 * Stores a Blob in the cache under the given URL.
 * Called by {@link FilePreview} after a successful binary fetch.
 */
export function setCachedBlob(src: string, blob: Blob): void {
    blobCache.set(src, blob);
}

/**
 * Removes both the text and blob cache entries for the content item with the
 * given database ID. Call this after saving a file edit so the next preview
 * re-fetches the updated file instead of showing the old version.
 */
export function invalidateFileCacheById(id: number): void {
    const src = `/api/content/download/${id}`;
    textCache.delete(src);
    blobCache.delete(src);
}
