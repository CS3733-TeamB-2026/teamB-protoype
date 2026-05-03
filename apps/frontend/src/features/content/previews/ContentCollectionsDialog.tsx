import { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CollectionCard } from "@/components/shared/CollectionCard";
import { CollectionPicker } from "@/components/shared/CollectionPicker";
import { AddCollectionDialog } from "@/features/collections/AddCollectionDialog";
import type { Collection } from "@/lib/types";

interface Props {
    contentId: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Called after a successful add so the parent can update its collection count. */
    onCollectionsChange: (collections: Collection[]) => void;
}

/**
 * Dialog showing which collections contain a content item, with a picker to add it to more.
 *
 * Fetches /api/content/:id/collections on open. After adding to a collection via
 * POST /api/collections/:id/items, re-fetches and notifies the parent via onCollectionsChange.
 */
export function ContentCollectionsDialog({ contentId, open, onOpenChange, onCollectionsChange }: Props) {
    const { getAccessTokenSilently } = useAuth0();
    const [collections, setCollections] = useState<Collection[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [adding, setAdding] = useState(false);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const fetchCollections = async () => {
        setLoading(true);
        try {
            const token = await getAccessTokenSilently();
            const res = await fetch(`/api/content/${contentId}/collections`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) return;
            const data: Collection[] = await res.json();
            setCollections(data);
            onCollectionsChange(data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) void fetchCollections();
    }, [open, contentId]);

    const handleOpenChange = (next: boolean) => {
        if (!next) {
            setSelectedId(null);
            setRefreshKey(0);
        }
        onOpenChange(next);
    };

    const handleAdd = async () => {
        if (selectedId == null) return;
        setAdding(true);
        try {
            const token = await getAccessTokenSilently();
            const res = await fetch(`/api/collections/${selectedId}/items`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ contentIds: [contentId] }),
            });
            if (!res.ok) { toast.error("Failed to add to collection."); return; }
            toast.success("Added to collection.");
            setSelectedId(null);
            await fetchCollections();
        } catch {
            toast.error("Failed to add to collection.");
        } finally {
            setAdding(false);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="sm:max-w-md flex flex-col max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl text-primary text-center">Collections</DialogTitle>
                        <Separator />
                    </DialogHeader>

                    <div className="flex flex-col gap-4 overflow-hidden">
                        {/* Current collections list */}
                        <div className="overflow-y-auto overscroll-contain flex flex-col gap-2 min-h-0 max-h-72">
                            {loading ? (
                                <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="text-sm">Loading...</span>
                                </div>
                            ) : collections.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-6">
                                    This item is not in any collections yet.
                                </p>
                            ) : (
                                collections.map((c) => <CollectionCard key={c.id} collection={c} />)
                            )}
                        </div>

                        <Separator />

                        {/* Add to another collection */}
                        <div className="flex flex-col gap-2">
                            <p className="text-sm font-medium">Add to a collection</p>
                            <CollectionPicker
                                selectedId={selectedId}
                                onSelect={(id) => setSelectedId(id)}
                                onCreateNew={() => setCreateDialogOpen(true)}
                                excludeIds={collections.map((c) => c.id)}
                                refreshKey={refreshKey}
                                inline
                            />
                            <div className="flex justify-end">
                                <Button
                                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                                    disabled={selectedId == null || adding}
                                    onClick={() => void handleAdd()}
                                >
                                    {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <AddCollectionDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onCreated={(collection) => {
                    setSelectedId(collection.id);
                    setRefreshKey((k) => k + 1);
                }}
            />
        </>
    );
}