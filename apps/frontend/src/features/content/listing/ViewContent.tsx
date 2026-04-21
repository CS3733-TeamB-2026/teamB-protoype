import React, {useCallback, useEffect, useState} from "react";
import {
    Alert,
    AlertDescription,
} from "@/components/ui/alert.tsx";
import {
    AlertCircle,
    Star,
    ChevronDown,
    ChevronRight,
    EllipsisVertical,
    FolderOpen,
    Loader2,
    Pencil,
    Trash2,
    LucideFolders,
    Search,
    Plus,
    Lock,
    RefreshCcw,
    KeyRound,
    Ban,
} from "lucide-react";
import {Button} from "@/components/ui/button.tsx";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Link} from "react-router-dom";
import {HugeiconsIcon} from "@hugeicons/react";
import {LinkSquare01Icon} from "@hugeicons/core-free-icons";
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
import {Hero} from "@/components/shared/Hero.tsx";
import {ContentIcon} from "@/features/content/components/ContentIcon.tsx";
import {ConfirmDeleteDialog} from "@/components/dialogs/ConfirmDeleteDialog.tsx";
import {SortableHead} from "@/components/shared/SortableHead.tsx";
import {useSortState, applySortState} from "@/hooks/use-sort-state.ts";
import {useUser} from "@/hooks/use-user.ts";
import {
    getCategory,
    getExtension,
    getOriginalFilename,
} from "@/lib/mime.ts";
import {ContentExtBadge} from "@/features/content/components/ContentExtBadge.tsx";
import {ContentStatusBadge} from "@/features/content/components/ContentStatusBadge.tsx";
import {ContentTypeBadge} from "@/features/content/components/ContentTypeBadge.tsx";
import {PersonaBadge} from "@/components/shared/PersonaBadge.tsx";
import {EditContentDialog} from "@/features/content/forms/EditContentDialog.tsx";
import {AddContentDialog} from "@/features/content/forms/AddContentDialog.tsx";
import {FilePreview} from "@/features/content/previews/FilePreview.tsx";
import {UrlPreviewLink} from "@/components/shared/UrlPreviewLink.tsx";
import {getCachedPreview, setCachedPreview} from "@/features/content/previews/preview-cache.ts";
import {invalidateFileCacheById} from "@/features/content/previews/file-cache.ts";
import {useAuth0} from "@auth0/auth0-react"
import {highlight} from "@/lib/highlight.tsx";
import {formatLabel, formatName} from "@/lib/utils.ts";
import {toast} from "sonner";
import type {ContentItem, BookmarkRecord} from "@/lib/types.ts";
import type {UrlPreview} from "@/lib/types.ts";
import {usePageTitle} from "@/hooks/use-page-title.ts";
import {ConfirmCheckoutDialog} from "@/features/content/forms/ConfirmCheckoutDialog.tsx";
import {ConfirmCheckinDialog} from "@/features/content/forms/ConfirmCheckinDialog.tsx";
import {Tabs, TabsTrigger} from "@/components/ui/tabs"
import { SlidingTabs } from "@/components/shared/SlidingTabs.tsx";
import { useContentFilters, type ContentTab } from "@/hooks/use-content-filters.ts";


/**
 * Main content list page — the primary view for browsing, searching, filtering,
 * and managing content items.
 *
 * Key behaviors:
 * - Fetches all content the current user has access to from `/api/content` on
 *   mount, then polls every 15 seconds to pick up lock state changes made by
 *   other users.
 * - Each row is expandable. Expanding a file row renders an inline
 *   {@link FilePreview}; expanding a link row renders a {@link UrlPreviewLink}
 *   with Open Graph metadata fetched from `/api/preview`.
 * - Link previews are fetched in parallel after the content list loads and
 *   stored in `preview-cache.ts` so they survive re-renders and refreshes.
 * - Editing requires a checkout (pessimistic lock). The lock auto-expires after
 *   2 minutes on the backend. After a successful edit the file cache entry is
 *   invalidated so the next inline preview re-fetches the updated file.
 * - Bookmarks are optimistically updated: the UI reflects the change
 *   immediately and rolls back if the API call fails.
 */
