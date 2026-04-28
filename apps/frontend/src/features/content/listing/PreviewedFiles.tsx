import { useEffect, useState } from "react";
import { useUser } from "@/hooks/use-user.ts";
import { FolderOpen, Loader2 } from "lucide-react";
import { useAuth0 } from "@auth0/auth0-react";
import type { ContentItem } from "@/lib/types.ts";
import { ContentItemCard } from "@/components/shared/ContentItemCard.tsx";

function PreviewedFiles() {
    const [content, setContent] = useState<ContentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const {user} = useUser();

    const { getAccessTokenSilently } = useAuth0();

    useEffect(() => {
        if (!user) return;
        const run = async () => {
            try {
                const token = await getAccessTokenSilently();
                const res = await fetch(`/api/content?persona=${encodeURIComponent(user.persona)}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                const data: ContentItem[] = await res.json();
                setContent(data);
                setLoading(false);

            } catch {
                setError("Failed to load content");
                setLoading(false);
            }
        }
        void run();
    }, [user, getAccessTokenSilently]);

    //sort by lastModified (newest first) and take top 8
    const previewedFiles = [...content]
        .sort((a, b) => new Date(b.lastPreviewed).getTime() - new Date(a.lastPreviewed).getTime())
        .slice(0, 8);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8 gap-3 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <p className="text-sm">Loading recently vi files...</p>
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

    if (previewedFiles.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <FolderOpen className="w-10 h-10 mx-auto mb-2" />
                <p className="text-sm">No recent files</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {previewedFiles.map((item) => (
                <ContentItemCard key={item.id} item={item} />
            ))}
        </div>
    );
}
export default PreviewedFiles;