import { useEffect, useState } from "react";
import { AddCollectionDialog } from "@/features/collections/AddCollectionDialog";
import { useNavigate } from "react-router-dom";
import { BookMarked, FolderOpen, Loader2, Plus, Search, Star, Trash2 } from "lucide-react";
import { useAuth0 } from "@auth0/auth0-react";
import { Tabs, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Hero } from "@/components/shared/Hero";
import { SlidingTabs } from "@/components/shared/SlidingTabs";
import { EmployeeAvatar } from "@/components/shared/EmployeeAvatar";
import { SortableHead } from "@/components/shared/SortableHead";
import { useSortState, applySortState } from "@/hooks/use-sort-state";
import { ConfirmDeleteDialog } from "@/components/dialogs/ConfirmDeleteDialog";
import { useUser } from "@/hooks/use-user";
import { usePageTitle } from "@/hooks/use-page-title";
import { highlight } from "@/lib/highlight";
import { toast } from "sonner";
import type { Collection, CollectionFavorite } from "@/lib/types";

type CollectionTab = "all" | "mine" | "favorites";

/**
 * Collections list page — sortable table of all collections visible to the current user.
 *
 * Collections and the current user's favorites are fetched in parallel on mount.
 * Favorites are stored as a `number[]` of collection IDs rather than full objects,
 * since the backend returns flat `CollectionFavorite` join records.
 *
 * Favorite toggling is optimistic: the local ID list is updated immediately and
 * rolled back if the API call fails. Tab counts always reflect the unfiltered data
 * (all/mine/favorites) so the numbers don't change as the user types in the search box.
 */
