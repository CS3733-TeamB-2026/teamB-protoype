import { useEffect, useState, useMemo } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useUser } from "@/hooks/use-user.ts";
import { ContentIcon } from "@/features/content/components/ContentIcon.tsx";
import { ExpirationBadge } from "@/features/content/components/ExpirationBadge.tsx";
import { getCategory, getOriginalFilename } from "@/lib/mime.ts";
import {
    Loader2,
    ChevronLeft,
    ChevronRight,
    CalendarClock,
} from "lucide-react";
import { ContentItemCard } from "@/components/shared/ContentItemCard.tsx";
import { usePageTitle } from "@/hooks/use-page-title.ts";
import { Button } from "@/components/ui/button.tsx";
import type { ContentItem } from "@/lib/types.ts";
import {Hero} from "@/components/shared/Hero.tsx";

const NOW = Date.now();

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function ExpirationCalendar() {
    usePageTitle("Expiration Calendar");

    const [content, setContent] = useState<ContentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null); // "YYYY-MM-DD"
    const [viewYear, setViewYear] = useState(new Date().getFullYear());
    const [viewMonth, setViewMonth] = useState(new Date().getMonth());

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
                setContent(data.filter(item => item.expiration));
                setLoading(false);
            } catch {
                setError("Failed to load content.");
                setLoading(false);
            }
        };
        void load();
    }, [user, getAccessTokenSilently]);

    // Map from "YYYY-MM-DD" -> ContentItem[]
    const itemsByDate = useMemo(() => {
        const map: Record<string, ContentItem[]> = {};
        content.forEach(item => {
            if (!item.expiration) return;
            const d = new Date(item.expiration);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            if (!map[key]) map[key] = [];
            map[key].push(item);
        });
        return map;
    }, [content]);

    // Build the grid of days for current view month
    const calendarDays = useMemo(() => {
        const firstDay = new Date(viewYear, viewMonth, 1).getDay();
        const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
        const days: (number | null)[] = [];
        for (let i = 0; i < firstDay; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(i);
        // Pad to complete last week
        while (days.length % 7 !== 0) days.push(null);
        return days;
    }, [viewYear, viewMonth]);

    function toKey(day: number) {
        return `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }

    function daysUntil(expiration: string): number {
        return Math.ceil((new Date(expiration).getTime() - NOW) / (1000 * 60 * 60 * 24));
    }

    function urgencyColor(days: number): string {
        if (days <= 0) return "bg-destructive/30 text-destructive";
        if (days <= 7) return "bg-amber-500/25 text-amber-700 dark:text-amber-400";
        return "bg-green-500/20 text-green-700 dark:text-green-400";
    }

    function prevMonth() {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
    }

    function nextMonth() {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
    }

    const todayKey = (() => {
        const t = new Date();
        return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
    })();

    const selectedItems = selectedDate ? (itemsByDate[selectedDate] ?? []) : [];

    if (!user) return (
        <div className="flex items-center justify-center min-h-screen bg-secondary">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
    );

    return (
        <>
            <Hero
                icon={CalendarClock}
                title="Expiration Calendar"
                description="See what content items are expiring soon."
                infoContent="The calendar view shows upcoming expirations for content. Click on any date to see expiring content on that day."
            />

            <div className="max-w-7xl mx-auto my-6 px-4 relative" >
                {loading && (
                    <div className="flex items-center justify-center py-24 gap-3 text-muted-foreground">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <p>Loading...</p>
                    </div>
                )}
                {error && <p className="text-destructive text-center py-8">{error}</p>}

                {!loading && !error && (
                    <div className="rounded-xl border shadow-lg overflow-hidden bg-background">

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/20">
                            <h2 className="text-xl font-semibold text-foreground">
                                {MONTHS[viewMonth]} {viewYear}
                            </h2>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="icon" onClick={prevMonth} className="h-8 w-8">
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => {
                                    const t = new Date();
                                    setViewMonth(t.getMonth());
                                    setViewYear(t.getFullYear());
                                    setSelectedDate(todayKey);
                                }}>
                                    Today
                                </Button>
                                <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8">
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Day labels */}
                        <div className="grid grid-cols-7 border-b bg-muted/10">
                            {DAYS.map(d => (
                                <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    {d}
                                </div>
                            ))}
                        </div>

                        {/* Calendar grid */}
                        <div className="grid grid-cols-7" style={{ minHeight: "520px" }}>
                            {calendarDays.map((day, i) => {
                                if (day === null) return (
                                    <div key={`empty-${i}`} className="border-r border-b bg-muted/5 min-h-[120px]" />
                                );

                                const key = toKey(day);
                                const items = itemsByDate[key] ?? [];
                                const isToday = key === todayKey;
                                const isSelected = key === selectedDate;

                                return (
                                    <div
                                        key={key}
                                        onClick={() => setSelectedDate(prev => prev === key ? null : key)}
                                        className={`border-r border-b min-h-[120px] p-1.5 cursor-pointer transition-colors flex flex-col gap-1
                                            ${isSelected ? "bg-accent/10 ring-1 ring-inset ring-accent" : "hover:bg-muted/30"}
                                        `}
                                    >
                                        {/* Day number */}
                                        <div className="flex justify-end">
                                            <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                                                ${isToday ? "bg-accent text-primary-foreground" : "text-foreground"}
                                            `}>
                                                {day}
                                            </span>
                                        </div>

                                        {/* Event chips — show up to 3, then "+N more" */}
                                        <div className="flex flex-col gap-0.5 flex-1">
                                            {items.slice(0, 3).map(item => {
                                                const days = daysUntil(item.expiration!);
                                                const originalFilename = item.fileURI ? getOriginalFilename(item.fileURI) : null;
                                                const category = getCategory(null, originalFilename);
                                                return (
                                                    <div
                                                        key={item.id}
                                                        className={`flex items-center gap-1 rounded px-1 py-0.5 text-xs truncate ${urgencyColor(days)}`}
                                                        title={item.displayName}
                                                    >
                                                        <ContentIcon category={category} isLink={!!item.linkURL} className="w-3 h-3 shrink-0" />
                                                        <span className="truncate">{item.displayName}</span>
                                                    </div>
                                                );
                                            })}
                                            {items.length > 3 && (
                                                <div className="text-xs text-muted-foreground px-1">
                                                    +{items.length - 3} more
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Selected date detail panel */}
                        {selectedDate && (
                            <div className="border-t bg-muted/10 px-6 py-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold text-foreground">
                                        {new Date(selectedDate + "T00:00:00").toLocaleDateString(undefined, {
                                            weekday: "long", year: "numeric", month: "long", day: "numeric"
                                        })}
                                    </h3>
                                    <button
                                        onClick={() => setSelectedDate(null)}
                                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                                {selectedItems.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No items expiring on this day.</p>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        {selectedItems.map(item => (
                                            <ContentItemCard
                                                key={item.id}
                                                item={item}
                                                subtitle={new Date(item.expiration!).toLocaleString()}
                                                actions={<ExpirationBadge expiration={item.expiration} />}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

export default ExpirationCalendar;