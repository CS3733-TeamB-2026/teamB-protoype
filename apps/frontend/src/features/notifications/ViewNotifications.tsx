import { useCallback, useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import {
    Loader2,
    AlertCircle,
    Bell,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { useUser } from "@/hooks/use-user.ts";
import { usePageTitle } from "@/hooks/use-page-title.ts";
import { TablePagination } from "@/components/shared/TablePagination.tsx";
import { toast } from "sonner";
import { NotificationCard } from "@/features/notifications/NotificationCard.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Tabs, TabsTrigger } from "@/components/ui/tabs";
import { SlidingTabs } from "@/components/shared/SlidingTabs.tsx";
import type { NotificationItem, NotificationTab } from "@/lib/types.ts";
import { ClearAllDialog } from "@/features/notifications/ClearAllDialog.tsx";
import InfoButton from "@/components/layout/InformationAlert.tsx";

export default function ViewNotifications() {
    usePageTitle("Notifications");
    const { user } = useUser();
    const { getAccessTokenSilently } = useAuth0();

    const [activeItems, setActiveItems] = useState<NotificationItem[]>([]);
    const [dismissedItems, setDismissedItems] = useState<NotificationItem[]>([]);
    const [activeTab, setActiveTab] = useState<NotificationTab>("active");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [typeFilters, setTypeFilters] = useState<Array<"change" | "ownership" | "expiration">>([]);
    const [clearAllOpen, setClearAllOpen] = useState(false);

    const refreshNotifications = useCallback(async () => {
        try {
            const token = await getAccessTokenSilently();
            const [activeRes, dismissedRes] = await Promise.all([
                fetch(`/api/notifications`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
                fetch(`/api/notifications/dismissed`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
            ]);
            const activeData: NotificationItem[] = await activeRes.json();
            const dismissedData: NotificationItem[] = await dismissedRes.json();
            setActiveItems(activeData);
            setDismissedItems(dismissedData);
        } catch {
            toast.error("Failed to refresh notifications.");
        }
    }, [getAccessTokenSilently]);

    const handleDismiss = async (id: string) => {
        const dismissedAt = new Date().toISOString();
        setActiveItems((prev) => {
            const target = prev.find((n) => n.id === id);
            if (target && !id.startsWith("exp-")) {
                setDismissedItems((d) => {
                    if (d.some((existing) => existing.id === id)) return d;
                    return [{ ...target, dismissedAt }, ...d];
                });
            }
            return prev.filter((n) => n.id !== id);
        });
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

    const handleClearAll = async () => {
        const snapshot = [...activeItems];
        setActiveItems([]);
        try {
            const token = await getAccessTokenSilently();
            await Promise.all(
                snapshot.map((n) => {
                    const body = n.id.startsWith("exp-")
                        ? (() => {
                            const match = n.id.match(/^exp-(\d+)-(.+)$/);
                            if (!match) return null;
                            return { kind: "expiration", contentId: Number(match[1]), threshold: match[2] };
                        })()
                        : { kind: "notification", notificationId: Number(n.id) };
                    if (!body) return Promise.resolve();
                    return fetch(`/api/notifications/dismiss`, {
                        method: "POST",
                        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                        body: JSON.stringify(body),
                    });
                })
            );
            toast.success("All notifications cleared.");
        } catch {
            setActiveItems(snapshot);
            toast.error("Failed to clear notifications.");
        }
    };

    const userId = user?.id;

    useEffect(() => {
        if (!userId) return;
        const fetchAll = async () => {
            try {
                const token = await getAccessTokenSilently();
                const [activeRes, dismissedRes] = await Promise.all([
                    fetch(`/api/notifications`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
                    fetch(`/api/notifications/dismissed`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
                ]);
                const activeData: NotificationItem[] = await activeRes.json();
                const dismissedData: NotificationItem[] = await dismissedRes.json();
                setActiveItems(activeData);
                setDismissedItems(dismissedData);
                setLoading(false);
            } catch {
                setError("Failed to load notifications.");
                setLoading(false);
            }
        };
        void fetchAll();
    }, [getAccessTokenSilently, userId]);

    useEffect(() => {
        const id = setInterval(refreshNotifications, 5_000);
        return () => clearInterval(id);
    }, [refreshNotifications]);

    if (!user) return (
        <div className="flex items-center justify-center min-h-screen bg-secondary">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
    );

    const items = activeTab === "active" ? activeItems : dismissedItems;
    const filteredItems = typeFilters.length === 0
        ? items
        : items.filter((n) => typeFilters.includes(n.type));
    const activeFilterCount = typeFilters.length;
    const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
    const paginated = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <div className="container max-w-5xl py-8 mx-auto">
            <div className="mb-4">
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-primary">Notifications</h1>
                    <InfoButton content={"Active notifications include content changes, ownership transfers, and upcoming expirations. Dismiss individual notifications or use Clear All to remove them. Dismissed notifications are stored in the Dismissed tab. Note that you cannot view expiry notifications after they have been dismissed."} />
                </div>                <p className="text-muted-foreground">
                    Updates on content changes, ownership transfers, and upcoming expirations relevant to your role.
                </p>
                <Separator className="bg-primary mt-4" />
            </div>

            <Tabs
                value={activeTab}
                onValueChange={(v) => {
                    setActiveTab(v as NotificationTab);
                    setCurrentPage(1);
                    if (v === "dismissed") {
                        setTypeFilters((prev) => prev.filter((t) => t !== "expiration"));
                    }
                }}
            >
                <SlidingTabs activeTab={activeTab} indicatorColor="bg-foreground">
                    <TabsTrigger
                        value="active"
                        className="relative z-10 data-active:bg-transparent data-active:text-foreground hover:text-foreground/80 data-active:hover:text-foreground px-0"
                    >
                        Active
                        <span className="ml-2 text-xs opacity-70">{activeItems.length}</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="dismissed"
                        className="relative z-10 data-active:bg-transparent data-active:text-foreground hover:text-foreground/80 data-active:hover:text-foreground px-0"
                    >
                        Dismissed
                        <span className="ml-2 text-xs opacity-70">{dismissedItems.length}</span>
                    </TabsTrigger>
                </SlidingTabs>
            </Tabs>

            {loading && (
                <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <p className="text-sm">Loading...</p>
                </div>
            )}

            {error && (
                <Alert variant="destructive" className="my-4">
                    <AlertCircle />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {!loading && !error && items.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                    <Bell className="w-10 h-10" />
                    <p className="text-sm">
                        {activeTab === "active"
                            ? "You have no notifications."
                            : "You haven't dismissed any notifications."}
                    </p>
                </div>
            )}

            {!loading && !error && items.length > 0 && (
                <>
                    <div className="flex flex-row justify-between items-baseline mb-4 mt-4">
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
                            {activeTab === "active" && activeItems.length > 0 && (
                                <Button
                                    variant="outline"
                                    onClick={() => setClearAllOpen(true)}
                                    className="bg-card shadow-sm hover:bg-destructive hover:text-white h-11 text-base"
                                >
                                    Clear all
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-4 items-start">
                        {showAdvancedFilters && (
                            <div className="shrink-0 w-48 rounded-lg border border-border p-3 bg-card text-left text-sm">
                                <div className="flex flex-col gap-4">
                                    <div>
                                        <p className="font-medium mb-2 text-foreground">Type</p>
                                        <div className="flex flex-col gap-1.5">
                                            {(activeTab === "active"
                                                    ? ["change", "ownership", "expiration"] as const
                                                    : ["change", "ownership"] as const
                                            ).map((type) => (
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
                                                            setCurrentPage(1);
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
                                        onClick={() => {
                                            setTypeFilters([]);
                                            setCurrentPage(1);
                                        }}
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
                                        onDismiss={activeTab === "active" ? handleDismiss : undefined}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <TablePagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        pageSize={pageSize}
                        totalItems={filteredItems.length}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
                    />
                </>
            )}
            <ClearAllDialog
                open={clearAllOpen}
                onOpenChange={setClearAllOpen}
                onConfirm={async () => {
                    await handleClearAll();
                    setClearAllOpen(false);
                }}
            />
        </div>
    );
}