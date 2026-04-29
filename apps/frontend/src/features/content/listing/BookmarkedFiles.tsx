import { useEffect, useState } from "react";
import { useUser } from "@/hooks/use-user.ts";
import { Bookmark, Loader2 } from "lucide-react";
import { useAuth0 } from "@auth0/auth0-react";
import type { ContentItem, BookmarkRecord } from "@/lib/types.ts";
import { ContentItemCard } from "@/components/shared/ContentItemCard.tsx";

function RecentFiles() {
    const [bookmarkedItems, setBookmarkedItems] = useState<ContentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const {user} = useUser();
    const { getAccessTokenSilently } = useAuth0();

    useEffect(() => {
        if (!user) return;
        const fetchBookmarkedContent = async () => {
            try {
                const token = await getAccessTokenSilently();
                const headers = { Authorization: `Bearer ${token}` };

                // Fetch both in parallel; bookmark IDs are cross-referenced against
                // the full content list because /api/bookmark returns IDs only.
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
            {bookmarkedItems.map((item) => (
                <ContentItemCard key={item.id} item={item} />
            ))}
        </div>
    );
}

export default RecentFiles;