function ViewCollections() {
    usePageTitle("Collections");

    const { getAccessTokenSilently } = useAuth0();
    const { user } = useUser();
    const navigate = useNavigate();

    const [collections, setCollections] = useState<Collection[]>([]);
    const [favorites, setFavorites] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<CollectionTab>("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [deleteTarget, setDeleteTarget] = useState<Collection | null>(null);
    const [addOpen, setAddOpen] = useState(false);
    const [sort, toggleSort] = useSortState<"name" | "owner" | "items" | "visibility">({ column: "name", direction: "asc" });

    useEffect(() => {
        if (!user) return;
        const load = async () => {
            try {
                const token = await getAccessTokenSilently();
                const headers = { Authorization: `Bearer ${token}` };
                const [colRes, favRes] = await Promise.all([
                    fetch("/api/collections", { headers }),
                    fetch("/api/collections/favorites", { headers }),
                ]);
                const colData: Collection[] = await colRes.json();
                const favData: CollectionFavorite[] = await favRes.json();
                setCollections(colData);
                setFavorites(favData.map((f) => f.collectionId));
            } catch {
                toast.error("Failed to load collections.");
            } finally {
                setLoading(false);
            }
        };
        void load();
    }, [getAccessTokenSilently, user]);

    const handleDelete = async (collection: Collection) => {
        try {
            const token = await getAccessTokenSilently();
            const res = await fetch(`/api/collections/${collection.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setCollections((prev) => prev.filter((c) => c.id !== collection.id));
                setFavorites((prev) => prev.filter((id) => id !== collection.id));
                toast.success(`"${collection.displayName}" deleted.`);
            } else {
                toast.error("Failed to delete collection.");
            }
        } catch {
            toast.error("Failed to delete collection.");
        }
        setDeleteTarget(null);
    };

    const toggleFavorite = async (collection: Collection, e: React.MouseEvent) => {
        e.stopPropagation();
        const isFavorited = favorites.includes(collection.id);
        if (isFavorited) {
            setFavorites((prev) => prev.filter((id) => id !== collection.id));
        } else {
            setFavorites((prev) => [...prev, collection.id]);
        }
        try {
            const token = await getAccessTokenSilently();
            const res = await fetch(`/api/collections/${collection.id}/favorite`, {
                method: isFavorited ? "DELETE" : "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error();
            toast.success(isFavorited ? "Removed from favorites." : "Added to favorites.");
        } catch {
            if (isFavorited) {
                setFavorites((prev) => [...prev, collection.id]);
            } else {
                setFavorites((prev) => prev.filter((id) => id !== collection.id));
            }
            toast.error("Failed to update favorite.");
        }
    };

    const canDelete = (c: Collection) =>
        user?.persona === "admin" || c.ownerId === user?.id;

    const baseCollections = (() => {
        if (activeTab === "mine") return collections.filter((c) => c.ownerId === user?.id);
        if (activeTab === "favorites") return collections.filter((c) => favorites.includes(c.id));
        return collections;
    })();

    const filteredCollections = (() => {
        const query = searchTerm.toLowerCase().trim();
        if (!query) return baseCollections;
        return baseCollections.filter((c) =>
            c.displayName.toLowerCase().includes(query) ||
            `${c.owner.firstName} ${c.owner.lastName}`.toLowerCase().includes(query)
        );
    })();

    const sortedCollections = applySortState(filteredCollections, sort, (c, col) => {
        if (col === "name") return c.displayName;
        if (col === "owner") return `${c.owner.lastName} ${c.owner.firstName}`;
        if (col === "items") return c.items.length;
        if (col === "visibility") return c.public ? "public" : "private";
        return "";
    });

    if (!user) return (
        <div className="flex items-center justify-center min-h-screen bg-secondary">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
    );

    return (
        <>
            <Hero
                icon={BookMarked}
                title="Collections"
                description="Browse, create, and manage ordered collections of content."
            />

            <Card className="shadow-lg max-w-5xl mx-auto my-8 text-center px-4">
                <CardHeader>
                    <CardTitle className="text-3xl text-primary mt-4">Collections</CardTitle>
                    <CardDescription>
                        {filteredCollections.length === collections.length
                            ? `${collections.length} collection${collections.length !== 1 ? "s" : ""}`
                            : `${filteredCollections.length} of ${collections.length} collections`}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CollectionTab)}>
                        <SlidingTabs activeTab={activeTab} indicatorColor="bg-foreground">
                            <TabsTrigger value="all" className="relative z-10 data-active:bg-transparent data-active:text-foreground hover:text-foreground/80 data-active:hover:text-foreground px-0">
                                All
                                <span className="ml-2 text-xs opacity-70">{collections.length}</span>
                            </TabsTrigger>
                            <TabsTrigger value="mine" className="relative z-10 data-active:bg-transparent data-active:text-foreground hover:text-foreground/80 data-active:hover:text-foreground px-0">
                                Mine
                                <span className="ml-2 text-xs opacity-70">{collections.filter((c) => c.ownerId === user.id).length}</span>
                            </TabsTrigger>
                            <TabsTrigger value="favorites" className="relative z-10 data-active:bg-transparent data-active:text-foreground hover:text-foreground/80 data-active:hover:text-foreground px-0">
                                Favorites
                                <span className="ml-2 text-xs opacity-70">{favorites.length}</span>
                            </TabsTrigger>
                        </SlidingTabs>
                    </Tabs>

                    {loading ? (
                        <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <p className="text-sm">Loading...</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between mt-4 mb-4">
                                <div className="relative">
                                    <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 pointer-events-none" />
                                    <input
                                        type="text"
                                        placeholder="Search collections..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-64 h-10 text-lg! pl-2! pr-8 border border-gray-700 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-gray-500"
                                    />
                                </div>
                                <Button
                                    onClick={() => setAddOpen(true)}
                                    className="cursor-pointer p-0! gap-0! border-0! group flex duration-300 items-center overflow-hidden ease-in-out rounded-full hover:w-52 hover:bg-accent-dark hover:text-primary-foreground active:brightness-80 transition-all bg-accent text-primary-foreground w-12 h-12 text-lg justify-start"
                                >
                                    <span className="flex items-center justify-center min-w-12 h-12">
                                        <Plus className="w-8! h-8! text-primary-foreground" />
                                    </span>
                                    <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">New Collection</span>
                                </Button>
                            </div>

                            {sortedCollections.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                                    <FolderOpen className="w-10 h-10" />
                                    <p className="text-sm">No collections found.</p>
                                </div>
                            ) : (
                                <Table className="text-left">
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent">
                                            <SortableHead column="name" label="Name" sort={sort} onSort={toggleSort} className="w-full" />
                                            <SortableHead column="owner" label="Owner" sort={sort} onSort={toggleSort} />
                                            <SortableHead column="items" label="Items" sort={sort} onSort={toggleSort} />
                                            <SortableHead column="visibility" label="Visibility" sort={sort} onSort={toggleSort} />
                                            <TableHead className="uppercase tracking-wider text-muted-foreground select-none text-center">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sortedCollections.map((collection, index) => {
                                            const isFavorited = favorites.includes(collection.id);
                                            return (
                                                <TableRow
                                                    key={collection.id}
                                                    className={`cursor-pointer ${index % 2 === 0 ? "bg-muted/10" : ""}`}
                                                    onClick={() => navigate(`/collections/${collection.id}`)}
                                                >
                                                    <TableCell className="font-medium">
                                                        {highlight(collection.displayName, searchTerm)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <EmployeeAvatar employee={collection.owner} size="sm" />
                                                    </TableCell>
                                                    <TableCell className="text-center text-muted-foreground">
                                                        {collection.items.length}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={collection.public ? "default" : "secondary"}>
                                                            {collection.public ? "Public" : "Private"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className={isFavorited ? "text-accent hover:text-accent/70" : "text-muted-foreground hover:text-foreground"}
                                                                onClick={(e) => toggleFavorite(collection, e)}
                                                                aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
                                                            >
                                                                <Star className="w-4 h-4" fill={isFavorited ? "currentColor" : "none"} />
                                                            </Button>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                disabled={!canDelete(collection)}
                                                                onClick={(e) => { e.stopPropagation(); setDeleteTarget(collection); }}
                                                                aria-label="Delete collection"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            <ConfirmDeleteDialog
                open={!!deleteTarget}
                onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
                description={deleteTarget
                    ? <span>This will permanently delete <strong>"{deleteTarget.displayName}"</strong> and all its items.</span>
                    : undefined}
                onConfirm={() => handleDelete(deleteTarget!)}
            />

            <AddCollectionDialog open={addOpen} onOpenChange={setAddOpen} />
        </>
    );
}

export default ViewCollections;
