import React, { useEffect, useState } from "react";
import {
    AlertCircle,
    Bookmark,
    BookmarkCheck,
    ChevronDown,
    ChevronRight,
    FolderOpen,
    Loader2,
    Pencil,
    Trash2,
    LucideFolders,
    Search,
    Plus
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
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
} from "@/components/ui/table.tsx";
import { Hero } from "@/components/shared/Hero.tsx";
import { ContentIcon } from "@/components/shared/ContentIcon.tsx";
import { ConfirmDeleteDialog } from "@/dialogs/ConfirmDeleteDialog.tsx";
import { SortableHead } from "@/components/shared/SortableHead.tsx";
import { useSortState, applySortState } from "@/hooks/use-sort-state.ts";
import { useUser } from "@/hooks/use-user.ts";
import {
    getCategory,
    getExtension,
    getOriginalFilename,
} from "@/helpers/mime.ts";
import { ContentExtBadge } from "@/components/shared/ContentExtBadge.tsx";
import { ContentStatusBadge } from "@/components/shared/ContentStatusBadge.tsx";
import { ContentTypeBadge } from "@/components/shared/ContentTypeBadge.tsx";
import { PersonaBadge } from "@/components/shared/PersonaBadge.tsx";
import { EditContentDialog } from "@/dialogs/EditContentDialog.tsx";
import { FilePreview } from "@/components/FilePreview.tsx";

// Matches the Content model from Prisma (with joined owner)
export interface ContentItem {
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
    contentType: "reference" | "workflow";
    targetPersona: "underwriter" | "businessAnalyst" | "admin";
    status: "new" | "inProgress" | "complete" | null;
}

