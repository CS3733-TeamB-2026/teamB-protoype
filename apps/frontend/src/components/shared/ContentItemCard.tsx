import React from "react";
import { Link } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { LinkSquare01Icon } from "@hugeicons/core-free-icons";
import type { ContentItem } from "@/lib/types.ts";
import { ContentIcon } from "@/features/content/components/ContentIcon.tsx";
import { ContentExtBadge } from "@/features/content/components/ContentExtBadge.tsx";
import { getCategory, getExtension, getOriginalFilename, lookupByFilename } from "@/lib/mime.ts";

interface Props {
    item: ContentItem;
    /** Defaults to "Updated {lastModified}". */
    subtitle?: React.ReactNode;
    /** Extra right-side content rendered before the nav button. */
    actions?: React.ReactNode;
}

const btnClass = "w-8 h-8 flex items-center justify-center rounded-md transition-colors text-muted-foreground hover:text-foreground";

export function ContentItemCard({ item, subtitle, actions }: Props) {
    const originalFilename = item.fileURI ? getOriginalFilename(item.fileURI) : null;
    const mimeType = originalFilename ? lookupByFilename(originalFilename)?.mimeType : null;
    const category = getCategory(mimeType, originalFilename);
    const ext = getExtension(originalFilename ?? "") || null;

    const defaultSubtitle = `Updated ${new Date(item.lastModified).toLocaleDateString()}`;

    const navButton = (() => {
        const icon = <HugeiconsIcon icon={LinkSquare01Icon} className="w-4 h-4" />;
        if (item.fileURI) return (
            <Link to={`/file/${item.id}`} onClick={(e) => e.stopPropagation()}>
                <button className={btnClass} title="View file">{icon}</button>
            </Link>
        );
        if (item.linkURL) return (
            <a href={item.linkURL} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                <button className={btnClass} title="Open link">{icon}</button>
            </a>
        );
        return (
            <button className="w-8 h-8 flex items-center justify-center rounded-md opacity-30 cursor-not-allowed text-muted-foreground" title="No file or link" disabled>
                {icon}
            </button>
        );
    })();

    return (
        <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <ContentIcon
                    category={category}
                    isLink={!!item.linkURL}
                    className="w-5 h-5 shrink-0"
                />
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
        </div>
    );
}
