import { Badge } from "@/components/ui/badge.tsx";

function daysUntil(expiration: string): number {
    return Math.ceil((new Date(expiration).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

type ColorMode = "status" | "blue";

function urgencyClass(days: number, colorMode: ColorMode): string {
    if (colorMode === "blue") {
        if (days <= 0) return "bg-destructive/10 text-destructive";
        if (days <= 7) return "bg-accent/80 text-primary-foreground";
        return "bg-primary/90 text-primary-foreground";
    }
    if (days <= 0) return "bg-destructive/20 text-destructive hover:bg-destructive/20";
    if (days <= 7) return "bg-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20";
    return "bg-green-500/20 text-green-700 dark:text-green-400 hover:bg-green-500/20";
}

function urgencyLabel(days: number): string {
    if (days < 0) return `${Math.abs(days)}d ago`;
    if (days === 0) return "Today";
    return `${days}d left`;
}

/** Badge showing expiration urgency or a muted "No expiration" chip when null. */
export function ExpirationBadge({
    expiration,
    colorMode = "status",
}: {
    expiration: string | null;
    colorMode?: ColorMode;
}) {
    if (!expiration) {
        return (
            <Badge className="rounded-full text-xs bg-muted text-muted-foreground hover:bg-muted/70 border border-border">
                No exp.
            </Badge>
        );
    }

    const days = daysUntil(expiration);
    return (
        <Badge className={`rounded-full text-xs ${urgencyClass(days, colorMode)}`}>
            {urgencyLabel(days)}
        </Badge>
    );
}
