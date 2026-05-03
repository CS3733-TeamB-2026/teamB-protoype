import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Loader2, Plus } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
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
 * When no collections exist yet, the create form is shown immediately.
 * If creating new, the collection is created first then the items are appended
 * via POST /api/collections/:id/items. The `onDone` callback fires on success
 * so the caller can clear its selection state.
 */
export function AddToCollectionDialog({ open, onOpenChange, contentIds, onDone }: Props) {
    const { getAccessTokenSilently } = useAuth0();
    const [collections, setCollections] = useState<Collection[]>([]);
    const [loadingCollections, setLoadingCollections] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!open) return;
        setSelectedId(null);
        setCreating(false);
        setNewName("");

        const load = async () => {
            setLoadingCollections(true);
            try {
                const token = await getAccessTokenSilently();
                const res = await fetch("/api/collections", { headers: { Authorization: `Bearer ${token}` } });
                const data: Collection[] = await res.json();
                setCollections(data);
                // If there are no collections, jump straight to the create form.
                if (data.length === 0) setCreating(true);
            } catch {
                toast.error("Failed to load collections.");
            } finally {
                setLoadingCollections(false);
            }
        };
        void load();
    }, [open, getAccessTokenSilently]);

    const canSubmit = creating ? newName.trim().length > 0 : selectedId !== null;

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setSubmitting(true);
        try {
            const token = await getAccessTokenSilently();
            let targetId = selectedId;

            if (creating) {
                const res = await fetch("/api/collections", {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                    body: JSON.stringify({ displayName: newName.trim(), isPublic: false }),
                });
                if (!res.ok) { toast.error("Failed to create collection."); return; }
                const created: Collection = await res.json();
                targetId = created.id;
            }

            const res = await fetch(`/api/collections/${targetId}/items`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ contentIds }),
            });
            if (!res.ok) { toast.error("Failed to add items to collection."); return; }

            toast.success(`${contentIds.length} item${contentIds.length !== 1 ? "s" : ""} added to collection.`);
            onOpenChange(false);
            onDone();
        } catch {
            toast.error("Failed to add items to collection.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={submitting ? undefined : onOpenChange}>
            <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-2xl text-primary text-center">Add to Collection</DialogTitle>
                    <DialogDescription className="text-center">
                        Adding {contentIds.length} item{contentIds.length !== 1 ? "s" : ""} to a collection.
                    </DialogDescription>
                    <Separator />
                </DialogHeader>

                <div className="overflow-y-auto overscroll-contain flex-1 min-w-0 px-2">
                    {loadingCollections ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : creating ? (
                        <div className="flex flex-col gap-3 py-2">
                            {collections.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-fit text-muted-foreground"
                                    onClick={() => setCreating(false)}
                                >
                                    ← Back to collections
                                </Button>
                            )}
                            <p className="text-sm font-medium">New collection name</p>
                            <Input
                                placeholder="e.g. Underwriter Onboarding"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") void handleSubmit(); }}
                                disabled={submitting}
                                autoFocus
                            />
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-col gap-1 py-2">
                                {collections.map((c) => (
                                    <label
                                        key={c.id}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors ${selectedId === c.id ? "bg-primary/10" : "hover:bg-muted/50"}`}
                                    >
                                        <input
                                            type="radio"
                                            name="collection"
                                            value={c.id}
                                            checked={selectedId === c.id}
                                            onChange={() => setSelectedId(c.id)}
                                            className="accent-primary"
                                        />
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">{c.displayName}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {c.items.length} item{c.items.length !== 1 ? "s" : ""} · {c.public ? "Public" : "Private"}
                                            </span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                            <Separator className="my-1" />
                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
                                onClick={() => setCreating(true)}
                            >
                                <Plus className="w-4 h-4" />
                                Create new collection
                            </Button>
                        </>
                    )}
                </div>

                <DialogFooter className="flex-col gap-2">
                    <Separator />
                    <div className="flex justify-end gap-2 pt-1">
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                            onClick={() => void handleSubmit()}
                            disabled={!canSubmit || submitting}
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : creating ? "Create & Add" : "Add"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
