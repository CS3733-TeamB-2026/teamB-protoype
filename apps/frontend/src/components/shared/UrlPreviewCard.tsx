import { useState } from "react";
import { Card } from "@/components/ui/card.tsx";
import { Loader2, TriangleAlert } from "lucide-react";
import { ContentIcon } from "@/components/shared/ContentIcon.tsx";

export type UrlPreview = {
    title: string | null;
    description: string | null;
    image: string | null;
    siteName: string | null;
    favicon: string | null;
};

interface Props {
    status: "idle" | "loading" | "unreachable" | "ok";
    preview: UrlPreview | null;
}

export function UrlPreviewCard({ status, preview }: Props) {
    // Track which specific URL failed, so the error doesn't carry over when the preview changes.
    const [ogImageErrorSrc, setOgImageErrorSrc] = useState<string | null>(null);
    const [faviconErrorSrc, setFaviconErrorSrc] = useState<string | null>(null);

    const ogImageFailed = !!preview?.image && ogImageErrorSrc === preview.image;
    const faviconFailed = !!preview?.favicon && faviconErrorSrc === preview.favicon;

    if (status === "idle") return null;

    if (status === "loading") {
        return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Fetching preview...
            </div>
        );
    }

    if (status === "unreachable") {
        return (
            <div className="flex items-center gap-2 rounded-md bg-yellow-50 border border-yellow-200 px-3 py-2 text-sm text-yellow-800">
                <TriangleAlert className="h-4 w-4 shrink-0" />
                URL may be unreachable or doesn't support previews.
            </div>
        );
    }

    if (!preview) return null;

    return (
        <Card className="text-left p-4">
            <div className="flex items-center gap-4">
                {preview.image && !ogImageFailed ? (
                    <img
                        src={preview.image}
                        alt=""
                        className="w-16 h-16 rounded object-cover shrink-0"
                        onError={() => setOgImageErrorSrc(preview.image)}
                    />
                ) : preview.favicon && !faviconFailed ? (
                    <img
                        src={preview.favicon}
                        alt=""
                        className="w-8 h-8 rounded shrink-0"
                        onError={() => setFaviconErrorSrc(preview.favicon)}
                    />
                ) : (
                    <ContentIcon category="other" isLink={true} className="w-8 h-8" />
                )}
                <div className="min-w-0">
                    {preview.siteName && <p className="text-xs text-muted-foreground">{preview.siteName}</p>}
                    {preview.title && <p className="text-sm font-medium text-foreground truncate">{preview.title}</p>}
                    {preview.description && <p className="text-xs text-muted-foreground line-clamp-2">{preview.description}</p>}
                </div>
            </div>
        </Card>
    );
}