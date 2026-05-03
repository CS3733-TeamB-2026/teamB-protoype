import { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CollectionPicker } from "@/components/shared/CollectionPicker.tsx";
import { AddCollectionDialog } from "@/features/collections/AddCollectionDialog.tsx";
import type { Collection } from "@/lib/types";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    contentIds: number[];
    /** Called after items are successfully added, so the parent can clear selection. */
    onDone: () => void;
}

/**
 * Dialog for adding selected content items to an existing collection or a newly-created one.
 *
 * Uses CollectionPicker for selection and AddCollectionDialog for creation, so both
 * components stay in sync with the rest of the app. On confirm, calls
 * POST /api/collections/:id/items which appends without replacing the full list.
 */
export function AddToCollectionDialog({ open, onOpenChange, contentIds, onDone }: Props) {
    const { getAccessTokenSilently } = useAuth0();
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    // Incrementing refreshKey tells CollectionPicker to refetch after a new collection is created.
    const [refreshKey, setRefreshKey] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    const handleOpenChange = (next: boolean) => {
        if (!next) {
            setSelectedId(null);
            setRefreshKey(0);
        }
        onOpenChange(next);
    };

    const handleSubmit = async () => {
        if (selectedId == null) return;
        setSubmitting(true);
        try {
            const token = await getAccessTokenSilently();
            const res = await fetch(`/api/collections/${selectedId}/items`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ contentIds }),
            });
            if (!res.ok) { toast.error("Failed to add items to collection."); return; }
            toast.success(`${contentIds.length} item${contentIds.length !== 1 ? "s" : ""} added to collection.`);
            handleOpenChange(false);
            onDone();
        } catch {
            toast.error("Failed to add items to collection.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={submitting ? undefined : handleOpenChange}>
                <DialogContent className="sm:max-w-md flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="text-2xl text-primary text-center">Add to Collection</DialogTitle>
                        <DialogDescription className="text-center">
                            Adding {contentIds.length} item{contentIds.length !== 1 ? "s" : ""} to a collection.
                        </DialogDescription>
                        <Separator />
                    </DialogHeader>

                    <div className="px-1 py-2">
                        <CollectionPicker
                            selectedId={selectedId}
                            onSelect={(id) => setSelectedId(id)}
                            onCreateNew={() => setCreateDialogOpen(true)}
                            refreshKey={refreshKey}
                        />
                    </div>

                    <DialogFooter className="flex-col gap-2">
                        <Separator />
                        <div className="flex justify-end gap-2 pt-1">
                            <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting}>
                                Cancel
                            </Button>
                            <Button
                                className="bg-primary text-primary-foreground hover:bg-primary/90"
                                onClick={() => void handleSubmit()}
                                disabled={selectedId == null || submitting}
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AddCollectionDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onCreated={(collection: Collection) => {
                    setSelectedId(collection.id);
                    setRefreshKey((k) => k + 1);
                }}
            />
        </>
    );
}
