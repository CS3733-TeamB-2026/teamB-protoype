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
    Plus,
    Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Link } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { LinkSquare01Icon } from "@hugeicons/core-free-icons";
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
} from "@/lib/mime.ts";
import { ContentExtBadge } from "@/components/shared/ContentExtBadge.tsx";
import { ContentStatusBadge } from "@/components/shared/ContentStatusBadge.tsx";
import { ContentTypeBadge } from "@/components/shared/ContentTypeBadge.tsx";
import { PersonaBadge } from "@/components/shared/PersonaBadge.tsx";
import { EditContentDialog } from "@/dialogs/EditContentDialog.tsx";
import { AddContentDialog } from "@/dialogs/AddContentDialog.tsx";
import { FilePreview } from "@/components/FilePreview.tsx";
import { useAuth0 } from "@auth0/auth0-react"
import {highlight} from "@/lib/highlight.tsx";

// Matches the Content model from Prisma (with joined owner)
export interface ContentItem {
    id: number;
    displayName: string;
    linkURL: string | null;
    fileURI: string | null;
    ownerId: number | null;
    owner: {
        id: number;
        firstName: string;
        lastName: string;
    } | null;
    checkedOutById: number | null;
    checkedOutAt: string | null;
    checkedOutBy: {
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
    const [addOpen, setAddOpen] = useState(false);
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
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    const [advancedFilters, setAdvancedFilters] = useState({
        status: [] as Array<"new" | "inProgress" | "complete">,
        contentType: [] as Array<"reference" | "workflow">,
        persona: [] as Array<"underwriter" | "businessAnalyst" | "admin">,
        bookmarkedOnly: false,
        ownedByMe: false,
    });

    const user = useUser();
    const [searchTerm, setSearchTerm] = React.useState("");
    const searchedContent = content.filter((item) =>
        item.displayName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const advancedFilteredContent = searchedContent.filter((item) => {
        const matchesStatus =
            advancedFilters.status.length === 0 ||
            (item.status !== null && advancedFilters.status.includes(item.status));

        const matchesContentType =
            advancedFilters.contentType.length === 0 ||
            advancedFilters.contentType.includes(item.contentType);

        const matchesPersona =
            advancedFilters.persona.length === 0 ||
            advancedFilters.persona.includes(item.targetPersona);

        const matchesBookmark =
            !advancedFilters.bookmarkedOnly || bookmarks.has(item.id);

        const matchesOwner =
            !advancedFilters.ownedByMe || item.ownerId === user?.id;

        return (
            matchesStatus &&
            matchesContentType &&
            matchesPersona &&
            matchesBookmark &&
            matchesOwner
        );
    });

    const activeFilterCount =
        advancedFilters.status.length +
        advancedFilters.contentType.length +
        advancedFilters.persona.length +
        (advancedFilters.bookmarkedOnly ? 1 : 0) +
        (advancedFilters.ownedByMe ? 1 : 0);

    const { getAccessTokenSilently } = useAuth0();

    const fetchPreviews = (data: ContentItem[]) => {
        data.filter((item) => item.linkURL).forEach(async (item) => {
            try {
                const res = await fetch(`/api/preview?url=${encodeURIComponent(item.linkURL!)}`);
                if (!res.ok) throw new Error(`preview ${res.status}`);
                const preview = await res.json();
                setLinkPreviews((prev) => ({ ...prev, [item.id]: preview }));
            } catch {
                setLinkPreviews((prev) => ({
                    ...prev,
                    [item.id]: { title: null, description: null, image: null, siteName: null, favicon: null },
                }));
            }
        });
    };

    const refreshContent = async () => {
        try {
            const token = await getAccessTokenSilently();
            const res = await fetch(`/api/content`, { headers: { Authorization: `Bearer ${token}` } });
            const data: ContentItem[] = await res.json();
            setContent(data);
            fetchPreviews(data);
        } catch {
            setError("Failed to refresh content.");
        }
    };

    // Initial load — shows spinner and fetches link previews
    useEffect(() => {

        if (!user) return;
        const fetchContent = async () => {
            try {
                const token = await getAccessTokenSilently();
                const res = await fetch('/api/content', {
                    headers: { Authorization: `Bearer ${token}` },
                })
                const data: ContentItem[] = await res.json();
                setContent(data);
                setLoading(false);
                fetchPreviews(data);
            } catch {
                setError("Failed to load content.");
                setLoading(false);
            }
        }
        void fetchContent();
    }, [getAccessTokenSilently, user]);

    // Poll for lock state changes from other users
    useEffect(() => {
        const id = setInterval(refreshContent, 15_000);
        return () => clearInterval(id);
    }, [refreshContent]);

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
        return item.targetPersona === user!.persona || item.ownerId === user!.id;
    }

    function isCheckedOut(item: ContentItem): boolean {
        if (item.checkedOutById === null) return false;
        return item.checkedOutById !== user!.id;
    }

    function lockLabel(item: ContentItem): string {
        if (!item.checkedOutBy) {
            return "This content is currently being modified.";
        }
        return `${item.checkedOutBy.firstName} ${item.checkedOutBy.lastName} is currently modifying this content.`;
    }

    function formatName(item: ContentItem): string {
        return item.owner
            ? `${item.owner.lastName}, ${item.owner.firstName}`
            : ""
    }

    const handleDelete = async (id: number) => {
        const token = await getAccessTokenSilently();
        const res = await fetch(`/api/content/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            setContent((prev) => prev.filter((item) => item.id !== id));
        }
        setDeleteTarget(null);
    };

    const handleStartEdit = async (item: ContentItem, e:React.MouseEvent) => {
        e.stopPropagation();
        if (!canEdit(item)) { return;}
        try {
            const token = await getAccessTokenSilently();
            const res = await fetch(`/api/content/checkout`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
            body: JSON.stringify({
                id: item.id,
                employeeID: user!.id,
            }),
            });
            const data = await res.json();
            if(!res.ok) {
                setError(data.message || "Someone else is editing");
                return;
            }
            setContent ((prev) =>
            prev.map((c) => (c.id === item.id ? {...c, ...data}: c)));
            setEditingContent({ ...item, ...data });
            setEditOpen(true);
        } catch {
            setError("Someone else is editing");
        }

        }


    const NUM_COLS = 8;

    if (!user) return (
        <div className="flex items-center justify-center min-h-screen bg-secondary">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
    );

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
                        {advancedFilteredContent.length === content.length
                            ? `${content.length} item${content.length !== 1 ? "s" : ""}`
                            : `${advancedFilteredContent.length} of ${content.length} items`}
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
                            <Button onClick={() => setAddOpen(true)} className="hover:bg-secondary hover:text-secondary-foreground active:scale-95 transition-all bg-primary text-primary-foreground w-60 rounded-lg px-2 py-6 text-xl">Add Content +</Button>
                        </div>
                    )}
                    {!loading && !error && content.length > 0 && <>
                        <div className="flex flex-row justify-between items-baseline mb-8">
                            <div>
                                <Button onClick={() => setAddOpen(true)} className="p-0! gap-0! border-0! group flex duration-300 items-center overflow-hidden ease-in-out rounded-full hover:w-45 hover:bg-primary-dark hover:text-primary-foreground active:brightness-80 transition-all bg-primary text-primary-foreground w-12 h-12 text-lg justify-start">
                                    <span className="flex items-center justify-center min-w-12 h-12">
                                        <Plus className="w-8! h-8! text-primary-foreground " />
                                    </span>
                                    <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">Add Content</span>
                                </Button>
                            </div>
                            <div className="flex flex-row gap-2 items-center">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowAdvancedFilters((prev) => !prev)}
                                    className="hover:bg-secondary hover:text-secondary-foreground"
                                >
                                    {showAdvancedFilters
                                        ? "Hide Advanced Filters"
                                        : activeFilterCount > 0
                                            ? `Advanced Filters (${activeFilterCount})`
                                            : "Advanced Filters"}
                                </Button>
                                <div className="relative">
                                    <Search
                                        className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 pointer-events-none"
                                    />
                                    <Input
                                        type="text"
                                        placeholder="Search by name..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-64 h-10 text-lg! pl-2! pr-8 border border-gray-700 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-gray-500"
                                    />
                                </div>
                            </div>

                        </div>
                        {showAdvancedFilters && (
                            <div className="mb-4 rounded-lg border p-4 bg-muted/20 text-left">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                                    <div>
                                        <p className="font-medium mb-2">Status</p>
                                        <div className="flex flex-col gap-2">
                                            {["new", "inProgress", "complete"].map((status) => (
                                                <label key={status} className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={advancedFilters.status.includes(status as "new" | "inProgress" | "complete")}
                                                        onChange={(e) => {
                                                            setAdvancedFilters((prev) => ({
                                                                ...prev,
                                                                status: e.target.checked
                                                                    ? [...prev.status, status as "new" | "inProgress" | "complete"]
                                                                    : prev.status.filter((s) => s !== status),
                                                            }));
                                                        }}
                                                    />
                                                    <span>{status}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <p className="font-medium mb-2">Kind</p>
                                        <div className="flex flex-col gap-2">
                                            {["reference", "workflow"].map((type) => (
                                                <label key={type} className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={advancedFilters.contentType.includes(type as "reference" | "workflow")}
                                                        onChange={(e) => {
                                                            setAdvancedFilters((prev) => ({
                                                                ...prev,
                                                                contentType: e.target.checked
                                                                    ? [...prev.contentType, type as "reference" | "workflow"]
                                                                    : prev.contentType.filter((t) => t !== type),
                                                            }));
                                                        }}
                                                    />
                                                    <span>{type}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <p className="font-medium mb-2">Persona</p>
                                        <div className="flex flex-col gap-2">
                                            {["underwriter", "businessAnalyst", "admin"].map((persona) => (
                                                <label key={persona} className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={advancedFilters.persona.includes(persona as "underwriter" | "businessAnalyst" | "admin")}
                                                        onChange={(e) => {
                                                            setAdvancedFilters((prev) => ({
                                                                ...prev,
                                                                persona: e.target.checked
                                                                    ? [...prev.persona, persona as "underwriter" | "businessAnalyst" | "admin"]
                                                                    : prev.persona.filter((p) => p !== persona),
                                                            }));
                                                        }}
                                                    />
                                                    <span>{persona}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <p className="font-medium mb-2">Other</p>
                                        <div className="flex flex-col gap-2">
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={advancedFilters.bookmarkedOnly}
                                                    onChange={(e) =>
                                                        setAdvancedFilters((prev) => ({
                                                            ...prev,
                                                            bookmarkedOnly: e.target.checked,
                                                        }))
                                                    }
                                                />
                                                <span>Bookmarked only</span>
                                            </label>

                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={advancedFilters.ownedByMe}
                                                    onChange={(e) =>
                                                        setAdvancedFilters((prev) => ({
                                                            ...prev,
                                                            ownedByMe: e.target.checked,
                                                        }))
                                                    }
                                                />
                                                <span>Owned by me</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <Button
                                        variant="secondary"
                                        onClick={() =>
                                            setAdvancedFilters({
                                                status: [],
                                                contentType: [],
                                                persona: [],
                                                bookmarkedOnly: false,
                                                ownedByMe: false,
                                            })
                                        }
                                    >
                                        Clear Filters
                                    </Button>
                                </div>
                            </div>
                        )}

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
                                    <TableHead className="uppercase tracking-wider text-muted-foreground select-none text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {applySortState(advancedFilteredContent, sort, (item, col) => {
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
                                                        {highlight(item.displayName, searchTerm)}
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

                                                <TableCell>
                                                    <div className="flex justify-end gap-1">
                                                        {(() => {
                                                            const icon = <HugeiconsIcon icon={LinkSquare01Icon} className="w-4 h-4" />;
                                                            const btnClass = "w-8 h-8 flex items-center justify-center rounded-md transition-colors text-muted-foreground hover:text-foreground";
                                                            if (item.fileURI) return (
                                                                <Link to={`/file/${item.id}`} onClick={(e) => e.stopPropagation()}>
                                                                    <button className={btnClass} title="View file">{icon}</button>
                                                                </Link>
                                                            );
                                                            if (item.linkURL) return (
                                                                <a href={item.linkURL} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                                                    <button className={btnClass} title="Open link">{icon}</button>
                                                                </a>
                                                            );
                                                            return <button className="w-8 h-8 flex items-center justify-center rounded-md opacity-30 cursor-not-allowed text-muted-foreground" title="No file or link" disabled>{icon}</button>;
                                                        })()}
                                                        <button
                                                            className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${isBookmarked ? "text-primary hover:text-primary/70" : "text-muted-foreground hover:text-foreground"}`}
                                                            onClick={(e) => toggleBookmark(item.id, e)}
                                                            aria-label={isBookmarked ? "Remove bookmark" : "Bookmark"}
                                                        >
                                                            {isBookmarked ? (
                                                                <BookmarkCheck className="w-4 h-4" />
                                                            ) : (
                                                                <Bookmark className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={!canEdit(item) || isCheckedOut(item)}
                                                            title={isCheckedOut(item) ? lockLabel(item) : "Edit content"}
                                                            onClick={(e) => handleStartEdit(item, e)}
                                                        >
                                                            {isCheckedOut(item) ? (
                                                                <Lock className="w-4 h-4" />
                                                            ) : (
                                                                <Pencil className="w-4 h-4" />
                                                            )}
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
                                                            {item.checkedOutBy && (
                                                                <span>
                                                                    <span className = "font-medium text-foreground">Editing </span>
                                                                    {item.checkedOutBy.firstName} {item.checkedOutBy.lastName}
                                                                </span>
                                                            )}
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
                                                            {
                                                                item.expiration && (
                                                                <span>
                                                                    <span className="font-medium text-foreground">
                                                                        Days left:{" "}
                                                                    </span>
                                                                    {Math.ceil((new Date(item.expiration,).getTime() -
                                                                        new Date().getTime()) / (1000 * 60 * 60 * 24)
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

            <AddContentDialog
                open={addOpen}
                onOpenChange={setAddOpen}
                onSave={(created) => {
                    setContent((prev) => [...prev, created]);
                    if (created.linkURL) {
                        fetch(`/api/preview?url=${encodeURIComponent(created.linkURL)}`)
                            .then((r) => r.ok ? r.json() : null)
                            .then((preview) => {
                                if (preview) setLinkPreviews((prev) => ({ ...prev, [created.id]: preview }));
                            })
                            .catch(() => {});
                    }
                }}
            />

            {editingContent && (
                <EditContentDialog
                    key={`${editingContent.id}-${editOpen}`}
                    content={editingContent}
                    open={editOpen}
                    onOpenChange={setEditOpen}
                    onSave={refreshContent}
                />
            )}

        </>
    );
}

export default ViewContent;
