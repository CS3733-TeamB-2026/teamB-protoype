import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { LinkSquare01Icon } from "@hugeicons/core-free-icons";
import type { ContentItem, UrlPreview } from "@/lib/types.ts";
import { ContentIcon } from "@/features/content/components/ContentIcon.tsx";
import { ContentExtBadge } from "@/features/content/components/ContentExtBadge.tsx";
import { getCategory, getExtension, getOriginalFilename, lookupByFilename } from "@/lib/mime.ts";
import { getCachedPreview, setCachedPreview } from "@/features/content/previews/preview-cache.ts";
import { Button } from "@/components/ui/button.tsx";
import { Card } from "@/components/ui/card.tsx";

interface Props {
    item: ContentItem;
    /** Defaults to "Updated {lastModified}". */
    subtitle?: React.ReactNode;
    /** Extra right-side content rendered before the nav button. */
    actions?: React.ReactNode;
}

/**
 * Compact one-line row for a single content item.
 *
 * Used across dashboard listing cards and collection detail views. Renders a
 * favicon (for links) or `ContentIcon` (for files), display name, subtitle,
 * a `ContentExtBadge`, and a nav button that routes to `/file/:id` for files
 * or opens `linkURL` in a new tab for links.
 *
 * Link favicons are fetched via `/api/preview` and shared with the session-level
 * `preview-cache.ts`. The initializer seeds from cache so favicons already loaded
 * by ViewContent appear immediately with no extra request.
 *
 * The `actions` slot renders between the subtitle text and the badge, allowing
 * callers to inject urgency badges, drag handles, or remove buttons without
 * altering the base layout.
 */
export function ContentItemCard({ item, subtitle, actions }: Props) {
    const originalFilename = item.fileURI ? getOriginalFilename(item.fileURI) : null;
    const mimeType = originalFilename ? lookupByFilename(originalFilename)?.mimeType : null;
    const category = getCategory(mimeType, originalFilename);
    const ext = getExtension(originalFilename ?? "") || null;

    // undefined = not yet fetched, null = fetch failed, UrlPreview = success
    const [preview, setPreview] = useState<UrlPreview | null | undefined>(() =>
        item.linkURL ? getCachedPreview(item.linkURL) : undefined
    );

    useEffect(() => {
        if (!item.linkURL) return;
        // Skip fetch if already attempted — null means the previous request failed.
        if (getCachedPreview(item.linkURL) !== undefined) return;
        fetch(`/api/preview?url=${encodeURIComponent(item.linkURL)}`)
            .then((r) => r.json())
            .then((p: UrlPreview) => {
                setCachedPreview(item.linkURL!, p);
                setPreview(p);
            })
            .catch(() => {
                setCachedPreview(item.linkURL!, null);
                setPreview(null);
            });
    }, [item.linkURL]);

    const defaultSubtitle = `Updated ${new Date(item.lastModified).toLocaleDateString()}`;

    // Disabled ghost button when item has neither a file nor a link — preserves right-side alignment.
    const navButton = (() => {
        const icon = <HugeiconsIcon icon={LinkSquare01Icon} className="w-4 h-4" />;
        if (item.fileURI) return (
            <Button variant="ghost" size="icon" asChild onClick={(e) => e.stopPropagation()} title="View file">
                <Link to={`/file/${item.id}`}>{icon}</Link>
            </Button>
        );
        if (item.linkURL) return (
            <Button variant="ghost" size="icon" asChild onClick={(e) => e.stopPropagation()} title="Open link">
                <a href={item.linkURL} target="_blank" rel="noopener noreferrer">{icon}</a>
            </Button>
        );
        return (
            <Button variant="ghost" size="icon" disabled title="No file or link">
                {icon}
            </Button>
        );
    })();

    return (
        <Card className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                    {item.linkURL && preview?.favicon ? (
                        <img src={preview.favicon} alt="" className="size-full object-contain" />
                    ) : (
                        <ContentIcon category={category} isLink={!!item.linkURL} className="w-5 h-5" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.displayName}</p>
                    <p className="text-xs text-muted-foreground">
                    {subtitle ?? defaultSubtitle}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                {actions}
                <ContentExtBadge category={category} ext={ext} isLink={!!item.linkURL} />
                {navButton}
            </div>
        </Card>
    );
}
