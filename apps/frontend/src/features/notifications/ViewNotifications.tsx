import { useCallback, useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import {
    Loader2,
    AlertCircle,
    Bell,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { useUser } from "@/hooks/use-user.ts";
import { usePageTitle } from "@/hooks/use-page-title.ts";
import { toast } from "sonner";
import type { NotificationItem } from "@/lib/types.ts";
import { NotificationCard } from "@/features/notifications/NotificationCard.tsx";
import { Button } from "@/components/ui/button.tsx";

export default function ViewNotifications() {
    usePageTitle("Notifications");
    const { user } = useUser();
    const { getAccessTokenSilently } = useAuth0();

    const [items, setItems] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [typeFilters, setTypeFilters] = useState<Array<"change" | "ownership" | "expiration">>([]);

    const refreshNotifications = useCallback(async () => {
        try {
            const token = await getAccessTokenSilently();
            const res = await fetch(`/api/notifications`, {
                headers: { Authorization: `Bearer ${token}` },
                cache: "no-store",
            });
            const data: NotificationItem[] = await res.json();
            setItems(data);
        } catch {
            toast.error("Failed to refresh notifications.");
        }
    }, [getAccessTokenSilently]);
    const handleDismiss = async (id: string) => {
        setItems((prev) => prev.filter((n) => n.id !== id));

        try {
            const token = await getAccessTokenSilently();
            const body = id.startsWith("exp-")
                ? (() => {
                    const match = id.match(/^exp-(\d+)-(.+)$/);
                    if (!match) return null;
                    return { kind: "expiration", contentId: Number(match[1]), threshold: match[2] };
                })()
                : { kind: "notification", notificationId: Number(id) };

            if (!body) return;

            await fetch(`/api/notifications/dismiss`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
        } catch {
            toast.error("Failed to dismiss notification.");
        }
    };



    useEffect(() => {
        if (!user) return;
        const fetchNotifications = async () => {
            try {
                const token = await getAccessTokenSilently();
                const res = await fetch(`/api/notifications`, {
                    headers: { Authorization: `Bearer ${token}` },
                    cache: "no-store",
                });
                const data: NotificationItem[] = await res.json();
                setItems(data);
                setLoading(false);
            } catch {
                setError("Failed to load notifications.");
                setLoading(false);
            }
        };
        void fetchNotifications();
    }, [getAccessTokenSilently, user]);

    useEffect(() => {
        const id = setInterval(refreshNotifications, 20_000);
        return () => clearInterval(id);
    }, [refreshNotifications]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrentPage(1);
    }, [typeFilters]);

    if (!user) return (
        <div className="flex items-center justify-center min-h-screen bg-secondary">
            <Loader2 className="w-10 h-10 text-primary animate-spin"/>
        </div>
    );

    const filteredItems = typeFilters.length === 0
        ? items
        : items.filter((n) => typeFilters.includes(n.type));

    const activeFilterCount = typeFilters.length;

    const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
    const paginated = filteredItems.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize,
    );

    return (
        <div className="container max-w-5xl py-8 mx-auto">
            <div className="mb-4">
                <h1 className="text-2xl font-bold text-primary">Notifications</h1>
                <p className="text-muted-foreground">
                    Updates on content changes, ownership transfers, and upcoming expirations relevant to your role.
                </p>
                <Separator className="bg-primary mt-4" />
            </div>

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

            {!loading && !error && items.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                    <Bell className="w-10 h-10"/>
                    <p className="text-sm">You have no notifications.</p>
                </div>
            )}

            {!loading && !error && items.length > 0 && (
                <>
                    <div className="flex flex-row justify-between items-baseline mb-4">
                        <div className="flex flex-row gap-2 items-center">
                            <Button
                                variant="outline"
                                onClick={() => setShowAdvancedFilters((prev) => !prev)}
                                className="bg-card shadow-sm hover:bg-secondary hover:text-secondary-foreground h-11 w-25 text-base"
                            >
                                {showAdvancedFilters
                                    ? "Hide Filters"
                                    : activeFilterCount > 0
                                        ? `Filters (${activeFilterCount})`
                                        : "Filters"}
                            </Button>
                        </div>
                    </div>

                    <div className="flex gap-4 items-start">
                        {showAdvancedFilters && (
                            <div className="shrink-0 w-48 rounded-lg border border-border p-3 bg-card text-left text-sm">
                                <div className="flex flex-col gap-4">
                                    <div>
                                        <p className="font-medium mb-2 text-foreground">Type</p>
                                        <div className="flex flex-col gap-1.5">
                                            {(["change", "ownership", "expiration"] as const).map((type) => (
                                                <label key={type} className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={typeFilters.includes(type)}
                                                        onChange={(e) => {
                                                            setTypeFilters((prev) =>
                                                                e.target.checked
                                                                    ? [...prev, type]
                                                                    : prev.filter((t) => t !== type),
                                                            );
                                                        }}
                                                    />
                                                    <span className="capitalize">{type}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="w-full"
                                        onClick={() => setTypeFilters([])}
                                    >
                                        Clear Filters
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="flex-1 min-w-0">
                            <div className="flex flex-col gap-3">
                                {paginated.map((n) => (
                                    <NotificationCard
                                        key={n.id}
                                        notification={n}
                                        onDismiss={handleDismiss}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-6 px-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <span>Rows per page</span>
                            <select
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="border border-border rounded px-2 py-1 bg-background text-foreground text-sm"
                            >
                                {[10, 25, 50, 100].map((size) => (
                                    <option key={size} value={size}>{size}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-3">
                            <span>
                                {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredItems.length)} of {filteredItems.length}
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                    className="w-8 h-8 flex items-center justify-center rounded-md transition-colors hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="First page"
                                >
                                    <ChevronsLeft className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="w-8 h-8 flex items-center justify-center rounded-md transition-colors hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Previous page"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="px-2">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="w-8 h-8 flex items-center justify-center rounded-md transition-colors hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Next page"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className="w-8 h-8 flex items-center justify-center rounded-md transition-colors hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Last page"
                                >
                                    <ChevronsRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}