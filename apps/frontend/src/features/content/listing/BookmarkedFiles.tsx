import { useEffect, useState } from "react";
import { useUser } from "@/hooks/use-user.ts";
import { Bookmark, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { ContentIcon } from "@/features/content/components/ContentIcon.tsx";
import { getCategory, getExtension, getOriginalFilename, lookupByFilename } from "@/lib/mime.ts";
import { useAuth0 } from "@auth0/auth0-react";
import type { ContentItem, BookmarkRecord } from "@/lib/types.ts";
import { FilePreview } from "@/features/content/previews/FilePreview.tsx";

function RecentFiles() {
    const [bookmarkedItems, setBookmarkedItems] = useState<ContentItem[]>([]);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { user } = useUser();
    const { getAccessTokenSilently } = useAuth0();

    useEffect(() => {
        if (!user) return;

        const fetchBookmarkedContent = async () => {
            try {
                const token = await getAccessTokenSilently();
                const headers = { Authorization: `Bearer ${token}` };

                const [bookmarkRes, contentRes] = await Promise.all([
                    fetch(`/api/bookmark`, { headers }),
                    fetch(`/api/content?persona=${encodeURIComponent(user.persona)}`, { headers }),
                ]);

                const bookmarks: BookmarkRecord[] = await bookmarkRes.json();
                const content: ContentItem[] = await contentRes.json();

                const bookmarkedIds = new Set(bookmarks.map((b) => b.bookmarkedContentId));
                setBookmarkedItems(content.filter((item) => bookmarkedIds.has(item.id)).slice(0, 5));
                setLoading(false);
            } catch {
                setError("Failed to load bookmarks");
                setLoading(false);
            }
        };

        void fetchBookmarkedContent();
    }, [user, getAccessTokenSilently]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8 gap-3 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <p className="text-sm">Loading bookmarks...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">Unable to load bookmarks</p>
            </div>
        );
    }

    if (bookmarkedItems.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <Bookmark className="w-10 h-10 mx-auto mb-2" />
                <p className="text-sm">No bookmarked files</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {bookmarkedItems.map((item) => {
                const isFile = !!item.fileURI;
                const originalFilename = isFile ? getOriginalFilename(item.fileURI!) : null;
                const mimeType = originalFilename ? lookupByFilename(originalFilename)?.mimeType : null;
                const category = getCategory(mimeType, originalFilename);
                const isExpanded = expandedId === item.id;

                return (
                    <div key={item.id} className="rounded-lg border overflow-hidden">
                        <button
                            type="button"
                            onClick={() => {
                                if (item.linkURL) return;
                                setExpandedId((prev) => (prev === item.id ? null : item.id));
                            }}
                            className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-left"
                        >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                {!item.linkURL &&
                                    (isExpanded ? (
                                        <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />
                                    ) : (
                                        <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground" />
                                    ))}

                                <ContentIcon
                                    category={category}
                                    isLink={!!item.linkURL}
                                    className="w-5 h-5 shrink-0"
                                />

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{item.displayName}</p>
                                    <p className="text-xs text-muted-foreground">
                                        Updated {new Date(item.lastModified).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            {item.linkURL ? (
                                <a
                                    href={item.linkURL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-primary hover:underline shrink-0"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    View →
                                </a>
                            ) : (
                                <span className="text-xs text-muted-foreground shrink-0">
                                    {getExtension(originalFilename || "") || "File"}
                                </span>
                            )}
                        </button>

                        {isExpanded && !item.linkURL && (
                            <div className="border-t bg-muted/10 p-3">
                                <FilePreview
                                    filename={originalFilename || item.displayName}
                                    src={`/api/content/download/${item.id}`}
                                    infoSrc={`/api/content/info/${item.id}`}
                                    mode="inline"
                                />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default RecentFiles;