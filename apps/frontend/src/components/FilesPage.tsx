import {useEffect, useState} from "react";
import DocViewer, {DocViewerRenderers} from "@iamjariwala/react-doc-viewer";
import "@iamjariwala/react-doc-viewer/dist/index.css";
import {
    File,
    Link,
    Bookmark,
    BookmarkCheck,
    ChevronDown,
    ChevronRight,
    AlertCircle,
    FolderOpen,
    Download,
} from "lucide-react";

// Matches the Content model from Prisma
interface ContentItem {
    id: number;
    displayName: string;
    linkURL: string | null;
    fileURI: string | null;
    ownerID: number | null;
    lastModified: string;
    expiration: string | null;
    contentType: string;
    targetPersona: string;
    status: string | null;
}

function getOriginalFilename(fileURI: string): string {
    return fileURI.split("/").pop() ?? fileURI;
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ContentIcon({isLink, className = ""}: { isLink: boolean; className?: string }) {
    const base = `shrink-0 ${className}`;
    if (isLink) return <Link className={`${base} text-violet-500`}/>;
    return <File className={`${base} text-muted-foreground`}/>;
}

function TypeBadge({isLink}: { isLink: boolean }) {
    const colorClass = isLink ? "bg-violet-100 text-violet-700" : "bg-secondary text-secondary-foreground";
    const label = isLink ? "Link" : "File";
    return (
        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${colorClass}`}>
            {label}
        </span>
    );
}

function FilesPage() {
    const [content, setContent] = useState<ContentItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [bookmarks, setBookmarks] = useState<Set<number>>(new Set());
    const [fileSizes, setFileSizes] = useState<Record<number, number | null>>({});
    const [fileUrls, setFileUrls] = useState<Record<number, string>>({});
    const [linkPreviews, setLinkPreviews] = useState<Record<number, {
        title: string | null;
        description: string | null;
        image: string | null;
        siteName: string | null;
        favicon: string | null;
    }>>({});

    useEffect(() => {
        fetch("/api/content")
            .then((res) => res.json())
            .then((data: ContentItem[]) => {
                setContent(data);
                data.filter((item) => item.linkURL).forEach((item) => {
                    fetch(`/api/content/preview?url=${encodeURIComponent(item.linkURL!)}`)
                        .then((res) => res.json())
                        .then((preview) => setLinkPreviews((prev) => ({...prev, [item.id]: preview})))
                        .catch(console.error);
                });
            })
            .catch(() => setError("Failed to load content."));
    }, []);

    function toggleExpand(id: number) {
        setExpandedId((prev) => (prev === id ? null : id));
        if (!(id in fileSizes)) {
            fetch(`/api/content/info/${id}`)
                .then((res) => res.json())
                .then((meta) => setFileSizes((prev) => ({...prev, [id]: meta?.size ?? null})))
                .catch(() => setFileSizes((prev) => ({...prev, [id]: null})));
        }
        if (!(id in fileUrls)) {
            fetch(`/api/content/download/${id}`)
                .then((res) => res.blob())
                .then((blob) => {
                    const url = URL.createObjectURL(blob);
                    setFileUrls((prev) => ({...prev, [id]: url}));
                })
                .catch(console.error);
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
                <AlertCircle className="w-8 h-8"/>
                <p className="text-sm font-medium">{error}</p>
            </div>
        );
    }
    if (content.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
                <FolderOpen className="w-10 h-10"/>
                <p className="text-sm">No content found.</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="mb-6">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground font-serif">
                    Documents
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    {content.length} item{content.length !== 1 ? "s" : ""}
                </p>
            </div>

            {/* column header */}
            <div className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-x-4 px-3 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground select-none">
                <span className="w-5"/>
                <span>Name</span>
                <span className="hidden sm:block w-28 text-right">Type</span>
                <span className="hidden md:block w-36 text-right">File / Link</span>
                <span className="w-8"/>
            </div>

            {/* content list */}
            <div className="rounded-lg border border-border overflow-hidden bg-card shadow-sm">
                {content.map((item, idx) => {
                    const isFile = !!item.fileURI;
                    const isLink = !!item.linkURL;
                    const originalFilename = item.fileURI ? getOriginalFilename(item.fileURI) : null;
                    const isExpanded = expandedId === item.id;
                    const isBookmarked = bookmarks.has(item.id);

                    return (
                        <div key={item.id}>
                            {idx !== 0 && <div className="h-px bg-border mx-3"/>}

                            <div
                                className={`
                                    grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-x-4
                                    px-3 py-3
                                    transition-colors duration-150
                                    cursor-pointer hover:bg-muted/60
                                    ${isExpanded ? "bg-muted/40" : ""}
                                `}
                                onClick={() => toggleExpand(item.id)}
                                role="button"
                                aria-expanded={isExpanded}
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        toggleExpand(item.id);
                                    }
                                }}
                            >
                                {isLink && linkPreviews[item.id]?.favicon ? (
                                    <img src={linkPreviews[item.id].favicon!} alt="" className="w-5 h-5 shrink-0"/>
                                ) : (
                                    <ContentIcon isLink={isLink} className="w-5 h-5"/>
                                )}

                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="truncate text-sm font-medium text-foreground">
                                        {item.displayName}
                                    </span>
                                    <span className="text-muted-foreground shrink-0">
                                        {isExpanded
                                            ? <ChevronDown className="w-4 h-4"/>
                                            : <ChevronRight className="w-4 h-4"/>}
                                    </span>
                                </div>

                                <div className="hidden sm:flex justify-end w-28">
                                    <TypeBadge isLink={isLink}/>
                                </div>

                                {/* File name or URL */}
                                <div className="hidden md:block w-36 text-right text-xs text-muted-foreground truncate">
                                    {isFile && originalFilename && (
                                        <a
                                            href={`/api/content/download/${item.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline"
                                            onClick={(e) => e.stopPropagation()}
                                            title={originalFilename}
                                        >
                                            {originalFilename}
                                        </a>
                                    )}
                                    {isLink && (
                                        <a
                                            href={item.linkURL!}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline"
                                            onClick={(e) => e.stopPropagation()}
                                            title={item.linkURL!}
                                        >
                                            {item.linkURL}
                                        </a>
                                    )}
                                </div>

                                <button
                                    className={`
                                        w-8 h-8 flex items-center justify-center rounded-md
                                        transition-colors
                                        ${isBookmarked
                                        ? "text-primary hover:text-primary/70"
                                        : "text-muted-foreground hover:text-foreground"
                                    }
                                    `}
                                    onClick={(e) => toggleBookmark(item.id, e)}
                                    aria-label={isBookmarked ? "Remove bookmark" : "Bookmark"}
                                    title={isBookmarked ? "Remove bookmark" : "Bookmark"}
                                >
                                    {isBookmarked
                                        ? <BookmarkCheck className="w-4 h-4"/>
                                        : <Bookmark className="w-4 h-4"/>}
                                </button>
                            </div>

                            {/* Expanded: link preview */}
                            {isExpanded && isLink && linkPreviews[item.id] && (
                                <a
                                    href={item.linkURL!}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="border-t border-border bg-muted/20 px-6 py-3 flex items-center gap-4 hover:bg-muted/40 transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {linkPreviews[item.id].image && (
                                        <img src={linkPreviews[item.id].image!} alt="" className="w-16 h-16 rounded object-cover shrink-0"/>
                                    )}
                                    <div className="min-w-0">
                                        {linkPreviews[item.id].siteName && (
                                            <p className="text-xs text-muted-foreground">{linkPreviews[item.id].siteName}</p>
                                        )}
                                        {linkPreviews[item.id].title && (
                                            <p className="text-sm font-medium text-foreground truncate">{linkPreviews[item.id].title}</p>
                                        )}
                                        {linkPreviews[item.id].description && (
                                            <p className="text-xs text-muted-foreground line-clamp-2">{linkPreviews[item.id].description}</p>
                                        )}
                                    </div>
                                </a>
                            )}

                            {/* Expanded: inline viewer + download */}
                            {isExpanded && isFile && (
                                <div className="border-t border-border bg-background">
                                    <div className="px-6 py-3 flex items-center gap-4">
                                        <span className="text-sm font-medium text-foreground">{originalFilename}</span>
                                        {fileSizes[item.id] != null && (
                                            <span className="text-xs text-muted-foreground">
                                                {formatBytes(fileSizes[item.id]!)}
                                            </span>
                                        )}
                                        <a
                                            href={`/api/content/download/${item.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                                        >
                                            <Download className="w-4 h-4"/> Download
                                        </a>
                                    </div>
                                    {fileUrls[item.id] ? (
                                        <DocViewer
                                            documents={[{uri: fileUrls[item.id]}]}
                                            pluginRenderers={DocViewerRenderers}
                                            style={{minHeight: 520}}
                                            config={{header: {disableHeader: true}}}
                                        />
                                    ) : (
                                        <p className="px-6 py-4 text-sm text-muted-foreground">Fetching...</p>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {bookmarks.size > 0 && (
                <div className="mt-4 px-3 py-2 rounded-md bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
                    <span className="font-medium text-primary">{bookmarks.size}</span>{" "}
                    item{bookmarks.size !== 1 ? "s" : ""} bookmarked
                </div>
            )}
        </div>
    );
}

export default FilesPage;
