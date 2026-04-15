import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AlertCircle, ArrowLeft, FileText, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Hero } from "@/components/shared/Hero.tsx";
import { FilePreview } from "@/components/FilePreview.tsx";
import { ContentStatusBadge } from "@/components/shared/ContentStatusBadge.tsx";
import { ContentTypeBadge } from "@/components/shared/ContentTypeBadge.tsx";
import { PersonaBadge } from "@/components/shared/PersonaBadge.tsx";
import { getOriginalFilename } from "@/lib/mime.ts";
import type { ContentItem } from "@/lib/types.ts";
import { useAuth0 } from "@auth0/auth0-react";

export function ViewSingleFile() {
    const { id } = useParams<{ id: string }>();
    const [item, setItem] = useState<ContentItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { getAccessTokenSilently } = useAuth0();

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
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-destructive">
                            <AlertCircle className="w-8 h-8" />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
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
