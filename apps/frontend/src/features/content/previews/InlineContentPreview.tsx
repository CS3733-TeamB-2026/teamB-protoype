import { useEffect, useState } from "react";
import { FilePreview } from "@/features/content/previews/FilePreview.tsx";
import { getCachedPreview, setCachedPreview } from "@/features/content/previews/preview-cache.ts";
import { UrlPreviewLink } from "@/components/shared/UrlPreviewLink.tsx";
import { getOriginalFilename } from "@/lib/mime.ts";
import type { ContentItem, UrlPreview } from "@/lib/types.ts";

interface Props {
    item: ContentItem;
    className?: string;
}

export function InlineContentPreview({ item, className = "" }: Props) {
    const [preview, setPreview] = useState<UrlPreview | null | undefined>(undefined);

    useEffect(() => {
        if (!item.linkURL) return;

        const cached = getCachedPreview(item.linkURL);
        if (cached !== undefined) {
            setPreview(cached);
            return;
        }

        setPreview(undefined);
        fetch(`/api/preview?url=${encodeURIComponent(item.linkURL)}`)
            .then((res) => (res.ok ? res.json() : Promise.reject()))
            .then((data: UrlPreview) => {
                setCachedPreview(item.linkURL!, data);
                setPreview(data);
            })
            .catch(() => {
                setCachedPreview(item.linkURL!, null);
                setPreview(null);
            });
    }, [item.id, item.linkURL]);

    if (item.linkURL) {
        const youtubeMatch = item.linkURL.match(/[?&]v=([a-zA-Z0-9_-]+)/);

        if (youtubeMatch) {
            return (
                <div className={className}>
                    <iframe
                        src={`https://www.youtube.com/embed/${youtubeMatch[1]}`}
                        className="w-full rounded-lg border"
                        style={{ minHeight: "320px" }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={item.linkURL}
                    />
                </div>
            );
        }

        return (
            <div className={`rounded-lg border overflow-hidden ${className}`}>
                <UrlPreviewLink
                    href={item.linkURL}
                    status={preview === undefined ? "loading" : preview === null ? "unreachable" : "ok"}
                    preview={preview ?? null}
                />
            </div>
        );
    }

    if (!item.fileURI) return null;

    return (
        <div className={`rounded-lg border overflow-hidden bg-background ${className}`}>
            <FilePreview
                filename={getOriginalFilename(item.fileURI)}
                src={`/api/content/download/${item.id}`}
                infoSrc={`/api/content/info/${item.id}`}
            />
        </div>
    );
}
