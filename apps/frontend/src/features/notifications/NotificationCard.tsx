import { Card, CardContent } from "@/components/ui/card.tsx";
import { FileText, UserRoundCog, Clock, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils.ts";
import type { NotificationItem } from "@/lib/types.ts";

type Props = {
    notification: NotificationItem;
    compact?: boolean;
    onSelect?: () => void;
};

function formatTriggeredBy(t: NotificationItem["triggeredBy"]): string {
    return t ? `${t.firstName} ${t.lastName}` : "Someone";
}

function renderNotification(n: NotificationItem): string {
    if (n.type === "change") {
        const fields = n.metadata.changedFields?.join(", ") ?? "details";
        return `${formatTriggeredBy(n.triggeredBy)} updated ${n.contentName} (${fields})`;
    }
    if (n.type === "ownership") {
        return `${formatTriggeredBy(n.triggeredBy)} changed the owner of ${n.contentName}`;
    }
    if (n.metadata.expired) {
        return `${n.contentName} has expired`;
    }
    return `${n.contentName} expires in ${n.metadata.daysLeft} day(s)`;
}

function renderIcon(n: NotificationItem, size: string) {
    if (n.type === "change") return <FileText className={cn(size, "text-primary")} />;
    if (n.type === "ownership") return <UserRoundCog className={cn(size, "text-primary")} />;
    if (n.metadata.expired) return <AlertTriangle className={cn(size, "text-destructive")} />;
    return <Clock className={cn(size, "text-accent")} />;
}

export function NotificationCard({ notification, compact = false, onSelect }: Props) {
    const inner = (
        <CardContent className={cn("flex items-start gap-3", compact ? "p-3" : "p-4")}>
            <div className="mt-0.5 shrink-0">
                {renderIcon(notification, compact ? "h-4 w-4" : "h-5 w-5")}
            </div>
            <div className="flex-1 min-w-0">
                <p className={cn(compact ? "text-xs truncate" : "text-sm")}>
                    {renderNotification(notification)}
                </p>
                <p className={cn("text-muted-foreground mt-1", compact ? "text-[10px]" : "text-xs")}>
                    {new Date(notification.createdAt).toLocaleString()}
                </p>
            </div>
        </CardContent>
    );

    if (compact) {
        return (
            <Link
                to={`/file/${notification.contentId}`}
                onClick={onSelect}
                className="block hover:bg-secondary rounded-md transition-colors"
            >
                <Card className="border-none shadow-none bg-transparent">
                    {inner}
                </Card>
            </Link>
        );
    }

    return <Card>{inner}</Card>;
}