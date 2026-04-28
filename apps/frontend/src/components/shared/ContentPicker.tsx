import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Loader2, ChevronsUpDown } from "lucide-react";
import { ContentItemCard } from "@/components/shared/ContentItemCard.tsx";
import { ContentIcon } from "@/features/content/components/ContentIcon.tsx";
import { getCategory, getOriginalFilename, lookupByFilename } from "@/lib/mime.ts";
import type { ContentItem } from "@/lib/types.ts";
import { useUser } from "@/hooks/use-user.ts";
import { useAuth0 } from "@auth0/auth0-react";

interface Props {
    selectedId: number | null;
    onSelect: (id: number | null, item: ContentItem | null) => void;
    /** Content IDs to hide from the list (e.g. already in the collection). */
    excludeIds?: number[];
    disabled?: boolean;
}

/**
 * Dropdown picker for selecting a single ContentItem by display name search.
 *
 * Mirrors the EmployeePicker UX: a trigger button shows the current selection,
 * clicking opens a popover with a search input and a scrollable ContentItemCard
 * list. Fetches all content visible to the current user's persona on mount.
 *
 * Pass `excludeIds` to hide items that are already members of a collection so
 * the user can't add duplicates.
 */
export function ContentPicker({ selectedId, onSelect, excludeIds = [], disabled = false }: Props) {
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<ContentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    const { user } = useUser();
    const { getAccessTokenSilently } = useAuth0();

    useEffect(() => {
        if (!user) return;
        const load = async () => {
            try {
                const token = await getAccessTokenSilently();
                const res = await fetch(`/api/content?persona=${encodeURIComponent(user.persona)}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data: ContentItem[] = await res.json();
                setItems(data);
            } finally {
                setLoading(false);
            }
        };
        void load();
    }, [user, getAccessTokenSilently]);

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

    const selected = selectedId != null ? items.find((i) => i.id === selectedId) : undefined;

    const excludeSet = new Set(excludeIds);
    const filtered = items
        .filter((i) => !excludeSet.has(i.id))
        .filter((i) => {
            const q = search.toLowerCase().trim();
            return !q || i.displayName.toLowerCase().includes(q);
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
                    <SelectedPreview item={selected} />
                ) : (
                    <span className="text-muted-foreground">Select content...</span>
                )}
                <ChevronsUpDown className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
            </Button>

            {open && !disabled && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border bg-popover shadow-md overflow-hidden">
                    <div className="p-2 border-b">
                        <Input
                            placeholder="Search by name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-8"
                            autoFocus
                        />
                    </div>

                    <div className="overflow-y-auto max-h-72 overscroll-contain">
                        {loading ? (
                            <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm">Loading...</span>
                            </div>
                        ) : filtered.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-6">
                                {search ? "No matching content." : "No content available."}
                            </p>
                        ) : (
                            <div className="p-1 flex flex-col gap-1">
                                {filtered.map((item) => (
                                    // Clicking anywhere on the card selects it; the nav button inside
                                    // calls stopPropagation so it doesn't also trigger selection.
                                    <div
                                        key={item.id}
                                        className={`cursor-pointer rounded-md ${selectedId === item.id ? "ring-2 ring-accent" : ""}`}
                                        onClick={() => {
                                            onSelect(item.id, item);
                                            setOpen(false);
                                            setSearch("");
                                        }}
                                    >
                                        <ContentItemCard item={item} />
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

/** Compact icon + name shown inside the trigger button when an item is selected. */
function SelectedPreview({ item }: { item: ContentItem }) {
    const originalFilename = item.fileURI ? getOriginalFilename(item.fileURI) : null;
    const mimeType = originalFilename ? lookupByFilename(originalFilename)?.mimeType : null;
    const category = getCategory(mimeType, originalFilename);

    return (
        <span className="flex items-center gap-2 text-sm min-w-0">
            <ContentIcon category={category} isLink={!!item.linkURL} className="w-4 h-4 shrink-0" />
            <span className="truncate">{item.displayName}</span>
        </span>
    );
}