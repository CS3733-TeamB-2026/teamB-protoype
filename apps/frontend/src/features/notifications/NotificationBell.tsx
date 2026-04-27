import { useCallback, useEffect, useState } from "react";
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

const PAGE_SIZE = 5;

export function NotificationBell() {
    const { user } = useUser();
    const { getAccessTokenSilently } = useAuth0();

    const [items, setItems] = useState<NotificationItem[]>([]);
    const [open, setOpen] = useState(false);

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
            setItems(data);
        } catch {
            //silent
        }
    }, [getAccessTokenSilently, user]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void load();
        const id = setInterval(load, 30_000);
        return () => clearInterval(id);
    }, [load]);
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
            // silent — refresh will restore if it failed
        }
    };

    if (!user) return null;

    const count = items.length;
    const pageItems = items.slice(0, PAGE_SIZE);
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