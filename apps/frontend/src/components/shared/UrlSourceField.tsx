import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input.tsx";
import { UrlPreviewCard, type UrlPreview } from "@/components/shared/UrlPreviewCard.tsx";
import { getCachedPreview, setCachedPreview } from "@/lib/preview-cache.ts";

export type { UrlPreview };

function isValidUrl(url: string): boolean {
    try { new URL(url); return true; } catch { return false; }
}

interface Props {
    value: string;
    onChange: (url: string) => void;
    onPreviewLoaded?: (preview: UrlPreview) => void;
    error?: string | null;
}

export function UrlSourceField({ value, onChange, onPreviewLoaded, error }: Props) {
    const [urlStatus, setUrlStatus] = useState<"idle" | "loading" | "unreachable" | "ok">("idle");
    const [urlPreview, setUrlPreview] = useState<UrlPreview | null>(null);

    const fetchPreview = async (url: string) => {
        if (!url.trim() || !isValidUrl(url)) return;

        const cached = getCachedPreview(url);
        if (cached !== undefined) {
            setUrlPreview(cached);
            setUrlStatus(cached === null ? "unreachable" : "ok");
            if (cached) onPreviewLoaded?.(cached);
            return;
        }

        setUrlStatus("loading");
        try {
            const res = await fetch(`/api/preview?url=${encodeURIComponent(url)}`);
            if (!res.ok) {
                setCachedPreview(url, null);
                setUrlStatus("unreachable");
                return;
            }
            const data: UrlPreview = await res.json();
            setCachedPreview(url, data);
            setUrlPreview(data);
            setUrlStatus("ok");
            onPreviewLoaded?.(data);
        } catch {
            setCachedPreview(url, null);
            setUrlStatus("unreachable");
        }
    };

    // When this component mounts with a pre-filled URL (e.g. switching back to URL mode),
    // show the preview immediately from cache or re-fetch if not cached.
    useEffect(() => {
        if (value) void fetchPreview(value);
        // Intentionally runs on mount only — value is the initial prop.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleChange = (newVal: string) => {
        onChange(newVal);
        setUrlStatus("idle");
        setUrlPreview(null);
    };

    // Don't show stale preview if the parent resets value to "".
    const displayStatus = value ? urlStatus : "idle";
    const displayPreview = value ? urlPreview : null;

    return (
        <div className="flex flex-col gap-2">
            <Input
                type="text"
                placeholder="Enter the URL of the link"
                value={value}
                onChange={(e) => handleChange(e.target.value)}
                onBlur={() => void fetchPreview(value)}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <UrlPreviewCard status={displayStatus} preview={displayPreview} />
        </div>
    );
}
