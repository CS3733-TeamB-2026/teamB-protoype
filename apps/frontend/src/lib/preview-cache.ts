import type { UrlPreview } from "@/components/shared/UrlPreviewCard.tsx";

// Module-level singleton — persists for the entire app session.
// undefined (key absent) = not yet fetched
// null = fetched but URL was unreachable/errored
// UrlPreview = successful result
const cache = new Map<string, UrlPreview | null>();

export function getCachedPreview(url: string): UrlPreview | null | undefined {
    return cache.get(url);
}

export function setCachedPreview(url: string, preview: UrlPreview | null): void {
    cache.set(url, preview);
}
