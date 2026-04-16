import type { UrlPreview } from "@/lib/types.ts";

/**
 * Module-level cache for URL link previews (Open Graph metadata).
 *
 * The cache persists for the entire browser session. The three possible states
 * for any URL are:
 *  - `undefined` (key absent) — preview has not been requested yet
 *  - `null`                   — request was made but the URL was unreachable or
 *                               returned an error
 *  - `UrlPreview`             — successful result with title, description, etc.
 *
 * Storing `null` explicitly lets callers distinguish "still loading" from
 * "already tried and failed", so they don't retry on every render.
 */
const cache = new Map<string, UrlPreview | null>();

/**
 * Returns the cached preview for `url`.
 * - `undefined` → not yet fetched (caller should fire the request)
 * - `null`      → previously fetched but unreachable
 * - `UrlPreview`→ successful metadata
 */
export function getCachedPreview(url: string): UrlPreview | null | undefined {
    return cache.get(url);
}

/**
 * Stores a preview result (or `null` for a failed fetch) in the cache.
 * Called by {@link ViewContent} after each `/api/preview` response.
 */
export function setCachedPreview(url: string, preview: UrlPreview | null): void {
    cache.set(url, preview);
}
