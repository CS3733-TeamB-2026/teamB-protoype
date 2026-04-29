import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Loader2, ChevronsUpDown } from "lucide-react";
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
}

/**
 * Dropdown picker for selecting a single Collection by display name search.
 *
 * Mirrors the ContentPicker / EmployeePicker UX: a trigger button shows the
 * current selection, clicking opens a popover with a search input and a
 * scrollable CollectionCard list. Fetches all collections on mount.
 *
 * When `publicOnly` is true, private collections are filtered out client-side
 * from the full list — the fetch still hits `/api/collections` unfiltered.
 * Used in the service request form so only publicly shareable collections
 * can be linked to a request.
 */
export function CollectionPicker({ selectedId, onSelect, disabled = false, publicOnly = false }: Props) {
    const [open, setOpen] = useState(false);
    const [collections, setCollections] = useState<Collection[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    const { getAccessTokenSilently } = useAuth0();

    useEffect(() => {
        const load = async () => {
            try {
                const token = await getAccessTokenSilently();
                const res = await fetch("/api/collections", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data: Collection[] = await res.json();
                setCollections(data);
            } finally {
                setLoading(false);
            }
        };
        void load();
    }, [getAccessTokenSilently]);

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

    const filtered = collections.filter((c) => {
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
                <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border bg-popover shadow-md overflow-hidden">
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
