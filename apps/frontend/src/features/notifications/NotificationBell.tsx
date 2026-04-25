import { useCallback, useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { useUser } from "@/hooks/use-user.ts";
import type { NotificationItem } from "@/lib/types.ts";
import { NotificationCard } from "@/features/notifications/NotificationCard.tsx";

const PREVIEW_COUNT = 500;

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
            // silent — bell is best-effort
        }
    }, [getAccessTokenSilently, user]);

    useEffect(() => {
        void load();
        const id = setInterval(load, 30_000);
        return () => clearInterval(id);
    }, [load]);

    if (!user) return null;

    const count = items.length;
    const preview = items.slice(0, PREVIEW_COUNT);
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
                        <span className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-primary-foreground text-[10px] font-semibold flex items-center justify-center">
                            {badge}
                        </span>
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 mr-4">
                <div className="px-3 py-2 font-semibold text-primary">
                    Notifications
                </div>
                <Separator className="bg-primary" />
                <div className="max-h-96 overflow-y-auto">
                    {preview.length === 0 ? (
                        <p className="p-6 text-center text-sm text-muted-foreground">
                            You have no notifications.
                        </p>
                    ) : (
                        <div className="flex flex-col p-1">
                            {preview.map((n) => (
                                <NotificationCard
                                    key={n.id}
                                    notification={n}
                                    compact
                                    onSelect={() => setOpen(false)}
                                />
                            ))}
                        </div>
                    )}
                </div>
                <Separator className="bg-primary" />
                <Link
                    to="/notifications"
                    onClick={() => setOpen(false)}
                    className="block w-full text-center px-3 py-2 text-sm font-semibold rounded-b-md transition-colors hover:bg-secondary"
                >
                    View all
                </Link>
            </PopoverContent>
        </Popover>
    );
}