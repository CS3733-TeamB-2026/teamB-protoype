import React, { useEffect, useState } from "react";
import DocViewer, { DocViewerRenderers } from "@iamjariwala/react-doc-viewer";
import "@iamjariwala/react-doc-viewer/dist/index.css";
import {
    AlertCircle,
    Bookmark,
    BookmarkCheck,
    ChevronDown,
    ChevronRight,
    Download,
    FolderOpen,
    Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card.tsx";
import { Hero } from "@/components/shared/Hero.tsx";
import {
    ContentIcon,
    ExtBadge,
} from "@/components/shared/Mime.tsx";
import {
    getCategory,
    getExtension,
    getOriginalFilename,
    getPreviewMode,
    lookupByFilename,
    type PreviewMode,
} from "@/helpers/mime";

// Matches the Content model from Prisma (with joined owner)
interface ContentItem {
    id: number;
    displayName: string;
    linkURL: string | null;
    fileURI: string | null;
    ownerID: number | null;
    owner: {
        id: number;
        firstName: string;
        lastName: string;
    } | null;
    lastModified: string;
    expiration: string | null;
    contentType: string;
    targetPersona: string;
    status: string | null;
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FilesPage() {
    const [content, setContent] = useState<ContentItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [bookmarks, setBookmarks] = useState<Set<number>>(new Set());
    const [fileSizes, setFileSizes] = useState<Record<number, number | null>>(
        {},
    );
    const [fileUrls, setFileUrls] = useState<Record<number, string>>({});
    const [textContents, setTextContents] = useState<Record<number, string>>(
        {},
    );
    const [linkPreviews, setLinkPreviews] = useState<
        Record<
            number,
            {
                title: string | null;
                description: string | null;
                image: string | null;
                siteName: string | null;
                favicon: string | null;
            }
        >
    >({});
    const [user] = React.useState(() => {
        return JSON.parse(localStorage.getItem("user") || "null");
    });

    useEffect(() => {
        fetch(`/api/content?persona=${encodeURIComponent(user.persona)}`)
            .then((res) => res.json())
            .then((data: ContentItem[]) => {
                setContent(data);
                data.filter((item) => item.linkURL).forEach((item) => {
                    fetch(
                        `/api/preview?url=${encodeURIComponent(item.linkURL!)}`,
                    )
                        .then((res) => {
                            if (!res.ok)
                                throw new Error(`preview ${res.status}`);
                            return res.json();
                        })
                        .then((preview) =>
                            setLinkPreviews((prev) => ({
                                ...prev,
                                [item.id]: preview,
                            })),
                        )
                        .catch(() =>
                            setLinkPreviews((prev) => ({
                                ...prev,
                                [item.id]: {
                                    title: null,
                                    description: null,
                                    image: null,
                                    siteName: null,
                                    favicon: null,
                                },
                            })),
                        );
                });
            })
            .catch(() => setError("Failed to load content."));
    }, []);

    function toggleExpand(item: ContentItem, mimeType: string | null) {
        const id = item.id;
        setExpandedId((prev) => (prev === id ? null : id));

        if (!item.fileURI) return;

        const preview = getPreviewMode(mimeType);

        // Fetch file size
        if (!(id in fileSizes)) {
            fetch(`/api/content/info/${id}`)
                .then((res) => res.json())
                .then((meta) =>
                    setFileSizes((prev) => ({
                        ...prev,
                        [id]: meta?.size ?? null,
                    })),
                )
                .catch(() => setFileSizes((prev) => ({ ...prev, [id]: null })));
        }

        // Only fetch content if previewable
        if (preview === "none") return;

        if (preview === "text") {
            if (!(id in textContents)) {
                fetch(`/api/content/download/${id}`)
                    .then((res) => res.text())
                    .then((text) =>
                        setTextContents((prev) => ({ ...prev, [id]: text })),
                    )
                    .catch(console.error);
            }
        } else {
            if (!(id in fileUrls)) {
                fetch(`/api/content/download/${id}`)
                    .then((res) => res.blob())
                    .then((blob) =>
                        setFileUrls((prev) => ({
                            ...prev,
                            [id]: URL.createObjectURL(blob),
                        })),
                    )
                    .catch(console.error);
            }
        }
    }

    function toggleBookmark(id: number, e: React.MouseEvent) {
        e.stopPropagation();
        setBookmarks((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-destructive">
                <AlertCircle className="w-8 h-8" />
                <p className="text-sm font-medium">{error}</p>
            </div>
        );
    }
    if (content.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
                <FolderOpen className="w-10 h-10" />
                <p className="text-sm">No content found.</p>
            </div>
        );
    }
    const handleDelete = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const res = await fetch(`/api/content`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
        });

        if (res.ok) {
            setContent(content.filter((item) => item.id !== id));
        }
    };

    return (
        <>
            <Hero
                icon="content"
                title="Hanover Insurance - Content Management Application"
                description="CS3733 Team B D26"
            />

            <Card className="shadow-lg max-w-5xl mx-auto my-8 text-center">
                <CardHeader>
                    <CardTitle className="text-3xl text-primary mt-4">
                        Content
                    </CardTitle>
                    <CardDescription>
                        Total Users: {content.length}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {/* column header */}
                    <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] items-center gap-x-4 px-3 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground select-none">
                        <span className="w-5" />
                        <span>Name</span>
                        <span className="hidden sm:block w-48 text-right">
                            Owner
                        </span>
                        <span className="hidden sm:block w-28 text-right">
                            Status
                        </span>
                        <span className="hidden sm:block w-18 text-center">
                            Type
                        </span>
                        <span className="w-8" />
                        <span className="w-9" />
                    </div>

                    {/* content list */}
                    <div className="rounded-lg border border-border overflow-hidden bg-card shadow-sm">
                        {content.map((item) => {
                            const isFile = !!item.fileURI;
                            const isLink = !!item.linkURL;
                            const originalFilename = isFile
                                ? getOriginalFilename(item.fileURI!)
                                : null;
                            const mimeType = originalFilename
                                ? (lookupByFilename(originalFilename)?.mimeType ?? null)
                                : null;
                            const category = getCategory(mimeType, originalFilename);
                            const ext = originalFilename
                                ? getExtension(originalFilename)
                                : null;
                            const previewMode: PreviewMode = getPreviewMode(mimeType, originalFilename);
                            const isExpanded = expandedId === item.id;
                            const isBookmarked = bookmarks.has(item.id);

                            return (
                                <div key={item.id}>
                                    <div
                                        className={`
                                    grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] items-center gap-x-4
                                    px-3 py-3
                                    transition-colors duration-150
                                    cursor-pointer hover:bg-muted/60
                                    ${isExpanded ? "bg-muted/40" : ""}
                                `}
                                        onClick={() =>
                                            toggleExpand(item, mimeType)
                                        }
                                        role="button"
                                        aria-expanded={isExpanded}
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (
                                                e.key === "Enter" ||
                                                e.key === " "
                                            ) {
                                                e.preventDefault();
                                                toggleExpand(item, mimeType);
                                            }
                                        }}
                                    >
                                        {isLink &&
                                        linkPreviews[item.id]?.favicon ? (
                                            <img
                                                src={
                                                    linkPreviews[item.id]
                                                        .favicon!
                                                }
                                                alt=""
                                                className="w-5 h-5 shrink-0"
                                            />
                                        ) : (
                                            <ContentIcon
                                                category={category}
                                                isLink={isLink}
                                                className="w-5 h-5"
                                            />
                                        )}

                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="truncate text-sm font-medium text-foreground">
                                                {item.displayName}
                                            </span>
                                            <span className="text-muted-foreground shrink-0">
                                                {isExpanded ? (
                                                    <ChevronDown className="w-4 h-4" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4" />
                                                )}
                                            </span>
                                        </div>

                                        <div className="hidden sm:flex justify-end w-48">
                                            <span className="truncate text-sm text-foreground">
                                                {item.owner
                                                    ? `${item.owner.firstName} ${item.owner.lastName}`
                                                    : ""}
                                            </span>
                                        </div>

                                        <div className="hidden sm:flex justify-end w-28">
                                            <span className="truncate text-sm text-foreground">
                                                {item.status}
                                            </span>
                                        </div>

                                        <div className="hidden sm:flex justify-center w-18">
                                            <ExtBadge
                                                category={category}
                                                ext={ext}
                                                isLink={isLink}
                                            />
                                        </div>

                                        <button
                                            className={`
                                        w-8 h-8 flex items-center justify-center rounded-md
                                        transition-colors
                                        ${
                                            isBookmarked
                                                ? "text-primary hover:text-primary/70"
                                                : "text-muted-foreground hover:text-foreground"
                                        }
                                    `}
                                            onClick={(e) =>
                                                toggleBookmark(item.id, e)
                                            }
                                            aria-label={
                                                isBookmarked
                                                    ? "Remove bookmark"
                                                    : "Bookmark"
                                            }
                                            title={
                                                isBookmarked
                                                    ? "Remove bookmark"
                                                    : "Bookmark"
                                            }
                                        >
                                            {isBookmarked ? (
                                                <BookmarkCheck className="w-4 h-4" />
                                            ) : (
                                                <Bookmark className="w-4 h-4" />
                                            )}
                                        </button>

                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={(e) =>
                                                handleDelete(item.id, e)
                                            }
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    {/* Expanded: link preview */}
                                    {isExpanded &&
                                        isLink &&
                                        (() => {
                                            const preview =
                                                linkPreviews[item.id];
                                            const hasImage = !!preview?.image;
                                            const hasFavicon =
                                                !!preview?.favicon;
                                            return (
                                                <a
                                                    href={item.linkURL!}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="border-t border-border bg-muted/20 px-6 py-3 flex items-center gap-4 hover:bg-muted/40 transition-colors"
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    {hasImage ? (
                                                        <img
                                                            src={
                                                                preview!.image!
                                                            }
                                                            alt=""
                                                            className="w-16 h-16 rounded object-cover shrink-0"
                                                            onError={(e) => {
                                                                (
                                                                    e.currentTarget as HTMLImageElement
                                                                ).style.display =
                                                                    "none";
                                                            }}
                                                        />
                                                    ) : hasFavicon ? (
                                                        <img
                                                            src={
                                                                preview!
                                                                    .favicon!
                                                            }
                                                            alt=""
                                                            className="w-8 h-8 rounded shrink-0"
                                                            onError={(e) => {
                                                                (
                                                                    e.currentTarget as HTMLImageElement
                                                                ).style.display =
                                                                    "none";
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div className="min-w-0">
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {item.linkURL}
                                                        </p>
                                                        {preview?.siteName && (
                                                            <p className="text-xs text-muted-foreground">
                                                                {
                                                                    preview.siteName
                                                                }
                                                            </p>
                                                        )}
                                                        {preview?.title && (
                                                            <p className="text-sm font-medium text-foreground truncate">
                                                                {preview.title}
                                                            </p>
                                                        )}
                                                        {preview?.description && (
                                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                                {
                                                                    preview.description
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                </a>
                                            );
                                        })()}

                                    {/* Expanded: file preview */}
                                    {isExpanded && isFile && (
                                        <div className="border-t border-border bg-background">
                                            <div className="px-6 py-3 flex items-center gap-4">
                                                <span className="text-sm font-medium text-foreground">
                                                    {originalFilename}
                                                </span>
                                                {fileSizes[item.id] != null && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatBytes(
                                                            fileSizes[item.id]!,
                                                        )}
                                                    </span>
                                                )}
                                                <a
                                                    href={`/api/content/download/${item.id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                                                >
                                                    <Download className="w-4 h-4" />{" "}
                                                    Download
                                                </a>
                                            </div>
                                            {previewMode === "text" &&
                                                (textContents[item.id] !=
                                                null ? (
                                                    <pre className="px-6 pb-4 text-sm text-foreground overflow-auto max-h-[520px] whitespace-pre-wrap">
                                                        {textContents[item.id]}
                                                    </pre>
                                                ) : (
                                                    <p className="px-6 py-4 text-sm text-muted-foreground">
                                                        Fetching...
                                                    </p>
                                                ))}
                                            {previewMode === "image" &&
                                                (fileUrls[item.id] ? (
                                                    <img
                                                        src={fileUrls[item.id]}
                                                        alt={
                                                            originalFilename ??
                                                            ""
                                                        }
                                                        className="max-w-full mx-auto px-6 pb-4"
                                                    />
                                                ) : (
                                                    <p className="px-6 py-4 text-sm text-muted-foreground">
                                                        Fetching...
                                                    </p>
                                                ))}
                                            {previewMode === "docviewer" &&
                                                (fileUrls[item.id] ? (
                                                    <DocViewer
                                                        documents={[
                                                            {
                                                                uri: fileUrls[
                                                                    item.id
                                                                ],
                                                            },
                                                        ]}
                                                        pluginRenderers={
                                                            DocViewerRenderers
                                                        }
                                                        style={{
                                                            minHeight: 520,
                                                        }}
                                                        config={{
                                                            header: {
                                                                disableHeader: true,
                                                            },
                                                        }}
                                                    />
                                                ) : (
                                                    <p className="px-6 py-4 text-sm text-muted-foreground">
                                                        Fetching...
                                                    </p>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {bookmarks.size > 0 && (
                        <div className="mt-4 px-3 py-2 rounded-md bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
                            <span className="font-medium text-primary">
                                {bookmarks.size}
                            </span>{" "}
                            item{bookmarks.size !== 1 ? "s" : ""} bookmarked
                        </div>
                    )}
                </CardContent>
            </Card>
        </>
    );
}

export default FilesPage;