function ViewContent() {

    usePageTitle("Manage Content");

    const [content, setContent] = useState<ContentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [addOpen, setAddOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editingContent, setEditingContent] = useState<ContentItem | null>(null);
    const [error, setError] = useState<string | null>(null);
    /** ID of the currently expanded row, or `null` if all rows are collapsed. */
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [bookmarks, setBookmarks] = useState<BookmarkRecord[]>([]);
    /** Content item staged for the delete confirmation dialog. */
    const [deleteTarget, setDeleteTarget] = useState<ContentItem | null>(null);
    const [sort, toggleSort] = useSortState<"name" | "owner" | "status" | "contentType" | "persona" | "docType">({
        column: "persona",
        direction: "asc"
    });
    /**
     * Map from content item ID to its fetched link preview (or `null` if the
     * URL was unreachable). Items with no entry are still loading.
     */
    const [linkPreviews, setLinkPreviews] = useState<Record<number, UrlPreview | null>>({});
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);


    const user = useUser();

    const {
        activeTab,
        setActiveTab,
        searchTerm,
        setSearchTerm,
        advancedFilters,
        setAdvancedFilters,
        clearAdvancedFilters,
        activeFilterCount,
        filteredContent,
    } = useContentFilters(content, bookmarks, user?.id, user?.persona);

    const [refreshing, setRefreshing] = useState(false);


    const {getAccessTokenSilently} = useAuth0();

    /**
     * Fetches Open Graph previews for all link-type items in `data`.
     *
     * Already-cached URLs are applied synchronously (no spinner). Uncached URLs
     * are fetched in parallel via `/api/preview` — a server-side proxy that
     * reads Open Graph tags from the target page. Each result is stored in
     * `preview-cache.ts` so re-renders and the 15-second poll don't re-fetch.
     */
    const fetchPreviews = useCallback((data: ContentItem[]) => {
        const linkItems = data.filter((item) => item.linkURL);

        // Populate synchronously from cache — no loading state for already-seen URLs.
        const fromCache: Record<number, UrlPreview | null> = {};
        const uncached: typeof linkItems = [];
        for (const item of linkItems) {
            const cached = getCachedPreview(item.linkURL!);
            if (cached !== undefined) {
                fromCache[item.id] = cached;
            } else {
                uncached.push(item);
            }
        }
        if (Object.keys(fromCache).length > 0) {
            setLinkPreviews((prev) => ({...prev, ...fromCache}));
        }

        uncached.forEach((item) => {
            fetch(`/api/preview?url=${encodeURIComponent(item.linkURL!)}`)
                .then((res) => (res.ok ? res.json() : Promise.reject()))
                .then((preview: UrlPreview) => {
                    setCachedPreview(item.linkURL!, preview);
                    setLinkPreviews((prev) => ({...prev, [item.id]: preview}));
                })
                .catch(() => {
                    setCachedPreview(item.linkURL!, null);
                    setLinkPreviews((prev) => ({...prev, [item.id]: null}));
                });
        });
    }, []);

    /**
     * Re-fetches the current user's bookmark list from the server and replaces
     * local state. Called on initial load and after every `refreshContent` poll
     * so the bookmark icons stay in sync if another browser tab changes them.
     */
    const updateBookmarks = useCallback(async () => {
        try {
            const token = await getAccessTokenSilently();
            const res = await fetch(`/api/bookmark`, {headers: {Authorization: `Bearer ${token}`}});
            const data: BookmarkRecord[] = await res.json();
            setBookmarks(data);
        } catch {
            toast.error("Failed to update bookmarks.");
        }
    }, [getAccessTokenSilently]);

    /**
     * Silently re-fetches the content list, link previews, and bookmarks without
     * showing the full-page loading spinner. Used by the manual refresh button
     * and the 15-second polling interval.
     */
    const refreshContent = useCallback(async () => {
        try {
            const token = await getAccessTokenSilently();
            const res = await fetch(`/api/content`, {headers: {Authorization: `Bearer ${token}`}});
            const data: ContentItem[] = await res.json();
            setContent(data);
            fetchPreviews(data);
            await updateBookmarks();
        } catch {
            toast.error("Failed to refresh content.");
        }
    }, [getAccessTokenSilently, fetchPreviews, updateBookmarks]);

    const [checkoutTarget, setCheckoutTarget] = useState<ContentItem | null>(null);
    const [checkinTarget, setCheckinTarget] = useState<ContentItem | null>(null);


    // Initial load — shows spinner and fetches link previews
    useEffect(() => {
        if (!user) return;
        const fetchContent = async () => {
            try {
                const token = await getAccessTokenSilently();
                const res = await fetch('/api/content', {
                    headers: {Authorization: `Bearer ${token}`},
                });
                const data: ContentItem[] = await res.json();
                setContent(data);
                setLoading(false);
                fetchPreviews(data);
                await updateBookmarks();
            } catch {
                setError("Failed to load content.");
                setLoading(false);
            }
        };
        void fetchContent();
    }, [getAccessTokenSilently, user, fetchPreviews, updateBookmarks]);

    // Poll for lock state changes from other users
    useEffect(() => {
        const id = setInterval(refreshContent, 15_000);
        return () => clearInterval(id);
    }, [refreshContent]);

    /** Expands the clicked row, or collapses it if it's already open. */
    function toggleExpand(id: number) {
        setExpandedId((prev) => (prev === id ? null : id));
    }

    /**
     * Toggles the bookmark for content item `id`.
     *
     * Uses an optimistic update: the bookmark icon flips immediately in the UI,
     * and the `DELETE` or `POST` to `/api/bookmark/:id` is sent in the background.
     * If the request fails, the local state is rolled back to its previous value
     * and an error toast is shown.
     *
     * `e.stopPropagation()` prevents the click from also expanding/collapsing
     * the row.
     */
    async function toggleBookmark(id: number, e: React.MouseEvent) {
        e.stopPropagation();
        const isCurrentlyBookmarked = bookmarks.some((b) => b.bookmarkedContentId === id);
        // Optimistic update
        if (isCurrentlyBookmarked) {
            setBookmarks((prev) => prev.filter((b) => b.bookmarkedContentId !== id));
        } else {
            setBookmarks((prev) => [...prev, {bookmarkerId: user!.id, bookmarkedContentId: id}]);
        }
        try {
            const token = await getAccessTokenSilently();
            await fetch(`/api/bookmark/${id}`, {
                method: isCurrentlyBookmarked ? "DELETE" : "POST",
                headers: {Authorization: `Bearer ${token}`},
            });
            if (isCurrentlyBookmarked) {
                toast.success("Favorite removed.");
            } else {
                toast.success("Favorite added.");
            }
        } catch {
            // Roll back on error
            if (isCurrentlyBookmarked) {
                setBookmarks((prev) => [...prev, {bookmarkerId: user!.id, bookmarkedContentId: id}]);
            } else {
                setBookmarks((prev) => prev.filter((b) => b.bookmarkedContentId !== id));
            }
            toast.error("Failed to update bookmark.");
        }
    }

    /**
     * Returns true if the current user is allowed to edit `item`.
     * Admins can edit everything; other personas can only edit content
     * that targets their own persona or that they own.
     */
    function canEdit(item: ContentItem): boolean {
        if (user!.persona === "admin") return true;
        return item.targetPersona === user!.persona || item.ownerId === user!.id;
    }

    /**
     * Returns true if `item` is checked out by someone *other* than the
     * current user. A checkout by the current user does not block editing
     * (they're already in the edit dialog).
     */
    function isCheckedOut(item: ContentItem): boolean {
        if (item.checkedOutById === null) return false;
        return item.checkedOutById !== user!.id;
    }

    /** Returns a human-readable tooltip for a locked item. */
    function lockLabel(item: ContentItem): string {
        if (!item.checkedOutBy) {
            return "This content is currently being modified.";
        }
        return `${item.checkedOutBy.firstName} ${item.checkedOutBy.lastName} is currently modifying this content.`;
    }

    /**
     * Deletes the content item with the given ID and removes it from local
     * state. Called by `ConfirmDeleteDialog` after the user confirms.
     */
    const handleDelete = async (id: number) => {
        const token = await getAccessTokenSilently();
        const res = await fetch(`/api/content/${id}`, {
            method: "DELETE",
            headers: {Authorization: `Bearer ${token}`},
        });
        if (res.ok) {
            setContent((prev) => prev.filter((item) => item.id !== id));
        }
        setDeleteTarget(null);
    };

    /**
     * Acquires an edit lock (checkout) for `item`.
     *
     * The backend issues a pessimistic lock via `POST /api/content/checkout`.
     * If another user already holds the lock the server returns a non-OK
     * response and we show an error toast. On success the lock metadata
     * (checkedOutById, checkedOutAt) returned by the server is merged into the
     * local content list so the lock icon appears immediately without waiting
     * for the next poll.
     */
    const handleCheckout = async (item: ContentItem) => {
        try {
            const token = await getAccessTokenSilently();
            const res = await fetch("/api/content/checkout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({id: item.id, employeeID: user!.id}),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.message || "Could not check out.");
                return;
            }
            setContent((prev) => prev.map((c) => c.id === item.id ? {...c, ...data} : c));
            toast.success("Successfully checked out. You can now edit or delete.");
        } catch {
            toast.error("Could not check out.");
        }
    };

    /**
     * Releases the edit lock (checkin) for `item`.
     *
     * The backend releases the lock via `POST /api/content/checkin`. On success,
     * the local content item is updated to remove the checkout information,
     * hiding the lock icon and allowing other users to edit.
     */
    const handleCheckin = async (item: ContentItem) => {
        try {
            const token = await getAccessTokenSilently();
            const res = await fetch("/api/content/checkin", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({id: item.id, employeeID: user!.id}),
            });
            if (res.ok) {
                setContent((prev) => prev.map((c) => c.id === item.id
                    ? {...c, checkedOutById: null, checkedOutAt: null, checkedOutBy: null}
                    : c
                ));
                toast.success("Checked in.");
            }
        } catch {
            toast.error("Could not check in.");
        }
    };

    /**
     * Opens the edit dialog for `item`.
     * This should only be called after a successful checkout. It sets the
     * `editingContent` state, which triggers the `EditContentDialog` to mount
     * and open. `e.stopPropagation()` prevents the click from also expanding
     * or collapsing the row.
     */
    const handleStartEdit = async (item: ContentItem, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingContent(item);
        setEditOpen(true);
    };

    // Total column count used for colSpan on the expanded detail rows.
    const NUM_COLS = 8;

    // UserProvider hasn't resolved yet — show a full-screen spinner rather than
    // rendering the page without a user (which would break permission checks).
    if (!user) return (
        <div className="flex items-center justify-center min-h-screen bg-secondary">
            <Loader2 className="w-10 h-10 text-primary animate-spin"/>
        </div>
    );

    return (
        <>
            <Hero
                icon={LucideFolders}
                title="View Content"
                description="View, update, and delete content you have access to"
            />

            <Card className="shadow-lg max-w-6xl mx-auto my-8 text-center px-4">
                <CardHeader>
                    <CardTitle className="text-3xl text-primary mt-4">
                        {user.persona === "admin" ? "All" : formatLabel(user.persona)} Content
                    </CardTitle>
                    <CardDescription>
                        {activeTab === "bookmarks"
                            ? `${filteredContent.length} favorited item${filteredContent.length !== 1 ? "s" : ""}`
                            : filteredContent.length === content.length
                                ? `${content.length} item${content.length !== 1 ? "s" : ""}`
                                : `${filteredContent.length} of ${content.length} items`}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {/* Top-level Tabs for filtering Content Items */}
                    {/* activeTab controls whether "All Content" or "Bookmarks" view is shown */}
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ContentTab)}>
                        <SlidingTabs
                            activeTab={activeTab}
                            indicatorColor={activeTab === "bookmarks" ? "bg-accent" : "bg-foreground"}
                        >
                            <TabsTrigger
                                value="forYou"
                                className="relative z-10 data-active:bg-transparent data-active:text-foreground hover:text-foreground/80 data-active:hover:text-foreground px-0"
                            >
                                For You
                                <span className="ml-2 text-xs opacity-70"> {content.filter(c => c.targetPersona === user.persona
                                ).length}</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="all"
                                className="relative z-10 data-active:bg-transparent data-active:text-foreground hover:text-foreground/80 data-active:hover:text-foreground px-0"
                            >
                                All Content
                                <span className="ml-2 text-xs opacity-70">{content.length}</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="owned"
                                className="relative z-10 data-active:bg-transparent data-active:text-foreground hover:text-foreground/80 data-active:hover:text-foreground px-0"
                            >
                                Owned By Me
                                <span className="ml-2 text-xs opacity-70">{content.filter(c => c.ownerId === user.id).length}</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="bookmarks"
                                className="relative z-10 data-active:bg-transparent data-active:text-foreground hover:text-foreground/80 data-active:hover:text-foreground px-0"
                            >
                                Favorites
                                <span className="ml-2 text-xs opacity-70">{bookmarks.length}</span>
                            </TabsTrigger>
                            {/*THEN ADD MORE TAB TRIGGERs FOR MORE TABS!!*/}
                        </SlidingTabs>
                    </Tabs>

                    {loading && (
                        <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
                            <Loader2 className="w-6 h-6 animate-spin"/>
                            <p className="text-sm">Loading...</p>
                        </div>
                    )}
                    {error && (
                        <Alert variant="destructive" className="my-4">
                            <AlertCircle/>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    {!loading && !error && content.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                            <FolderOpen className="w-10 h-10"/>
                            <p className="text-sm">No content found.</p>
                            <Button onClick={() => setAddOpen(true)}
                                    className="hover:bg-secondary hover:text-secondary-foreground active:scale-95 transition-all bg-primary text-primary-foreground w-60 rounded-lg px-2 py-6 text-xl">Add
                                Content +</Button>
                        </div>

                    )}
                    {!loading && !error && content.length > 0 && <>
                        <div className="flex flex-row justify-between items-baseline mb-2">
                            <div className="flex flex-row gap-2 items-center">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowAdvancedFilters((prev) => !prev)}
                                    className="hover:bg-secondary hover:text-secondary-foreground h-11 w-25 text-base"
                                >
                                    {showAdvancedFilters
                                        ? "Hide Filters"
                                        : activeFilterCount > 0
                                            ? `Filters (${activeFilterCount})`
                                            : "Filters"}
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
                                        className="w-64 h-10 text-base pl-2! pr-8 border border-gray-700 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-gray-500"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-row gap-2">
                                {/* Refresh button — runs refreshContent and a 1.5s minimum
                                    delay in parallel so the spin animation always completes
                                    a full cycle even when the fetch is very fast */}
                                <Button onClick={async () => {
                                    setRefreshing(true);
                                    await Promise.all([
                                        refreshContent(),
                                        new Promise((r) => setTimeout(r, 1500)),
                                    ]);
                                    setRefreshing(false);
                                }}
                                        className="cursor-pointer p-0! gap-0! border-0! flex items-center  rounded-full hover:bg-accent-dark hover:text-primary-foreground active:brightness-80 transition-all bg-accent text-primary-foreground w-12 h-12 text-lg">
                                    <span className="flex items-center justify-center min-w-12 h-12">
                                        <RefreshCcw className="w-8! h-8! text-primary-foreground"
                                                    style={refreshing ? {animation: "spin 1.5s ease-in-out reverse"} : undefined}/>
                                    </span>
                                </Button>
                                <Button onClick={() => setAddOpen(true)}
                                        className="cursor-pointer p-0! gap-0! border-0! group flex duration-300 items-center overflow-hidden ease-in-out rounded-full hover:w-42 hover:bg-acent-dark hover:text-primary-foreground active:brightness-80 transition-all bg-accent text-primary-foreground w-12 h-12 text-lg justify-start">
                                    <span className="flex items-center justify-center min-w-12 h-12">
                                        <Plus className="w-8! h-8! text-primary-foreground "/>
                                    </span>
                                    <span
                                        className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">Add Content</span>
                                </Button>


                            </div>
                        </div>
                        <div className={`flex gap-4 items-start`}>
                            {/* Filter Sidebar */}
                            {showAdvancedFilters && (
                                <div
                                    className="mt-10 shrink-0 w-48 rounded-lg border p-3 bg-muted/20 text-left text-sm">
                                    <div className="flex flex-col gap-4">
                                        <div>
                                            <p className="font-medium mb-2">Status</p>
                                            <div className="flex flex-col gap-1.5">
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
                                                        <span>{formatLabel(status)}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <p className="font-medium mb-2">Kind</p>
                                            <div className="flex flex-col gap-1.5">
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
                                                        <span>{formatLabel(type)}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <p className="font-medium mb-2">Persona</p>
                                            <div className="flex flex-col gap-1.5">
                                                {["underwriter", "businessAnalyst", "actuarialAnalyst", "EXLOperator", "businessOps", "admin"].map((persona) => (
                                                    <label key={persona} className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={advancedFilters.persona.includes(persona as "underwriter" | "businessAnalyst" | "actuarialAnalyst" | "EXLOperator" | "businessOps" | "admin")}
                                                            onChange={(e) => {
                                                                setAdvancedFilters((prev) => ({
                                                                    ...prev,
                                                                    persona: e.target.checked
                                                                        ? [...prev.persona, persona as "underwriter" | "businessAnalyst" | "actuarialAnalyst" | "EXLOperator" | "businessOps" | "admin"]
                                                                        : prev.persona.filter((p) => p !== persona),
                                                                }));
                                                            }}
                                                        />
                                                        <span>{formatLabel(persona)}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <p className="font-medium mb-2">Other</p>
                                            <div className="flex flex-col gap-1.5">
                                                {activeTab !== "bookmarks" && (
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
                                                    <span>Bookmarked</span>
                                                </label>
                                                )}
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
                                                    <span>Owned By Me</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="w-full"
                                            onClick={clearAdvancedFilters}
                                        >
                                            Clear Filters
                                        </Button>
                                    </div>
                                </div>
                            )}
                            {/* Table takes all remaining space */}
                            <div className="flex-1 min-w-0">
                                <Table className="text-left md:col-span-2">
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="w-8"/>
                                            <SortableHead column="name" label="Name" sort={sort} onSort={toggleSort}/>
                                            <SortableHead column="owner" label="Owner" sort={sort} onSort={toggleSort}
                                                          className="hidden sm:table-cell"/>
                                            <SortableHead column="status" label="Status" sort={sort} onSort={toggleSort}
                                                          className="hidden sm:table-cell"/>
                                            <SortableHead column="contentType" label="Kind" sort={sort}
                                                          onSort={toggleSort} className="hidden sm:table-cell"/>
                                            <SortableHead column="persona" label="Persona" sort={sort}
                                                          onSort={toggleSort}
                                                          className="hidden sm:table-cell"/>
                                            <SortableHead column="docType" label="Type" sort={sort} onSort={toggleSort}
                                                          className="hidden sm:table-cell"/>

                                            <TableHead
                                                className="uppercase tracking-wider text-muted-foreground select-none text-center">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                                    {/* Sort the filtered list, then render one React.Fragment
                                            per item (main row + up to two conditional expansion rows).
                                            The sort key extractor for "docType" derives the file
                                            extension when available, falling back to category, so that
                                            e.g. all PDFs sort together. */}
                                                    {applySortState(filteredContent, sort, (item, col) => {
                                                        let primarySort //Backup sort is by Persona so items are naturally clustered by persona
                                                        if (col === "persona") primarySort = item.targetPersona;
                                                        else if (col === "name") primarySort = item.displayName;
                                                        else if (col === "owner") primarySort = formatName(item.owner);
                                                        else if (col === "status") primarySort = item.status ?? "";
                                                        else if (col === "contentType") primarySort = item.contentType;
                                                        else if (col === "docType") primarySort = item.fileURI ? (getExtension(getOriginalFilename(item.fileURI!)) ?? getCategory(null, getOriginalFilename(item.fileURI!))) : (item.linkURL ? "link" : "");

                                                        return `${primarySort}|||${item.targetPersona}` //Sorts first by the column, then by Persona
                                                    }).map((item, index) => {
                                                        // Derive display values once per row to avoid repeating
                                                        // the same lookups in multiple cells below.
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
                                                        const isBookmarked = bookmarks.some((b) => b.bookmarkedContentId === item.id);

                                                        return (
                                                            <React.Fragment key={item.id}>
                                                                <TableRow
                                                                    className={`cursor-pointer ${item.checkedOutById === user!.id ? "bg-accent/10 border-l-4 border-l-accent" : index % 2 === 0 ? "bg-muted/10" : ""} ${isExpanded ? "bg-muted/80 hover:bg-muted/90" : ""} ${isCheckedOut(item) ? "opacity-50" : ""}`}
                                                                    onClick={() => toggleExpand(item.id)}
                                                                    tabIndex={0}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === "Enter" || e.key === " ") {
                                                                            e.preventDefault();
                                                                            toggleExpand(item.id);
                                                                        }
                                                                    }}
                                                    >
                                                        {/* Icon cell: use the site's favicon when
                                                            the link preview has loaded one, otherwise
                                                            fall back to the generic ContentIcon */}
                                                        <TableCell className="w-8 pr-0">
                                                            {isLink &&
                                                            linkPreviews[item.id]
                                                                ?.favicon ? (
                                                                <img
                                                                    src={
                                                                        linkPreviews[
                                                                            item.id
                                                                            ]!.favicon!
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
                                                            <ChevronDown className="w-4 h-4"/>
                                                        ) : (
                                                            <ChevronRight className="w-4 h-4"/>
                                                        )}
                                                    </span>
                                                            </div>
                                                        </TableCell>

                                                        <TableCell className="hidden sm:table-cell text-foreground">
                                                            {formatName(item.owner)}
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
                                                            <PersonaBadge persona={item.targetPersona}/>
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
                                                                {/* Open button — an IIFE so we can use early-return
                                                                    logic without a separate named function.
                                                                    File → router link to ViewSingleFile.
                                                                    Link → external anchor (new tab).
                                                                    Neither → disabled button. */}
                                                                {(() => {
                                                                    const icon = <HugeiconsIcon icon={LinkSquare01Icon}
                                                                                                className="w-4 h-4"/>;
                                                                    const btnClass = "w-8 h-8 flex items-center justify-center rounded-md transition-colors text-muted-foreground hover:text-foreground";
                                                                    if (item.fileURI) return (
                                                                        <Link to={`/file/${item.id}`}
                                                                              onClick={(e) => e.stopPropagation()}>
                                                                            <button className={btnClass}
                                                                                    title="View file">{icon}</button>
                                                                        </Link>
                                                                    );
                                                                    if (item.linkURL) return (
                                                                        <a href={item.linkURL} target="_blank"
                                                                           rel="noopener noreferrer"
                                                                           onClick={(e) => e.stopPropagation()}>
                                                                            <button className={btnClass}
                                                                                    title="Open link">{icon}</button>
                                                                        </a>
                                                                    );
                                                                    return <button
                                                                        className="w-8 h-8 flex items-center justify-center rounded-md opacity-30 cursor-not-allowed text-muted-foreground"
                                                                        title="No file or link"
                                                                        disabled>{icon}</button>;
                                                                })()}
                                                                <button
                                                                    className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${isBookmarked ? "text-accent hover:text-accent/70" : "text-muted-foreground hover:text-foreground"}`}
                                                                    onClick={(e) => toggleBookmark(item.id, e)}
                                                                    aria-label={isBookmarked ? "Remove bookmark" : "Bookmark"}
                                                                >
                                                                    <Star className="w-4 h-4" fill={isBookmarked ? "currentColor" : "none"} />
                                                                </button>
                                                                {(() => {
                                                                    if (item.checkedOutById === user!.id) {
                                                                        return (
                                                                            <DropdownMenu>
                                                                                <DropdownMenuTrigger asChild
                                                                                                     onClick={(e) => e.stopPropagation()}>
                                                                                    <button
                                                                                        className="w-8 h-8 flex items-center justify-center rounded-md transition-colors text-muted-foreground hover:text-foreground"
                                                                                        title="More actions"
                                                                                    >
                                                                                        <EllipsisVertical
                                                                                            className="w-4 h-4"/>
                                                                                    </button>
                                                                                </DropdownMenuTrigger>
                                                                                <DropdownMenuContent align="end"
                                                                                                     onClick={(e) => e.stopPropagation()}>
                                                                                    <DropdownMenuItem
                                                                                        title="Edit content"
                                                                                        onClick={(e) => handleStartEdit(item, e)}
                                                                                    >
                                                                                        <Pencil className="w-4 h-4"/>
                                                                                        Edit
                                                                                    </DropdownMenuItem>
                                                                                    <DropdownMenuItem onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setCheckinTarget(item);
                                                                                    }}>
                                                                                        <KeyRound className="w-4 h-4"/>
                                                                                        Check In
                                                                                    </DropdownMenuItem>
                                                                                    <DropdownMenuItem
                                                                                        className="text-destructive focus:text-destructive"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            setDeleteTarget(item);
                                                                                        }}
                                                                                    >
                                                                                        <Trash2 className="w-4 h-4"/>
                                                                                        Delete
                                                                                    </DropdownMenuItem>
                                                                                </DropdownMenuContent>
                                                                            </DropdownMenu>
                                                                        );
                                                                    }

                                                                    if (isCheckedOut(item)) {
                                                                        return (
                                                                            <button
                                                                                className="w-8 h-8 flex items-center justify-center rounded-md opacity-50 cursor-not-allowed text-muted-foreground"
                                                                                title={lockLabel(item)}
                                                                                disabled
                                                                            >
                                                                                <Lock className="w-4 h-4"/>
                                                                            </button>
                                                                        );
                                                                    }

                                                                    if (canEdit(item)) {
                                                                        return (
                                                                            <button
                                                                                className="w-8 h-8 flex items-center justify-center rounded-md transition-colors text-muted-foreground hover:text-foreground"
                                                                                title="Check out to edit or delete"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setCheckoutTarget(item);
                                                                                }}
                                                                            >
                                                                                <KeyRound className="w-4 h-4"/>
                                                                            </button>
                                                                        );
                                                                    }

                                                                    return (
                                                                        <button
                                                                            className="w-8 h-8 flex items-center justify-center rounded-md opacity-50 cursor-not-allowed text-muted-foreground"
                                                                            title="You don't have permission to checkout this item"
                                                                            disabled
                                                                        >
                                                                            <Ban className="w-4 h-4" />
                                                                        </button>
                                                                    );
                                                                })()}
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
                                                                <div
                                                                    className="flex gap-6 text-xs text-muted-foreground">
                                                                    {item.checkedOutBy && (
                                                                        <span>
                                                                    <span
                                                                        className="font-medium text-foreground">Editing </span>
                                                                            {item.checkedOutBy.firstName} {item.checkedOutBy.lastName}
                                                                </span>
                                                                    )}
                                                                    <span>
                                                                <span
                                                                    className="font-medium text-foreground">Modified:{" "}</span>
                                                                        {new Date(item.lastModified).toLocaleString()}
                                                            </span>
                                                                    {item.expiration && (
                                                                        <span>
                                                                    <span
                                                                        className="font-medium text-foreground">Expires:{" "}</span>
                                                                            {new Date(item.expiration).toLocaleString()}
                                                                </span>
                                                                    )}
                                                                    {item.expiration && (
                                                                        <span>
                                                                    <span className="font-medium text-foreground">Days left:{" "}</span>
                                                                            {Math.ceil((new Date(item.expiration).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)).toLocaleString()}
                                                                </span>
                                                                    )}
                                                                    {item.tags.length > 0 && (
                                                                        <span>
                                                                            <span className="font-medium text-foreground">Tags:{" "}</span>
                                                                            {item.tags.join(", ")}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    )}

                                                    {/* Expanded: link preview strip.
                                                Maps the linkPreviews entry to the three
                                                UrlPreviewLink statuses:
                                                  key absent   → "loading"  (fetch still in flight)
                                                  value null   → "unreachable" (fetch failed)
                                                  value object → "ok" */}
                                                    {isExpanded && isLink && (
                                                        <TableRow className="hover:bg-transparent">
                                                            <TableCell colSpan={NUM_COLS} className="p-0">
                                                                <UrlPreviewLink
                                                                    href={item.linkURL!}
                                                                    status={
                                                                        !(item.id in linkPreviews)
                                                                            ? "loading"
                                                                            : linkPreviews[item.id] === null
                                                                                ? "unreachable"
                                                                                : "ok"
                                                                    }
                                                                    preview={linkPreviews[item.id] ?? null}
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                    )}

                                                    {/* Expanded: file preview */}
                                                    {isExpanded && isFile && (
                                                        <TableRow className="hover:bg-transparent">
                                                            <TableCell colSpan={NUM_COLS}
                                                                       className="p-0 max-w-0 overflow-hidden">
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
                                </Table>
                            </div>

                        </div>

                    </>}
                </CardContent>
            </Card>

            <ConfirmDeleteDialog
                open={!!deleteTarget}
                onOpenChange={(open) => {
                    if (!open) setDeleteTarget(null);
                }}
                description={deleteTarget ?
                    <span>This will permanently delete <strong>"{deleteTarget.displayName}"</strong>.</span> : undefined}
                onConfirm={() => handleDelete(deleteTarget!.id)}
            />
            <ConfirmCheckoutDialog
                open={!!checkoutTarget}
                onOpenChange={(open: boolean) => {
                    if (!open) setCheckoutTarget(null);
                }}
                description={checkoutTarget
                    ? <span>Check out <strong>"{checkoutTarget.displayName}"</strong>? You'll be able to edit and delete it until you check it back in.</span>
                    : undefined}
                onConfirm={async () => {
                    if (checkoutTarget) {
                        await handleCheckout(checkoutTarget);
                        setCheckoutTarget(null);
                    }
                }}
            />
            <ConfirmCheckinDialog
                open={!!checkinTarget}
                onOpenChange={(open: boolean) => {
                    if (!open) setCheckinTarget(null);
                }}
                description={checkinTarget
                    ?
                    <span>Check in <strong>"{checkinTarget.displayName}"</strong>? Other users will be able to edit and delete it.</span>
                    : undefined}
                onConfirm={async () => {
                    if (checkinTarget) {
                        await handleCheckin(checkinTarget);
                        setCheckinTarget(null);
                    }
                }}
            />

            {/* AddContentDialog: after saving, append the new item to local state and
                immediately fetch its link preview (same cache-first logic as fetchPreviews)
                so the preview strip is ready when the user expands the new row. */}
            <AddContentDialog
                open={addOpen}
                onOpenChange={setAddOpen}
                onSave={(created) => {
                    setContent((prev) => [...prev, created]);
                    if (created.linkURL) {
                        const cached = getCachedPreview(created.linkURL);
                        if (cached !== undefined) {
                            setLinkPreviews((prev) => ({...prev, [created.id]: cached}));
                        } else {
                            fetch(`/api/preview?url=${encodeURIComponent(created.linkURL)}`)
                                .then((r) => r.ok ? r.json() : null)
                                .then((preview: UrlPreview | null) => {
                                    setCachedPreview(created.linkURL!, preview);
                                    setLinkPreviews((prev) => ({...prev, [created.id]: preview}));
                                })
                                .catch(() => {
                                    setCachedPreview(created.linkURL!, null);
                                    setLinkPreviews((prev) => ({...prev, [created.id]: null}));
                                });
                        }
                    }
                }}
            />

            {/* EditContentDialog: only mounted while editingContent is set (i.e. after a
                successful checkout). The key forces a full remount if the same item is
                edited twice in a row, resetting all form state. On save, invalidate the
                file cache so the next inline preview fetches the updated file, then
                refresh the list to pick up the server's new lastModified/lock state. */}
            {editingContent && (
                <EditContentDialog
                    key={`${editingContent.id}-${editOpen}`}
                    content={editingContent}
                    open={editOpen}
                    onOpenChange={setEditOpen}
                    onSave={() => {
                        if (editingContent?.fileURI) invalidateFileCacheById(editingContent.id);
                        void refreshContent();
                    }}
                />
            )}

        </>
    );
}

export default ViewContent;
