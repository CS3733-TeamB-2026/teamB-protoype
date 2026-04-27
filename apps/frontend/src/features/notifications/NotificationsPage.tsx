import { useEffect, useState, useCallback } from "react";
import { Bell, AlertCircle, CheckCheck, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Hero } from "@/components/shared/Hero.tsx";
import { useUser } from "@/hooks/use-user.ts";
import { usePageTitle } from "@/hooks/use-page-title.ts";
import { useAuth0 } from "@auth0/auth0-react";
import { toast } from "sonner";
import {
    fetchNotifications,
    markNotificationRead,
    markAllNotificationsRead,
} from "./notification.service.ts";
import { NotificationFilters } from "./NotificationFilters.tsx";
import { NotificationCard } from "./NotificationCard.tsx";
import type { Notification, NotificationFilterTab } from "./notification.types.ts";

export function NotificationsPage() {
    usePageTitle("Notifications");

    const { user, loading: userLoading }       = useUser();
    const { getAccessTokenSilently }           = useAuth0();

    const [notifications, setNotifications]   = useState<Notification[]>([]);
    const [loading, setLoading]               = useState(true);
    const [error, setError]                   = useState<string | null>(null);
    const [activeFilter, setActiveFilter]     = useState<NotificationFilterTab>("all");
    const [markingReadId, setMarkingReadId]   = useState<string | null>(null);
    const [markingAll, setMarkingAll]         = useState(false);

    // -----------------------------------------------------------------------
    // Fetch
    // -----------------------------------------------------------------------
    const loadNotifications = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            const data = await fetchNotifications(getAccessTokenSilently);
            setNotifications(data);
        } catch {
            setError("Failed to load notifications. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [user, getAccessTokenSilently]);

    useEffect(() => {
        if (!userLoading) loadNotifications();
    }, [userLoading, loadNotifications]);

    // -----------------------------------------------------------------------
    // Actions
    // -----------------------------------------------------------------------
    const handleMarkRead = async (id: string) => {
        setMarkingReadId(id);
        try {
            await markNotificationRead(getAccessTokenSilently, id);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, read: true } : n))
            );
        } catch {
            toast.error("Could not mark notification as read.");
        } finally {
            setMarkingReadId(null);
        }
    };

    const handleMarkAllRead = async () => {
        setMarkingAll(true);
        try {
            await markAllNotificationsRead(getAccessTokenSilently);
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            toast.success("All notifications marked as read.");
        } catch {
            toast.error("Could not mark all notifications as read.");
        } finally {
            setMarkingAll(false);
        }
    };

    // -----------------------------------------------------------------------
    // Derived state
    // -----------------------------------------------------------------------
    const filtered    = notifications.filter((n) =>
        activeFilter === "all" ? true : n.type === activeFilter
    );
    const unreadCount = notifications.filter((n) => !n.read).length;
    const hasUnread   = unreadCount > 0;

    // -----------------------------------------------------------------------
    // Render helpers
    // -----------------------------------------------------------------------
    function renderSkeletons() {
        return Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 p-4 rounded-lg bg-card ring-1 ring-foreground/10">
                <div className="flex items-center gap-2">
                    <Skeleton className="size-2 rounded-full" />
                    <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
            </div>
        ));
    }

    function renderEmpty() {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
                <Bell className="size-10 opacity-30" />
                <p className="text-sm font-medium">No notifications</p>
                <p className="text-xs">
                    {activeFilter === "all"
                        ? "You're all caught up — nothing to see here."
                        : `No ${activeFilter.replace("_", " ")} notifications right now.`}
                </p>
            </div>
        );
    }

    // -----------------------------------------------------------------------
    // JSX
    // -----------------------------------------------------------------------
    return (
        <div className="flex flex-col min-h-screen">
            <Hero
                icon={Bell}
                title="Notifications"
                description="Stay up to date with document changes, expirations, and ownership updates relevant to your role."
            />

            <div className="flex-1 px-4 py-6 sm:px-8 max-w-4xl w-full mx-auto flex flex-col gap-4">

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {loading || userLoading ? (
                        <Skeleton className="h-8 w-72" />
                    ) : (
                        <NotificationFilters
                            activeFilter={activeFilter}
                            onChange={setActiveFilter}
                            unreadCount={unreadCount}
                        />
                    )}

                    {!loading && !userLoading && hasUnread && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleMarkAllRead}
                            disabled={markingAll}
                            className="shrink-0 w-fit"
                        >
                            {markingAll ? <Loader2 className="animate-spin" /> : <CheckCheck />}
                            Mark all as read
                        </Button>
                    )}
                </div>

                <div className="flex flex-col gap-3">
                    {loading || userLoading ? (
                        renderSkeletons()
                    ) : filtered.length === 0 ? (
                        renderEmpty()
                    ) : (
                        filtered.map((notification) => (
                            <NotificationCard
                                key={notification.id}
                                notification={notification}
                                onMarkRead={handleMarkRead}
                                markingRead={markingReadId === notification.id}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
