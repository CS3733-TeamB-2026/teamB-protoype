import { useState, useEffect } from "react";
import { getCachedAvatar, setCachedAvatar } from "@/lib/avatar-cache";

export function useAvatarUrl(
    employeeId: number | undefined,
    profilePhotoURI: string | undefined
): string | undefined {
    const [objectUrl, setObjectUrl] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (employeeId === undefined || !profilePhotoURI) {
            setObjectUrl(undefined);
            return;
        }

        let localUrl: string | undefined;

        const run = async () => {
            const cached = getCachedAvatar(employeeId);
            if (cached) {
                localUrl = URL.createObjectURL(cached);
                setObjectUrl(localUrl);
                return;
            }

            // Signed Supabase URLs are self-authenticating — no Authorization header needed
            try {
                const res = await fetch(profilePhotoURI);
                if (!res.ok) return;
                const blob = await res.blob();
                setCachedAvatar(employeeId, blob);
                localUrl = URL.createObjectURL(blob);
                setObjectUrl(localUrl);
            } catch {
                // Network error — AvatarFallback will show
            }
        };

        void run();

        return () => {
            if (localUrl) URL.revokeObjectURL(localUrl);
            setObjectUrl(undefined);
        };
    }, [employeeId, profilePhotoURI]);

    return objectUrl;
}
