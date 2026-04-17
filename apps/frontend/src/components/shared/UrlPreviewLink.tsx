import { useState } from "react";
import { Loader2, TriangleAlert } from "lucide-react";
import type { UrlPreview } from "@/lib/types.ts";

interface Props {
    /** The URL to open when the strip is clicked. */
    href: string;
    /**
     * Current fetch state for the preview metadata.
     * There is no `"idle"` state here — the strip is only rendered once the
     * row is expanded and a fetch is already in flight or complete.
     */
    status: "loading" | "unreachable" | "ok";
    /** The preview metadata to display when `status === "ok"`. */
    preview: UrlPreview | null;
}

/**
 * Full-width clickable link preview strip shown inside an expanded table row
 * in {@link ViewContent}.
 *
 * Renders the URL's Open Graph image/favicon alongside its title, site name,
 * and description. Falls back gracefully when images fail to load (tracked per
 * URL so stale error state doesn't bleed into a different link's preview).
 *
 * For the card variant used inside the Add/Edit content form, see
 * {@link UrlPreviewCard}.
 */
export function UrlPreviewLink({ href, status, preview }: Props) {
    // Track which specific image URL triggered a load error. This prevents an
    // error for one URL from incorrectly hiding the image for a different URL.
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
