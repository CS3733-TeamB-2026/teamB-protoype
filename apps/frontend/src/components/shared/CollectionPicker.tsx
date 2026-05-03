import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Loader2, ChevronsUpDown, Plus } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { FolderLibraryIcon } from "@hugeicons/core-free-icons";
import { CollectionCard } from "@/components/shared/CollectionCard.tsx";
import type { Collection } from "@/lib/types.ts";
import { useAuth0 } from "@auth0/auth0-react";

interface Props {
    selectedId: number | null;
    onSelect: (id: number | null, collection: Collection | null) => void;
    disabled?: boolean;
    /** When true, only public collections are shown and selectable. */
    publicOnly?: boolean;
    /** Collection IDs to hide from the list — used to exclude collections already containing the current item. */
    excludeIds?: number[];
    /** When provided, a "Create new collection" option appears at the bottom of the dropdown. */
    onCreateNew?: () => void;
    /**
     * When true, the open dropdown renders in normal document flow instead of as an
     * absolute overlay. Use this when the picker sits at the bottom of a card that has
     * `overflow-hidden` — the in-flow dropdown pushes the card's bottom edge down
     * rather than being clipped.
     */
    inline?: boolean;
    /** Increment to trigger a refetch of the collections list. */
    refreshKey?: number;
    /** When true, only collections not yet linked to any service request are shown. */
    unlinkedSR?: boolean;
}

/**
 * Dropdown picker for selecting a single Collection by display name search.
 *
 * Mirrors the ContentPicker / EmployeePicker UX: a trigger button shows the
 * current selection, clicking opens a popover with a search input and a
 * scrollable CollectionCard list. Fetches all collections on mount and whenever
 * `refreshKey` changes — increment it from the parent after creating a new
 * collection to pull the fresh list without remounting.
 *
 * When `publicOnly` is true, private collections are filtered client-side;
 * the fetch still hits `/api/collections` unfiltered.
 *
 * Pass `inline` when the picker sits at the bottom of a card with
 * `overflow-hidden` — the dropdown renders in normal flow and pushes the card
 * down instead of being clipped by the card boundary.
 *
 * Pass `unlinkedSR` when used inside the SR creation/edit form — appends
 * `?unlinkedSR=true` so the backend filters to collections with no existing
 * SR link, preventing double-linking. Note that `publicOnly` is also required
 * in that context because private collections cannot be linked to SRs.
 */
export function CollectionPicker({ selectedId, onSelect, disabled = false, publicOnly = false, excludeIds = [], onCreateNew, inline = false, refreshKey = 0, unlinkedSR = false }: Props) {
    const [open, setOpen] = useState(false);
    const [collections, setCollections] = useState<Collection[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    const { getAccessTokenSilently } = useAuth0();

    useEffect(() => {
        setLoading(true); // reset before each fetch so the trigger button shows a spinner on refresh
        const load = async () => {
            try {
                const token = await getAccessTokenSilently();
                const params = unlinkedSR ? "?unlinkedSR=true" : "";
                const res = await fetch(`/api/collections${params}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data: Collection[] = await res.json();
                setCollections(data);
            } finally {
                setLoading(false);
            }
        };
        void load();
    }, [getAccessTokenSilently, refreshKey, unlinkedSR]);

    useEffect(() => {
        if (!open) return;
        function handleClick(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [open]);

    const selected = selectedId != null ? collections.find((c) => c.id === selectedId) : undefined;

    const excludeSet = new Set(excludeIds);
    const filtered = collections.filter((c) => {
        if (excludeSet.has(c.id)) return false;
        if (publicOnly && !c.public) return false;
        const q = search.toLowerCase().trim();
        return !q || c.displayName.toLowerCase().includes(q);
    });

    return (
        <div ref={containerRef} className="relative">
            <Button
                type="button"
                variant="outline"
                className="w-full justify-between h-auto py-2 px-3 font-normal"
                onClick={() => setOpen((v) => !v)}
                disabled={disabled}
            >
                {loading ? (
                    <span className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading...
                    </span>
                ) : selected ? (
                    <SelectedPreview collection={selected} />
                ) : (
                    <span className="text-muted-foreground">Select collection...</span>
                )}
                <ChevronsUpDown className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
            </Button>

            {open && !disabled && (
                <div className={inline ? "mt-1 rounded-lg border bg-popover shadow-md overflow-hidden" : "absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border bg-popover shadow-md overflow-hidden"}>
                    <div className="p-2 border-b">
                        <Input
                            placeholder="Search collections..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-8"
                            autoFocus
                        />
                    </div>

                    {/* overscroll-contain prevents scroll from propagating to a parent Dialog */}
                    <div className="overflow-y-auto max-h-72 overscroll-contain">
                        {loading ? (
                            <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm">Loading...</span>
                            </div>
                        ) : filtered.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-6">
                                {search ? "No matching collections." : publicOnly ? "No public collections available." : "No collections available."}
                            </p>
                        ) : (
                            <div className="p-1 flex flex-col gap-1">
                                {filtered.map((collection) => (
                                    <div
                                        key={collection.id}
                                        className={`cursor-pointer rounded-md ${selectedId === collection.id ? "ring-2 ring-accent" : ""}`}
                                        onClick={() => {
                                            onSelect(collection.id, collection);
                                            setOpen(false);
                                            setSearch("");
                                        }}
                                    >
                                        <CollectionCard collection={collection} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {onCreateNew && (
                        <div className="border-t p-1">
                            <button
                                type="button"
                                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                                onClick={() => {
                                    setOpen(false);
                                    setSearch("");
                                    onCreateNew();
                                }}
                            >
                                <Plus className="w-4 h-4 shrink-0" />
                                Create new collection
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/** Compact icon + name shown inside the trigger button when a collection is selected. */
function SelectedPreview({ collection }: { collection: Collection }) {
    return (
        <span className="flex items-center gap-2 text-sm min-w-0">
            <HugeiconsIcon icon={FolderLibraryIcon} className="w-4 h-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{collection.displayName}</span>
        </span>
    );
}
