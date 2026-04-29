import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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
import { Timeline } from "@/features/content/components/Timeline.tsx"
import { useNavigate } from "react-router-dom";
import {Button} from "@/components/ui/button";
import {EmployeeAvatar} from "@/components/shared/EmployeeAvatar.tsx";

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
    const navigate = useNavigate();

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

            } catch (error) {
                setError("File not found or failed to load.");
                console.error(error);
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

            <div className="max-w-5xl mx-auto my-8 px-4 flex flex-col gap-6">

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => navigate("/files")}
                        className="text-sm text-muted-foreground hover:text-foreground w-fit"
                    >
                        View Content
                    </Button>
                </div>

                {(loading || error || item) && (
                    <Card className="shadow-sm">
                        <CardHeader>
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    {loading ? (
                                        <div className="flex items-center gap-3 text-muted-foreground py-1">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <p className="text-sm">Loading...</p>
                                        </div>
                                    ) : error ? (
                                        <Alert variant="destructive">
                                            <AlertCircle />
                                            <AlertDescription>{error}</AlertDescription>
                                        </Alert>
                                    ) : item && (
                                        <CardTitle className="text-2xl text-primary">{item.displayName}</CardTitle>
                                    )}
                                </div>
                                {item && (
                                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                                        <ContentStatusBadge status={item.status} />
                                        <ContentTypeBadge contentType={item.contentType} />
                                        <PersonaBadge persona={item.targetPersona} />
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        {item && (
                            <CardContent className="pt-0 flex flex-col gap-3">
                                {item.owner && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground w-fit">
                                        <span>Owner:</span>
                                        <span className="text-foreground">{item.owner.firstName} {item.owner.lastName}</span>
                                        <EmployeeAvatar employee={item.owner} size="sm" />
                                    </div>
                                )}
                                {item.tags.length > 0 && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-muted-foreground">Tags</span>
                                        <span>{item.tags.join(", ")}</span>
                                    </div>
                                )}
                                <Timeline
                                    created={item.created}
                                    expiration={item.expiration ?? null}
                                    lastModified={item.lastModified}
                                />
                                {originalFilename && (
                                    <FilePreview
                                        filename={originalFilename}
                                        src={`/api/content/download/${item.id}`}
                                        infoSrc={`/api/content/info/${item.id}`}
                                        mode="full"
                                    />
                                )}
                            </CardContent>
                        )}
                    </Card>
                )}

            </div>
        </>
    );
}
