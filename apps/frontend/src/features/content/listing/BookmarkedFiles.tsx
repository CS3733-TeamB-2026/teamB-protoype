import { useEffect, useState } from "react";
import { useUser } from "@/hooks/use-user.ts";
import { ChevronDown, ChevronRight, FolderOpen, Loader2 } from "lucide-react";
import { ContentIcon } from "@/features/content/components/ContentIcon.tsx";
import { getCategory, getExtension, getOriginalFilename, lookupByFilename } from "@/lib/mime.ts";
import { useAuth0 } from "@auth0/auth0-react";
import type { ContentItem } from "@/lib/types.ts";
import { InlineContentPreview } from "@/features/content/previews/InlineContentPreview.tsx";

function RecentFiles() {
    const [content, setContent] = useState<ContentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const {user} = useUser();
    const { getAccessTokenSilently } = useAuth0();

    useEffect(() => {
        if (!user) return;
        const run = async () => {
            try {
                const token = await getAccessTokenSilently();
                const res = await fetch(`/api/content?persona=${encodeURIComponent(user.persona)}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data: ContentItem[] = await res.json();
                setContent(data);
                setLoading(false);
            } catch {
                setError("Failed to load content");
                setLoading(false);
            }
        };
        void run();
    }, [user, getAccessTokenSilently]);

    const recentFiles = [...content]
        .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
        .slice(0, 8);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8 gap-3 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <p className="text-sm">Loading recent files...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">Unable to load recent files</p>
            </div>
        );
    }

    if (recentFiles.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <FolderOpen className="w-10 h-10 mx-auto mb-2" />
                <p className="text-sm">No recent files</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {recentFiles.map((item) => {
                const isFile = !!item.fileURI;
                const originalFilename = isFile ? getOriginalFilename(item.fileURI!) : null;
                const mimeType = originalFilename ? lookupByFilename(originalFilename)?.mimeType : null;
                const category = getCategory(mimeType, originalFilename);
                const isExpanded = expandedId === item.id;

                return (
                    <div key={item.id} className="rounded-lg border overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setExpandedId((prev) => (prev === item.id ? null : item.id))}
                            className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-left"
                        >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                {isExpanded ? (
                                    <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />
                                ) : (
                                    <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground" />
                                )}
                                <ContentIcon category={category} isLink={!!item.linkURL} className="w-5 h-5 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{item.displayName}</p>
                                    <p className="text-xs text-muted-foreground">
                                        Updated {new Date(item.lastModified).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <span className="text-xs text-muted-foreground shrink-0">
                                {item.linkURL ? "Link" : getExtension(originalFilename || "") || "File"}
                            </span>
                        </button>
                        {isExpanded && (
                            <div className="border-t bg-muted/10 p-3">
                                <InlineContentPreview item={item} />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
export default RecentFiles;
