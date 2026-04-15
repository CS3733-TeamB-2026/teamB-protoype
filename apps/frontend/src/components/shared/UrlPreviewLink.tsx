import { useState } from "react";
import { Loader2, TriangleAlert } from "lucide-react";
import type { UrlPreview } from "@/lib/types.ts";

interface Props {
    href: string;
    status: "loading" | "unreachable" | "ok";
    preview: UrlPreview | null;
}

// Full-width clickable link preview strip used in expanded table rows.
// For the form card variant, see UrlPreviewCard.
export function UrlPreviewLink({ href, status, preview }: Props) {
    const [ogImageErrorSrc, setOgImageErrorSrc] = useState<string | null>(null);
    const [faviconErrorSrc, setFaviconErrorSrc] = useState<string | null>(null);

    const ogImageFailed = !!preview?.image && ogImageErrorSrc === preview.image;
    const faviconFailed = !!preview?.favicon && faviconErrorSrc === preview.favicon;

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 px-6 py-3 bg-muted/20 hover:bg-muted/40 transition-colors"
            onClick={(e) => e.stopPropagation()}
        >
            {status === "ok" && preview?.image && !ogImageFailed ? (
                <img
                    src={preview.image}
                    alt=""
                    className="w-16 h-16 rounded object-cover shrink-0"
                    onError={() => setOgImageErrorSrc(preview.image)}
                />
            ) : status === "ok" && preview?.favicon && !faviconFailed ? (
                <img
                    src={preview.favicon}
                    alt=""
                    className="w-8 h-8 rounded shrink-0"
                    onError={() => setFaviconErrorSrc(preview.favicon)}
                />
            ) : null}

            <div className="min-w-0 text-left">
                <p className="text-xs text-muted-foreground truncate">{href}</p>
                {status === "loading" && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Fetching preview...
                    </div>
                )}
                {status === "unreachable" && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <TriangleAlert className="w-3 h-3" />
                        No preview available
                    </div>
                )}
                {status === "ok" && preview && (
                    <>
                        {preview.siteName && (
                            <p className="text-xs text-muted-foreground">{preview.siteName}</p>
                        )}
                        {preview.title && (
                            <p className="text-sm font-medium text-foreground truncate">{preview.title}</p>
                        )}
                        {preview.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">{preview.description}</p>
                        )}
                    </>
                )}
            </div>
        </a>
    );
}
