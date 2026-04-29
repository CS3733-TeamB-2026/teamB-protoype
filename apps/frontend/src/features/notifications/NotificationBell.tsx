import { useCallback, useEffect, useState, useRef } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover.tsx";
import { Button } from "@/components/ui/button.tsx";
import { useUser } from "@/hooks/use-user.ts";
import type { NotificationItem } from "@/lib/types.ts";
import { NotificationCard } from "@/features/notifications/NotificationCard.tsx";
import { toast } from "sonner";

const PAGE_SIZE = 5;

/**
 * A notification bell component that displays unread notifications for the current user.
 * It periodically polls the backend for updates and allows the user to dismiss notifications
 * directly from the popup. Clicking on a notification routes the user to the content, and
 * clicking "View all" navigates to the full notifications page.
 *
 * This component utilizes a `Popover` to display a compact list of recent notifications.
 *
 * @returns A React component rendering the bell icon with a badge, or `null` if the user is not authenticated.
 */
export function NotificationBell() {
    const { user } = useUser();
    const { getAccessTokenSilently } = useAuth0();

    const [items, setItems] = useState<NotificationItem[]>([]);
    const [open, setOpen] = useState(false);
    
    const initialLoadDone = useRef(false);
    const prevIdsRef = useRef<Set<string>>(new Set());

    /**
     * Fetches the latest notifications from the backend API.
     * Requires an active Auth0 token for authorization.
     * Silently catches errors to prevent disrupting the user experience if the network fails.
     */
    const load = useCallback(async () => {
        if (!user) return;
        try {
            const token = await getAccessTokenSilently();
            const res = await fetch(`/api/notifications`, {
                headers: { Authorization: `Bearer ${token}` },
                cache: "no-store",
            });
            if (!res.ok) return;
            const data: NotificationItem[] = await res.json();
            
            // Detect newly-arrived notifications (not present in our previous fetch) and toast them
            if (initialLoadDone.current) {
                const newOnes = data.filter((n) => !prevIdsRef.current.has(n.id));
                if (newOnes.length === 1) {
                    toast.info(`New notification: ${newOnes[0].contentName}`);
                } else if (newOnes.length > 1) {
                    toast.info(`${newOnes.length} new notifications`);
                }
            } else {
                initialLoadDone.current = true;
            }
            
            // Update the known IDs and the UI items
            prevIdsRef.current = new Set(data.map((n) => n.id));
            setItems(data);
        } catch {
            // silent — bell is best-effort
        }
    }, [getAccessTokenSilently, user]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            void load();
        }, 0);
        const id = setInterval(load, 9_000);
        return () => {
            clearTimeout(timeoutId);
            clearInterval(id);
        };
    }, [load]);

    /**
     * Dismisses a notification both optimistically on the client and persistently on the server.
     * Figures out the dismissal type (regular notification or expiration alert) based on the ID prefix.
     *
     * @param id The unique identifier of the notification to dismiss.
     */
    const handleDismiss = async (id: string) => {
        setItems((prev) => prev.filter((n) => n.id !== id));
        // We also remove it from our known IDs so if it magically comes back from a stale poll, 
        // we handle it properly, though the backend shouldn't return dismissed ones.
        prevIdsRef.current.delete(id);

        try {
            const token = await getAccessTokenSilently();
            
            // Expiration IDs are prefixed with "exp-" and contain the threshold (e.g., "exp-123-3d")
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
            // Silently fail — the next polling cycle will restore the notification if the request failed
        }
    };

    if (!user) return null;

    const count = items.length;
    const pageItems = items.slice(0, PAGE_SIZE);
    
    // Format the badge to show "9+" if there are more than 9 notifications
    const badge = count === 0 ? null : count > 9 ? "9+" : String(count);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button className="group cursor-pointer p-2 ml-3 rounded-full active:scale-[0.96] transition-all duration-200 relative">
                    <Bell
                        size={28}
                        className="opacity-70 transition-all duration-200 group-hover:opacity-100"
                    />
                    {badge && (
                        <span className="absolute top-0 right-0 min-w-4.5 h-4.5 px-1 rounded-full bg-accent text-primary-foreground text-[10px] font-semibold flex items-center justify-center">
                            {badge}
                        </span>
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 mr-4 flex flex-col">
                <div className="px-3 pt-2 text-center text-lg font-semibold text-primary">
                    Notifications
                </div>
                <div className="px-2">
                    {pageItems.length === 0 ? (
                        <p className="p-4 text-center text-sm text-muted-foreground">
                            You have no notifications.
                        </p>
                    ) : (
                        <div className="flex flex-col gap-1">
                            {pageItems.map((n, i) => (
                                <NotificationCard
                                    key={n.id}
                                    notification={n}
                                    compact
                                    index={i}
                                    onSelect={() => setOpen(false)}
                                    onDismiss={handleDismiss}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="px-2 pb-2">
                    <Button asChild size="sm" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                        <Link to="/notifications" onClick={() => setOpen(false)}>
                            View all
                        </Link>
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
