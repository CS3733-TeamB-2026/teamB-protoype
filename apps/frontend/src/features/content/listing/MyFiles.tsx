import { useEffect, useState } from "react";
import { useUser } from "@/hooks/use-user.ts";
import { FolderOpen, Loader2 } from "lucide-react";
import { ContentIcon } from "@/features/content/components/ContentIcon.tsx";
import { InlineContentPreview } from "@/features/content/previews/InlineContentPreview.tsx";
import {getCategory, getOriginalFilename, lookupByFilename,} from "@/lib/mime.ts";
import { useAuth0 } from "@auth0/auth0-react";
import type { ContentItem } from "@/lib/types.ts";

function MyFiles() {
    const [ownedItems, setOwnedItems] = useState<ContentItem[]>([]);
    const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { user } = useUser();
    const { getAccessTokenSilently } = useAuth0();

    useEffect(() => {
        if (!user) return;

        const fetchContent = async () => {
            try {
                const token = await getAccessTokenSilently();
                const res = await fetch(
                    `/api/content?persona=${encodeURIComponent(user.persona)}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );

                const data: ContentItem[] = await res.json();
                setOwnedItems(data.filter((item) => item.ownerId === user.id).slice(0, 5));
            } catch {
                setError("Failed to load content");
            } finally {
                setLoading(false);
            }
        };

        fetchContent();
    }, [user, getAccessTokenSilently]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8 gap-3 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <p className="text-sm">Loading your files...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">Unable to load your files</p>
            </div>
        );
    }

    if (ownedItems.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <FolderOpen className="w-10 h-10 mx-auto mb-2" />
                <p className="text-sm">No files owned by you</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {ownedItems.map((item) => {
                const isFile = !!item.fileURI;
                const originalFilename = isFile ? getOriginalFilename(item.fileURI!) : null;
                const mimeType = originalFilename
                    ? lookupByFilename(originalFilename)?.mimeType
                    : null;
                const category = getCategory(mimeType, originalFilename);
                const isExpanded = expandedItemId === item.id;

                return (
                    <div key={item.id} className="rounded-lg border overflow-hidden">
                        <button
                            type="button"
                            onClick={() =>
                                setExpandedItemId(isExpanded ? null : item.id)
                            }
                            className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-left"
                        >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <ContentIcon
                                    category={category}
                                    isLink={!!item.linkURL}
                                    className="w-5 h-5 shrink-0"
                                />

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                        {item.displayName}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Updated{" "}
                                        {new Date(item.lastModified).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            <span className="text-xs text-primary shrink-0">
                                {isExpanded ? "Hide" : "View"}
                            </span>
                        </button>

                        {isExpanded && (
                            <div className="border-t bg-background p-3">
                                <InlineContentPreview item={item} />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default MyFiles;