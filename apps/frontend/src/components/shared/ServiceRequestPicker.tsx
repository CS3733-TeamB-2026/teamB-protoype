import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ChevronsUpDown, ClipboardList } from "lucide-react";
import { formatLabel } from "@/lib/utils";
import type { ServiceReq } from "@/lib/types";
import { useAuth0 } from "@auth0/auth0-react";

interface Props {
    selectedId: number | null;
    onSelect: (id: number | null, servicereq: ServiceReq | null) => void;
    disabled?: boolean;
    /** Increment to trigger a refetch of the unlinked service requests list. */
    refreshKey?: number;
}

/**
 * Dropdown picker for selecting an unlinked service request.
 *
 * Fetches /api/servicereqs/unlinked — requests with no linked content or collection.
 * Mirrors the CollectionPicker UX: trigger button, popover with search, scrollable list.
 */
export function ServiceRequestPicker({ selectedId, onSelect, disabled = false, refreshKey = 0 }: Props) {
    const [open, setOpen] = useState(false);
    const [servicereqs, setServicereqs] = useState<ServiceReq[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    const { getAccessTokenSilently } = useAuth0();

    useEffect(() => {
        setLoading(true);
        const load = async () => {
            try {
                const token = await getAccessTokenSilently();
                const res = await fetch("/api/servicereqs/unlinked", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data: ServiceReq[] = await res.json();
                setServicereqs(data);
            } finally {
                setLoading(false);
            }
        };
        void load();
    }, [getAccessTokenSilently, refreshKey]);

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

    const selected = selectedId != null ? servicereqs.find((s) => s.id === selectedId) : undefined;

    const filtered = servicereqs.filter((s) => {
        const q = search.toLowerCase().trim();
        return !q || (s.name ?? "").toLowerCase().includes(q) || formatLabel(s.type).toLowerCase().includes(q);
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
                    <SelectedPreview servicereq={selected} />
                ) : (
                    <span className="text-muted-foreground">Select service request...</span>
                )}
                <ChevronsUpDown className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
            </Button>

            {open && !disabled && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border bg-popover shadow-md overflow-hidden">
                    <div className="p-2 border-b">
                        <Input
                            placeholder="Search service requests..."
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
                                {search ? "No matching service requests." : "No unlinked service requests available."}
                            </p>
                        ) : (
                            <div className="p-1 flex flex-col gap-1">
                                {filtered.map((sr) => (
                                    <button
                                        key={sr.id}
                                        type="button"
                                        className={`w-full text-left rounded-md px-3 py-2 hover:bg-accent transition-colors ${selectedId === sr.id ? "ring-2 ring-accent" : ""}`}
                                        onClick={() => {
                                            onSelect(sr.id, sr);
                                            setOpen(false);
                                            setSearch("");
                                        }}
                                    >
                                        <p className="text-sm font-medium truncate">{sr.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatLabel(sr.type)} · Due {new Date(sr.deadline).toLocaleDateString()}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

/** Compact icon + name shown inside the trigger button when a service request is selected. */
function SelectedPreview({ servicereq }: { servicereq: ServiceReq }) {
    return (
        <span className="flex items-center gap-2 text-sm min-w-0">
            <ClipboardList className="w-4 h-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{servicereq.name}</span>
        </span>
    );
}
