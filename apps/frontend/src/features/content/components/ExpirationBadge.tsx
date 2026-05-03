import { Badge } from "@/components/ui/badge.tsx";

function daysUntil(expiration: string): number {
    return Math.ceil((new Date(expiration).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function urgencyClass(days: number): string {
    if (days <= 0) return "bg-destructive/20 text-destructive hover:bg-destructive/20";
    if (days <= 7) return "bg-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20";
    return "bg-green-500/20 text-green-700 dark:text-green-400 hover:bg-green-500/20";
}

function urgencyLabel(days: number): string {
    if (days < 0) return `Expired ${Math.abs(days)}d ago`;
    if (days === 0) return "Today";
    return `${days}d left`;
}

/** Badge showing expiration urgency or a muted "No expiration" chip when null. */
export function ExpirationBadge({ expiration }: { expiration: string | null }) {
    if (!expiration) {
        return (
            <Badge className="rounded-full text-xs bg-muted text-muted-foreground hover:bg-muted border border-border">
                No expiration
            </Badge>
        );
    }

    const days = daysUntil(expiration);
    return (
        <Badge className={`rounded-full text-xs ${urgencyClass(days)}`}>
            {urgencyLabel(days)}
        </Badge>
    );
}