function ViewContent() {
    const [content, setContent] = useState<ContentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [editOpen, setEditOpen] = useState(false);
    const [editingContent, setEditingContent] = useState<ContentItem | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [bookmarks, setBookmarks] = useState<Set<number>>(new Set());
    const [deleteTarget, setDeleteTarget] = useState<ContentItem | null>(null);
    const [sort, toggleSort] = useSortState<"name" | "owner" | "status" | "contentType" | "persona">({column: "name", direction: "asc"});
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
    const [user] = useUser();
    const [searchTerm, setSearchTerm] = React.useState("");
    const filteredContent = content.filter((item) =>
        item.displayName.toLowerCase().includes(searchTerm.toLowerCase())
    )

    useEffect(() => {
        fetch(`/api/content`)
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

    function toggleExpand(id: number) {
        setExpandedId((prev) => (prev === id ? null : id));
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

    function canEdit(item: ContentItem): boolean {
        if (user!.persona === "admin") return true;
        return item.targetPersona === user!.persona || item.ownerID === user!.id;
    }

    function formatName(item: ContentItem): string {
        return item.owner
            ? `${item.owner.lastName}, ${item.owner.firstName}`
            : ""
    }

    const handleDelete = async (id: number) => {
        const res = await fetch(`/api/content/${id}`, { method: "DELETE" });
        if (res.ok) {
            setContent((prev) => prev.filter((item) => item.id !== id));
        }
        setDeleteTarget(null);
    };

    const NUM_COLS = 9;

    if (!user) return null;

    return (
        <>
            <Hero
                icon={ LucideFolders }
                title="View Content"
                description="View, update, and delete content you have access to"
            />

            <Card className="shadow-lg max-w-5xl mx-auto my-8 text-center px-4">
                <CardHeader>
                    <CardTitle className="text-3xl text-primary mt-4">
                        {user.persona === "underwriter" ? "Underwriter" :
                            user.persona === "businessAnalyst" ? "Business Analyst" :
                                "All"} Content
                    </CardTitle>
                    <CardDescription>
                        {filteredContent.length === content.length
                            ? `${content.length} item${content.length !== 1 ? "s" : ""}`
                            : `${filteredContent.length} of ${content.length} items`}
                    </CardDescription>
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
                    {!loading && !error && content.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                            <FolderOpen className="w-10 h-10" />
                            <p className="text-sm">No content found.</p>
                            <Link to="/manageform">
                                <Button className="hover:bg-secondary hover:text-secondary-foreground active:scale-95 transition-all bg-primary text-primary-foreground w-60 rounded-lg px-2 py-6 text-xl">Add Content +</Button>
                            </Link>
                        </div>
                    )}
                    {!loading && !error && content.length > 0 && <>
                        <div className="flex flex-row justify-between items-baseline mb-8">
                            <div>
                                <Link to="/manageform">
                                    <Button className="group flex duration-300 items-center overflow-hidden ease-in-out rounded-full hover:w-45 hover:bg-primary-dark hover:text-primary-foreground active:brightness-80 transition-all bg-primary text-primary-foreground w-12 h-12 text-lg p-0 justify-start">
                                        <span className="flex items-center justify-center min-w-12 h-12">
                                            <Plus className="w-8! h-8! text-primary-foreground" />
                                        </span>
                                        <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">Add Content</span>
                                    </Button>
                                </Link>
                            </div>
                            <div className="relative">
                                <Search
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 pointer-events-none"
                                />
                                <Input
                                    type="text"
                                    placeholder="Search by name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-64 h-10 text-lg! pl-4! pr-8 border border-gray-700 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-gray-500"
                                />
                            </div>
                        </div>
                        <Table className="text-left">
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-8" />
                                <SortableHead column="name" label="Name" sort={sort} onSort={toggleSort} />
                                <SortableHead column="owner" label="Owner" sort={sort} onSort={toggleSort} className="hidden sm:table-cell" />
                                <SortableHead column="status" label="Status" sort={sort} onSort={toggleSort} className="hidden sm:table-cell" />
                                <SortableHead column="contentType" label="Kind" sort={sort} onSort={toggleSort} className="hidden sm:table-cell" />
                                <SortableHead column="persona" label="Persona" sort={sort} onSort={toggleSort} className="hidden sm:table-cell" />
                                <TableHead className="hidden sm:table-cell uppercase tracking-wider text-muted-foreground select-none text-center">Type</TableHead>
                                <TableHead className="w-8" />
                                <TableHead className="uppercase tracking-wider text-muted-foreground select-none text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {applySortState(filteredContent, sort, (item, col) => {
                                if (col === "name") return item.displayName;
                                if (col === "owner") return formatName(item);
                                if (col === "status") return item.status ?? "";
                                if (col === "contentType") return item.contentType;
                                if (col === "persona") return item.targetPersona;
                            }).map((item) => {
                                const isFile = !!item.fileURI;
                                const isLink = !!item.linkURL;
                                const originalFilename = isFile
                                    ? getOriginalFilename(item.fileURI!)
                                    : null;
                                const category = getCategory(null, originalFilename);
                                const ext = originalFilename
                                    ? getExtension(originalFilename)
                                    : null;
                                const isExpanded = expandedId === item.id;
                                const isBookmarked = bookmarks.has(item.id);

                                return (
                                    <React.Fragment key={item.id}>
                                        <TableRow
                                            className={`cursor-pointer ${isExpanded ? "bg-muted/40 hover:bg-muted/40" : ""}`}
                                            onClick={() => toggleExpand(item.id)}
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === " ") {
                                                    e.preventDefault();
                                                    toggleExpand(item.id);
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
                                                {formatName(item)}
                                            </TableCell>

                                            <TableCell className="hidden sm:table-cell text-center">
                                                <ContentStatusBadge
                                                    status={item.status}
                                                />
                                            </TableCell>

                                            <TableCell className="hidden sm:table-cell text-center">
                                                <ContentTypeBadge
                                                    contentType={item.contentType}
                                                />
                                            </TableCell>

                                            <TableCell className="hidden sm:table-cell text-center">
                                                <PersonaBadge persona={item.targetPersona} />
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

                                            <TableCell>
                                                <div className="flex justify-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={!canEdit(item)}
                                                        onClick={() => {
                                                            setEditingContent(item);
                                                            setEditOpen(true);
                                                        }}
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        disabled={!canEdit(item)}
                                                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(item); }}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>

                                        {/* Expanded: dates */}
                                        {isExpanded && (
                                            <TableRow className="hover:bg-transparent">
                                                <TableCell
                                                    colSpan={NUM_COLS}
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
                                                            colSpan={NUM_COLS}
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
                                                <TableCell colSpan={NUM_COLS} className="p-0 max-w-0 overflow-hidden">
                                                    <FilePreview
                                                        filename={originalFilename!}
                                                        src={`/api/content/download/${item.id}`}
                                                        infoSrc={`/api/content/info/${item.id}`}
                                                    />
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

            {editingContent && (
                <EditContentDialog
                    key={editingContent.id}
                    content={editingContent}
                    open={editOpen}
                    onOpenChange={setEditOpen}
                    onSave={(updated) =>
                        setContent((prev) =>
                            prev.map((e) => (e.id === updated.id ? updated : e))
                        )
                    }
                />
            )}

        </>
    );
}

export default ViewContent;
