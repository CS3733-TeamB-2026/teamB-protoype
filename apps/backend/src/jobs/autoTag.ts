import * as q from "@softeng-app/db";

export async function applyExpirationTagsToAll() {
    const all = await q.Content.queryAllContent();
    const now = new Date();

    for (const item of all) {
        const updated = computeExpirationTags(item.tags, item.expiration, now);
        if (updated) await q.Content.updateTagsOnly(item.id, updated);
    }
}

export async function applyExpirationTagsToOne(contentId: number) {
    const item = await q.Content.queryContentById(contentId);
    if (!item) return;

    const now = new Date();
    const updated = computeExpirationTags(item.tags, item.expiration, now);
    if (updated) await q.Content.updateTagsOnly(item.id, updated);
}

/**
 * Returns the updated tags array if expiration tags need to change, or null if no update needed.
 * Does not mutate the input array.
 */
function computeExpirationTags(
    tags: string[],
    expiration: Date | null | undefined,
    now: Date,
): string[] | null {
    if (!expiration) return null;

    const diff = (expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    const set = new Set(tags);

    if (diff > 7) return null;

    if (diff > 0) {
        if (set.has('Expiring Soon')) return null;
        set.add('Expiring Soon');
    } else {
        if (set.has('Expired')) return null;
        set.delete('Expiring Soon');
        set.add('Expired');
    }

    return [...set];
}
