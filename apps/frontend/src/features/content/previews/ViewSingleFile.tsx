import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AlertCircle, ArrowLeft, FileText, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Hero } from "@/components/shared/Hero.tsx";
import { FilePreview } from "@/features/content/previews/FilePreview.tsx";
import { ContentStatusBadge } from "@/features/content/components/ContentStatusBadge.tsx";
import { ContentTypeBadge } from "@/features/content/components/ContentTypeBadge.tsx";
import { PersonaBadge } from "@/components/shared/PersonaBadge.tsx";
import { getOriginalFilename } from "@/lib/mime.ts";
import type { ContentItem } from "@/lib/types.ts";
import { useAuth0 } from "@auth0/auth0-react";
import { usePageTitle } from "@/hooks/use-page-title.ts";

/**
 * Full-page file viewer for a single content item.
 *
 * Reachable at `/file/:id` (linked from the open-external icon in ViewContent).
 * Fetches the content item's metadata from `/api/content/:id`, then delegates
 * rendering to {@link FilePreview} with `mode="full"` so the PDF/DOCX viewer
 * scrolls vertically and images are displayed at larger size.
 *
 * File bytes themselves are fetched and cached by FilePreview — this page only
 * needs the item metadata to resolve the original filename and pass it down.
 */
export function ViewSingleFile() {
    /** Content item ID from the URL parameter. */
    const { id } = useParams<{ id: string }>();
    const [item, setItem] = useState<ContentItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    usePageTitle("View File");

    const { getAccessTokenSilently } = useAuth0();

    // Fetch the content item's metadata on mount (or when the URL id changes).
    // The file bytes are not fetched here — FilePreview handles that separately.
    useEffect(() => {
        const fetchItem = async () => {
            try {
                const token = await getAccessTokenSilently();
                const res = await fetch(`/api/content/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error(`${res.status}`);
                const data: ContentItem = await res.json();
                setItem(data);
            } catch {
                setError("File not found or failed to load.");
            } finally {
                setLoading(false);
            }
        };
        void fetchItem();
    }, [id, getAccessTokenSilently]);

    const originalFilename = item?.fileURI ? getOriginalFilename(item.fileURI) : null;

    return (
        <>
            <Hero
                icon={FileText}
                title={item?.displayName ?? "File Viewer"}
                description="Preview and download this file"
            />

            <Card className="shadow-lg max-w-5xl mx-auto my-8">
                <CardHeader>
                    <Link to="/files" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2 w-fit">
                        <ArrowLeft className="w-4 h-4" /> Back to files
                    </Link>
                    {item && (
                        <CardTitle className="text-2xl text-primary">{item.displayName}</CardTitle>
                    )}
                </CardHeader>

                <CardContent>
                    {loading && (
                        <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <p className="text-sm">Loading...</p>
                        </div>
                    )}
                    {error && (
                        <Alert variant="destructive" className="my-4">
                            <AlertCircle />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    {item && (
                        <div className="space-y-4">
                            <div className="flex flex-wrap gap-2 text-sm">
                                {item.owner && (
                                    <span className="text-muted-foreground">
                                        Owner: <span className="text-foreground">{item.owner.firstName} {item.owner.lastName}</span>
                                    </span>
                                )}
                                <ContentStatusBadge status={item.status} />
                                <ContentTypeBadge contentType={item.contentType} />
                                <PersonaBadge persona={item.targetPersona} />
                            </div>

                            {originalFilename && (
                                <FilePreview
                                    filename={originalFilename}
                                    src={`/api/content/download/${item.id}`}
                                    infoSrc={`/api/content/info/${item.id}`}
                                    mode="full"
                                />
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </>
    );
}
