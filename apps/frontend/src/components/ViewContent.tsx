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
    Loader2,
    Trash2,
    Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card.tsx";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Hero } from "@/components/shared/Hero.tsx";
import {
    ContentIcon,

} from "@/components/shared/ContentIcon.tsx";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";
import {
    getCategory,
    getExtension,
    getOriginalFilename,
    getPreviewMode,
    lookupByFilename,
    type PreviewMode,
} from "@/helpers/mime";
import { ContentExtBadge } from "@/components/shared/ContentExtBadge.tsx";
import { ContentStatusBadge } from "@/components/shared/ContentStatusBadge.tsx";
import { ContentTypeBadge } from "@/components/shared/ContentTypeBadge.tsx";

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

function ViewContent() {
    const [content, setContent] = useState<ContentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [bookmarks, setBookmarks] = useState<Set<number>>(new Set());
    const [deleteTarget, setDeleteTarget] = useState<ContentItem | null>(null);
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
    const [searchTerm, setSearchTerm] = React.useState("");
    const filteredContent = content.filter((item) =>
        item.displayName.toLowerCase().includes(searchTerm.toLowerCase())
    )

    useEffect(() => {
        fetch(`/api/content?persona=${encodeURIComponent(user.persona)}`)
            .then((res) => res.json())
            .then((data: ContentItem[]) => {
                setContent(data);
                setLoading(false);
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
            .catch(() => { setError("Failed to load content."); setLoading(false); });
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

    const handleDelete = async (id: number) => {
        const res = await fetch(`/api/content/${id}`, { method: "DELETE" });
        if (res.ok) {
            setContent((prev) => prev.filter((item) => item.id !== id));
        }
        setDeleteTarget(null);
    };

    return (
        <>
            <Hero
                icon="content"
                title="View Content"
                description="View, update, and delete content you have access to"
            />

            <Card className="shadow-lg max-w-5xl mx-auto my-8 text-center">
                <CardHeader>
                    <CardTitle className="text-3xl text-primary mt-4">
                        {user.persona === "underwriter" ? "Underwriter" :
                            user.persona === "businessAnalyst" ? "Business Analyst" :
                                "All"} Content
                    </CardTitle>
                    <CardDescription>
                        Total Content Items: {content.length}
                        <div>Filtered Content Items: {filteredContent.length}</div>
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <Link to="/manageform">
                        <Button className="my-5 hover:bg-secondary hover:text-secondary-foreground active:scale-95 transition-all bg-primary text-primary-foreground w-60 mx-auto rounded-lg px-2 py-6 text-xl">Add Content</Button>
                    </Link>

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
                    {!loading && !error && content.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                            <FolderOpen className="w-10 h-10" />
                            <p className="text-sm">No content found.</p>
                        </div>
                    )}
                    {!loading && !error && content.length > 0 && <>
                        <div className="flex justify-end mb-4">
                            <Search className="w-8 h-8" />
                            <input
                                type="text"
                                placeholder="Search Table"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="border-2 border-gray-700 rounded px-2 py-1 mb-4 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            />
                        </div>
                        <Table className="text-left">
                        <TableHeader>
                            <TableRow className="uppercase tracking-wider text-muted-foreground select-none hover:bg-transparent">
                                <TableHead className="w-8" />
                                <TableHead>Name</TableHead>
                                <TableHead className="hidden sm:table-cell">Owner</TableHead>
                                <TableHead className="hidden sm:table-cell">Status</TableHead>
                                <TableHead className="hidden sm:table-cell">Kind</TableHead>
                                <TableHead className="hidden sm:table-cell text-center">Type</TableHead>
                                <TableHead className="w-8" />
                                <TableHead className="w-8" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredContent.map((item) => {
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
                                    <React.Fragment key={item.id}>
                                        <TableRow
                                            className={`cursor-pointer ${isExpanded ? "bg-muted/40 hover:bg-muted/40" : ""}`}
                                            onClick={() =>
                                                toggleExpand(item, mimeType)
                                            }
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (
                                                    e.key === "Enter" ||
                                                    e.key === " "
                                                ) {
                                                    e.preventDefault();
                                                    toggleExpand(
                                                        item,
                                                        mimeType,
                                                    );
                                                }
                                            }}
                                        >
                                            <TableCell className="w-8 pr-0">
                                                {isLink &&
                                                linkPreviews[item.id]
                                                    ?.favicon ? (
                                                    <img
                                                        src={
                                                            linkPreviews[
                                                                item.id
                                                            ].favicon!
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
                                            </TableCell>

                                            <TableCell className="w-full max-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="truncate font-medium text-foreground">
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
                                            </TableCell>

                                            <TableCell className="hidden sm:table-cell text-foreground">
                                                {item.owner
                                                    ? `${item.owner.firstName} ${item.owner.lastName}`
                                                    : ""}
                                            </TableCell>

                                            <TableCell className="hidden sm:table-cell">
                                                <ContentStatusBadge
                                                    status={item.status}
                                                />
                                            </TableCell>

                                            <TableCell className="hidden sm:table-cell">
                                                <ContentTypeBadge
                                                    contentType={item.contentType}
                                                />
                                            </TableCell>

                                            <TableCell className="hidden sm:table-cell text-center">
                                                <ContentExtBadge
                                                    category={category}
                                                    ext={ext}
                                                    isLink={isLink}
                                                />
                                            </TableCell>

                                            <TableCell className="w-8 px-1">
                                                <button
                                                    className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${isBookmarked ? "text-primary hover:text-primary/70" : "text-muted-foreground hover:text-foreground"}`}
                                                    onClick={(e) =>
                                                        toggleBookmark(
                                                            item.id,
                                                            e,
                                                        )
                                                    }
                                                    aria-label={
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
                                            </TableCell>

                                            <TableCell className="w-8 px-1">
                                                <Button
                                                    variant="destructive"
                                                    disabled={item.ownerID !== user?.id}
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDeleteTarget(item);
                                                    }}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>

                                        {/* Expanded: dates */}
                                        {isExpanded && (
                                            <TableRow className="hover:bg-transparent">
                                                <TableCell
                                                    colSpan={8}
                                                    className="px-6 py-2 bg-muted/10 border-t border-border"
                                                >
                                                    <div className="flex gap-6 text-xs text-muted-foreground">
                                                        <span>
                                                            <span className="font-medium text-foreground">
                                                                Modified:{" "}
                                                            </span>
                                                            {new Date(
                                                                item.lastModified,
                                                            ).toLocaleString()}
                                                        </span>
                                                        {item.expiration && (
                                                            <span>
                                                                <span className="font-medium text-foreground">
                                                                    Expires:{" "}
                                                                </span>
                                                                {new Date(
                                                                    item.expiration,
                                                                ).toLocaleString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}

                                        {/* Expanded: link preview */}
                                        {isExpanded &&
                                            isLink &&
                                            (() => {
                                                const preview =
                                                    linkPreviews[item.id];
                                                const hasImage =
                                                    !!preview?.image;
                                                const hasFavicon =
                                                    !!preview?.favicon;
                                                return (
                                                    <TableRow className="hover:bg-transparent">
                                                        <TableCell
                                                            colSpan={8}
                                                            className="p-0"
                                                        >
                                                            <a
                                                                href={
                                                                    item.linkURL!
                                                                }
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-4 px-6 py-3 bg-muted/20 hover:bg-muted/40 transition-colors"
                                                                onClick={(e) =>
                                                                    e.stopPropagation()
                                                                }
                                                            >
                                                                {hasImage ? (
                                                                    <img
                                                                        src={
                                                                            preview!
                                                                                .image!
                                                                        }
                                                                        alt=""
                                                                        className="w-16 h-16 rounded object-cover shrink-0"
                                                                        onError={(
                                                                            e,
                                                                        ) => {
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
                                                                        onError={(
                                                                            e,
                                                                        ) => {
                                                                            (
                                                                                e.currentTarget as HTMLImageElement
                                                                            ).style.display =
                                                                                "none";
                                                                        }}
                                                                    />
                                                                ) : null}
                                                                <div className="min-w-0 text-left">
                                                                    <p className="text-xs text-muted-foreground truncate">
                                                                        {
                                                                            item.linkURL
                                                                        }
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
                                                                            {
                                                                                preview.title
                                                                            }
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
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })()}

                                        {/* Expanded: file preview */}
                                        {isExpanded && isFile && (
                                            <TableRow className="hover:bg-transparent">
                                                <TableCell
                                                    colSpan={8}
                                                    className="p-0"
                                                >
                                                    <div className="bg-background">
                                                        <div className="px-6 py-3 flex items-center gap-4">
                                                            <span className="text-sm font-medium text-foreground">
                                                                {
                                                                    originalFilename
                                                                }
                                                            </span>
                                                            {fileSizes[
                                                                item.id
                                                            ] != null && (
                                                                <span className="text-xs text-muted-foreground">
                                                                    {formatBytes(
                                                                        fileSizes[
                                                                            item
                                                                                .id
                                                                        ]!,
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
                                                        {previewMode ===
                                                            "text" &&
                                                            (textContents[
                                                                item.id
                                                            ] != null ? (
                                                                <pre className="px-6 pb-4 text-sm text-foreground overflow-auto max-h-[520px] whitespace-pre-wrap">
                                                                    {
                                                                        textContents[
                                                                            item
                                                                                .id
                                                                        ]
                                                                    }
                                                                </pre>
                                                            ) : (
                                                                <p className="px-6 py-4 text-sm text-muted-foreground">
                                                                    Fetching...
                                                                </p>
                                                            ))}
                                                        {previewMode ===
                                                            "image" &&
                                                            (fileUrls[
                                                                item.id
                                                            ] ? (
                                                                <img
                                                                    src={
                                                                        fileUrls[
                                                                            item
                                                                                .id
                                                                        ]
                                                                    }
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
                                                        {previewMode ===
                                                            "docviewer" &&
                                                            (fileUrls[
                                                                item.id
                                                            ] ? (
                                                                <DocViewer
                                                                    documents={[
                                                                        {
                                                                            uri: fileUrls[
                                                                                item
                                                                                    .id
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
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </TableBody>
                    </Table></>}

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

            <ConfirmDeleteDialog
                open={!!deleteTarget}
                onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
                description={deleteTarget ? <span>This will permanently delete <strong>"{deleteTarget.displayName}"</strong>.</span> : undefined}
                onConfirm={() => handleDelete(deleteTarget!.id)}
            />
        </>
    );
}

export default ViewContent;
