const avatarCache = new Map<number, Blob>();

export function getCachedAvatar(id: number): Blob | undefined {
    return avatarCache.get(id);
}

export function setCachedAvatar(id: number, blob: Blob): void {
    avatarCache.set(id, blob);
}

export function invalidateAvatarCache(id: number): void {
    avatarCache.delete(id);
}
