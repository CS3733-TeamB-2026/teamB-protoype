import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, ClipboardList, FileText, FolderOpen, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Hero } from "@/components/shared/Hero.tsx";
import { FilePreview } from "@/features/content/previews/FilePreview.tsx";
import { UrlPreviewLink } from "@/components/shared/UrlPreviewLink.tsx";
import { getCachedPreview, setCachedPreview } from "@/features/content/previews/preview-cache.ts";
import { ContentStatusBadge } from "@/features/content/components/ContentStatusBadge.tsx";
import { ContentTypeBadge } from "@/features/content/components/ContentTypeBadge.tsx";
import { ExpirationBadge } from "@/features/content/components/ExpirationBadge.tsx";
import { PersonaBadge } from "@/components/shared/PersonaBadge.tsx";
import { getOriginalFilename } from "@/lib/mime.ts";
import type { Collection, ContentItem, UrlPreview } from "@/lib/types.ts";
import { useAuth0 } from "@auth0/auth0-react";
import { usePageTitle } from "@/hooks/use-page-title.ts";
import { Timeline } from "@/features/content/components/Timeline.tsx"
import { useNavigate } from "react-router-dom";
import {Button} from "@/components/ui/button";
import {EmployeeAvatar} from "@/components/shared/EmployeeAvatar.tsx";
import { ContentCollectionsDialog } from "@/features/content/previews/ContentCollectionsDialog";
import { ServiceRequestLinkDialog } from "@/components/shared/ServiceRequestLinkDialog";

/**
 * Full-page viewer for a single content item — handles both file and link types.
 *
 * Reachable at `/file/:id`. Fetches the content item's metadata from
 * `/api/content/:id` (which now includes `serviceRequest` in one fetch), then renders either:
 * - {@link FilePreview} with `mode="full"` for file items, or
 * - a YouTube embed iframe or {@link UrlPreviewLink} for link items.
 *
 * Link OG previews are fetched from `/api/preview` and stored in
 * `preview-cache.ts` so back-navigation doesn't re-fetch.
 */
export function ViewSingleContentItem() {
    /** Content item ID from the URL parameter. */
    const { id } = useParams<{ id: string }>();
    const [item, setItem] = useState<ContentItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [linkPreviewStatus, setLinkPreviewStatus] = useState<"loading" | "ok" | "unreachable">("loading");
    const [linkPreview, setLinkPreview] = useState<UrlPreview | null>(null);
    const [collections, setCollections] = useState<Collection[]>([]);
    const [collectionsDialogOpen, setCollectionsDialogOpen] = useState(false);
    const [srDialogOpen, setSrDialogOpen] = useState(false);
    const navigate = useNavigate();

    usePageTitle("View Content");

    const { getAccessTokenSilently } = useAuth0();

    // Fetch the content item's metadata on mount (or when the URL id changes).
    // The response includes serviceRequest directly — no separate SR fetch needed.
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

    // Fetch collections containing this item so the link text shows the correct count.
    useEffect(() => {
        if (!id) return;
        const load = async () => {
            try {
                const token = await getAccessTokenSilently();
                const res = await fetch(`/api/content/${id}/collections`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) setCollections(await res.json());
            } catch {
                // non-critical — link will just show "Add to collection"
            }
        };
        void load();
    }, [id, getAccessTokenSilently]);

    // Fetch OG preview for link items once the item is loaded.
    useEffect(() => {
        if (!item?.linkURL) return;
        const cached = getCachedPreview(item.linkURL);
        if (cached !== undefined) {
            setLinkPreview(cached);
            setLinkPreviewStatus(cached === null ? "unreachable" : "ok");
            return;
        }
        fetch(`/api/preview?url=${encodeURIComponent(item.linkURL)}`)
            .then((res) => (res.ok ? res.json() : Promise.reject()))
            .then((preview: UrlPreview) => {
                setCachedPreview(item.linkURL!, preview);
                setLinkPreview(preview);
                setLinkPreviewStatus("ok");
            })
            .catch(() => {
                setCachedPreview(item.linkURL!, null);
                setLinkPreview(null);
                setLinkPreviewStatus("unreachable");
            });
    }, [item]);

    const originalFilename = item?.fileURI ? getOriginalFilename(item.fileURI) : null;
    const isLink = !!item?.linkURL;
    const youtubeMatch = item?.linkURL?.match(/[?&]v=([a-zA-Z0-9_-]+)/);
    const linkedSR = item?.serviceRequest ?? null;

    return (
        <>
            <Hero
                icon={FileText}
                title={item?.displayName ?? "Content Viewer"}
                description={isLink ? "View this linked resource" : "Preview and download this file"}
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
                                        <ExpirationBadge expiration={item.expiration} />
                                        <ContentStatusBadge status={item.status} />
                                        <ContentTypeBadge contentType={item.contentType} />
                                        <PersonaBadge persona={item.targetPersona} />
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        {item && (
                            <CardContent className="pt-0 flex flex-col gap-3">
                                <div className="flex items-center justify-between gap-2 text-sm">
                                    {item.owner ? (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <span>Owner:</span>
                                            <span className="text-foreground">{item.owner.firstName} {item.owner.lastName}</span>
                                            <EmployeeAvatar employee={item.owner} size="sm" />
                                        </div>
                                    ) : (
                                        <span />
                                    )}
                                    <button
                                        onClick={() => setSrDialogOpen(true)}
                                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors shrink-0"
                                    >
                                        <ClipboardList className="w-3.5 h-3.5" />
                                        {linkedSR == null ? "+ Add to Service Request" : "In service request"}
                                    </button>
                                </div>
                                <div className="flex items-center justify-between gap-2 text-sm">
                                    {item.tags.length > 0 ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-muted-foreground">Tags</span>
                                            <span>{item.tags.join(", ")}</span>
                                        </div>
                                    ) : (
                                        <span />
                                    )}
                                    <button
                                        onClick={() => setCollectionsDialogOpen(true)}
                                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors shrink-0"
                                    >
                                        <FolderOpen className="w-3.5 h-3.5" />
                                        {collections.length === 0
                                            ? "Add to collection"
                                            : `In ${collections.length} collection${collections.length === 1 ? "" : "s"}`}
                                    </button>
                                </div>
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
                                {isLink && youtubeMatch && (
                                    <iframe
                                        src={`https://www.youtube.com/embed/${youtubeMatch[1]}`}
                                        className="w-full rounded-md border-0"
                                        style={{ minHeight: "480px" }}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        title={item!.displayName}
                                    />
                                )}
                                {isLink && !youtubeMatch && (
                                    <UrlPreviewLink
                                        href={item!.linkURL!}
                                        status={linkPreviewStatus}
                                        preview={linkPreview}
                                    />
                                )}
                            </CardContent>
                        )}
                    </Card>
                )}

            </div>

            {item && (
                <ContentCollectionsDialog
                    contentId={item.id}
                    open={collectionsDialogOpen}
                    onOpenChange={setCollectionsDialogOpen}
                    onCollectionsChange={setCollections}
                />
            )}
            {item && (
                <ServiceRequestLinkDialog
                    contentId={item.id}
                    open={srDialogOpen}
                    onOpenChange={setSrDialogOpen}
                    onServiceReqsChange={(srs) => setItem((prev) => prev ? { ...prev, serviceRequest: srs[0] ?? null } : prev)}
                />
            )}
        </>
    );
}
