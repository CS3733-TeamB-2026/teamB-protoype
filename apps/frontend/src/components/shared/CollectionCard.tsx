import React from "react";
import { Link } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { FolderLibraryIcon, LinkSquare01Icon, LockIcon, EarthIcon } from "@hugeicons/core-free-icons";
import type { Collection } from "@/lib/types.ts";
import { Card } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";

interface Props {
    collection: Collection;
    /** Extra right-side content rendered before the nav button. */
    actions?: React.ReactNode;
}

/**
 * Compact one-line row for a single collection.
 *
 * Renders the collection icon, display name, item count, a public/private
 * indicator, and a nav button that routes to `/collections/:id`.
 */
export function CollectionCard({ collection, actions }: Props) {
    const itemCount = collection.items.length;

    return (
        <Card className="flex flex-row items-center justify-between p-3 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-5 h-5 shrink-0 flex items-center justify-center text-muted-foreground">
                    <HugeiconsIcon icon={FolderLibraryIcon} className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{collection.displayName}</p>
                    <p className="text-xs text-muted-foreground">
                        {itemCount} {itemCount === 1 ? "item" : "items"}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                {actions}
                <span
                    className="text-muted-foreground"
                    title={collection.public ? "Public" : "Private"}
                >
                    <HugeiconsIcon
                        icon={collection.public ? EarthIcon : LockIcon}
                        className="w-4 h-4"
                    />
                </span>
                <Button variant="ghost" size="icon" asChild title="Open collection">
                    <Link to={`/collections/${collection.id}`}>
                        <HugeiconsIcon icon={LinkSquare01Icon} className="w-4 h-4" />
                    </Link>
                </Button>
            </div>
        </Card>
    );
}
