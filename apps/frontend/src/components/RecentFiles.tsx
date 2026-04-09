import React, { useEffect, useState } from "react";
import { FolderOpen, Loader2 } from "lucide-react";
import { ContentIcon } from "@/components/shared/ContentIcon.tsx";
import { getCategory, getExtension, getOriginalFilename, lookupByFilename } from "@/helpers/mime.ts";

interface ContentItem {
    id: number;
    displayName: string;
    linkURL: string | null;
    fileURI: string | null;
    lastModified: string;
}

function RecentFiles() {
    const [content, setContent] = useState<ContentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [user] = React.useState(() => {
        return JSON.parse(localStorage.getItem("user") || "null");
    });

    useEffect(() => {
        fetch(`/api/content?persona=${encodeURIComponent(user.persona)}`)
            .then((res) => res.json())
            .then((data: ContentItem[]) => {
                setContent(data);
                setLoading(false);
            })
            .catch(() => {
                setError("Failed to load content.");
                setLoading(false);
            });
    }, [user.persona]);

    //sort by lastModified (newest first) and take top 5
    const recentFiles = [...content]
        .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
        .slice(0, 5);

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

                return (
                    <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
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
                                {getExtension(originalFilename || '') || 'File'}
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
export default RecentFiles;