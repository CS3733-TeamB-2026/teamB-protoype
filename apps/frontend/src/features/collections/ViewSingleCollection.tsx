import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AlertCircle, ArrowLeft, ArrowUp, ArrowDown, BookMarked, Loader2, Pencil, X, Plus } from "lucide-react";
import { useAuth0 } from "@auth0/auth0-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Hero } from "@/components/shared/Hero";
import { EmployeeAvatar } from "@/components/shared/EmployeeAvatar";
import { ContentItemCard } from "@/components/shared/ContentItemCard";
import { ContentIcon } from "@/features/content/components/ContentIcon";
import { ContentPicker } from "@/features/collections/ContentPicker";
import { getCategory, getOriginalFilename, lookupByFilename } from "@/lib/mime";
import { useUser } from "@/hooks/use-user";
import { usePageTitle } from "@/hooks/use-page-title";
import type { Collection, CollectionItem, ContentItem } from "@/lib/types";

export function ViewSingleCollection() {
    const { id } = useParams<{ id: string }>();
    const { getAccessTokenSilently } = useAuth0();
    const { user } = useUser();

    const [collection, setCollection] = useState<Collection | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [editMode, setEditMode] = useState(false);
    const [draftItems, setDraftItems] = useState<CollectionItem[]>([]);
    const [pickerItem, setPickerItem] = useState<ContentItem | null>(null);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    usePageTitle(collection?.displayName ?? "Collection");

    useEffect(() => {
        const load = async () => {
            try {
                const token = await getAccessTokenSilently();
                const res = await fetch(`/api/collections/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error(`${res.status}`);
                const data: Collection = await res.json();
                setCollection(data);
            } catch {
                setError("Collection not found or failed to load.");
            } finally {
                setLoading(false);
            }
        };
        void load();
    }, [id, getAccessTokenSilently]);

    const canEdit = user && collection &&
        (user.persona === "admin" || collection.ownerId === user.id);

    const enterEditMode = () => {
        if (!collection) return;
        setDraftItems([...collection.items]);
        setPickerItem(null);
        setEditMode(true);
    };

    const cancelEdit = () => {
        setEditMode(false);
        setDraftItems([]);
        setPickerItem(null);
    };

    const moveItem = (index: number, direction: -1 | 1) => {
        const next = index + direction;
        if (next < 0 || next >= draftItems.length) return;
        setDraftItems((prev) => {
            const updated = [...prev];
            [updated[index], updated[next]] = [updated[next], updated[index]];
            return updated.map((item, i) => ({ ...item, position: i }));
        });
    };

    const removeItem = (contentId: number) => {
        setDraftItems((prev) =>
            prev.filter((i) => i.contentId !== contentId)
                .map((item, i) => ({ ...item, position: i }))
        );
    };

    const addItem = () => {
        if (!pickerItem || !collection) return;
        if (draftItems.some((i) => i.contentId === pickerItem.id)) {
            toast.error("That item is already in the collection.");
            return;
        }
        setDraftItems((prev) => [
            ...prev,
            {
                collectionId: collection.id,
                contentId: pickerItem.id,
                position: prev.length,
                content: pickerItem,
            },
        ]);
        setPickerItem(null);
    };

    const saveEdit = async () => {
        if (!collection) return;
        setSaving(true);
        try {
            const token = await getAccessTokenSilently();
            const res = await fetch(`/api/collections/${collection.id}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    displayName: collection.displayName,
                    isPublic: collection.public,
                    ownerId: collection.ownerId,
                    contentIds: draftItems.map((i) => i.contentId),
                }),
            });
            if (!res.ok) throw new Error();
            const updated: Collection = await res.json();
            setCollection(updated);
            setEditMode(false);
            setDraftItems([]);
            toast.success("Collection saved.");
        } catch {
            toast.error("Failed to save collection.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-secondary">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
    );

    if (error || !collection) return (
        <div className="max-w-2xl mx-auto my-16 px-4 flex flex-col gap-4">
            <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{error ?? "Collection not found."}</AlertDescription>
            </Alert>
            <Link to="/collections" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Collections
            </Link>
        </div>
    );

    const displayedItems = editMode ? draftItems : collection.items;
    const excludeIds = draftItems.map((i) => i.contentId);

    return (
        <>
            <Hero
                icon={BookMarked}
                title={collection.displayName}
                description={`${collection.items.length} item${collection.items.length !== 1 ? "s" : ""} · ${collection.public ? "Public" : "Private"}`}
            />

            <div className="max-w-3xl mx-auto my-8 px-4 flex flex-col gap-6">

                <Link to="/collections" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
                    <ArrowLeft className="w-4 h-4" /> Back to Collections
                </Link>

                {/* Meta card */}
                <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <CardTitle className="text-2xl text-primary">{collection.displayName}</CardTitle>
                                <CardDescription className="mt-1">
                                    {collection.items.length} item{collection.items.length !== 1 ? "s" : ""}
                                </CardDescription>
                            </div>
                            <Badge variant={collection.public ? "default" : "secondary"} className="shrink-0 mt-1">
                                {collection.public ? "Public" : "Private"}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Owner</span>
                            <EmployeeAvatar employee={collection.owner} size="sm" />
                        </div>
                    </CardContent>
                </Card>

                {/* Content card */}
                <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Content</CardTitle>
                            {canEdit && !editMode && (
                                <Button variant="outline" size="sm" onClick={enterEditMode} className="gap-1.5">
                                    <Pencil className="w-3.5 h-3.5" /> Edit
                                </Button>
                            )}
                            {editMode && (
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={cancelEdit} disabled={saving}>
                                        Cancel
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => void saveEdit()}
                                        disabled={saving}
                                        className="hover:bg-secondary hover:text-secondary-foreground active:scale-95 transition-all bg-primary text-primary-foreground rounded-lg"
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent>
                        {displayedItems.length === 0 && !editMode ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                                <BookMarked className="w-8 h-8" />
                                <p className="text-sm">This collection has no items yet.</p>
                            </div>
                        ) : editMode ? (
                            <div className="flex flex-col gap-4">
                                {/* Editable item table */}
                                {draftItems.length > 0 && (
                                    <div className="rounded-lg border overflow-hidden">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-8">#</TableHead>
                                                    <TableHead>Name</TableHead>
                                                    <TableHead className="w-20 text-center">Order</TableHead>
                                                    <TableHead className="w-10" />
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {draftItems.map((item, index) => {
                                                    const filename = item.content.fileURI ? getOriginalFilename(item.content.fileURI) : null;
                                                    const mime = filename ? lookupByFilename(filename)?.mimeType : null;
                                                    const category = getCategory(mime, filename);
                                                    return (
                                                        <TableRow key={item.contentId}>
                                                            <TableCell className="text-xs text-muted-foreground text-right pr-2">
                                                                {index + 1}
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    <ContentIcon category={category} isLink={!!item.content.linkURL} className="w-4 h-4 shrink-0 text-muted-foreground" />
                                                                    <span className="text-sm font-medium truncate">{item.content.displayName}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center justify-center gap-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                                                        disabled={index === 0}
                                                                        onClick={() => moveItem(index, -1)}
                                                                    >
                                                                        <ArrowUp className="w-3.5 h-3.5" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                                                        disabled={index === draftItems.length - 1}
                                                                        onClick={() => moveItem(index, 1)}
                                                                    >
                                                                        <ArrowDown className="w-3.5 h-3.5" />
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                                    onClick={() => removeItem(item.contentId)}
                                                                >
                                                                    <X className="w-3.5 h-3.5" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => { setPickerItem(null); setAddDialogOpen(true); }}
                                    className="gap-1.5 w-fit"
                                >
                                    <Plus className="w-4 h-4" /> Add Content
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {collection.items.map((item, index) => (
                                    <div key={item.contentId} className="flex items-center gap-3">
                                        <span className="text-xs text-muted-foreground w-5 text-right shrink-0">{index + 1}</span>
                                        <div className="flex-1 min-w-0">
                                            <ContentItemCard item={item.content} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>

            {/* Add content dialog — portal-rendered so the ContentPicker dropdown is never clipped */}
            <Dialog open={addDialogOpen} onOpenChange={(open) => { if (!open) setPickerItem(null); setAddDialogOpen(open); }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add Content</DialogTitle>
                    </DialogHeader>
                    <ContentPicker
                        selectedId={pickerItem?.id ?? null}
                        onSelect={(_, item) => setPickerItem(item)}
                        excludeIds={excludeIds}
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
                        <Button
                            onClick={() => { addItem(); setAddDialogOpen(false); }}
                            disabled={!pickerItem}
                            className="hover:bg-secondary hover:text-secondary-foreground active:scale-95 transition-all bg-primary text-primary-foreground rounded-lg px-4 py-1"
                        >
                            Add
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}