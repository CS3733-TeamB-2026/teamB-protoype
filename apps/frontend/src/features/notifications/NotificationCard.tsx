import { Card, CardContent } from "@/components/ui/card.tsx";
import { FileText, UserRoundCog, Clock, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils.ts";
import type { NotificationItem } from "@/lib/types.ts";

type Props = {
    notification: NotificationItem;
    compact?: boolean;
    index?: number;
    onSelect?: () => void;
};

function formatTriggeredBy(t: NotificationItem["triggeredBy"]): string {
    return t ? `${t.firstName} ${t.lastName}` : "Someone";
}

const FIELD_LABELS: Record<string, string> = {
    displayName: "name",
    linkURL: "link",
    fileURI: "file",
    contentType: "type",
    status: "status",
    expiration: "expiration date",
    targetPersona: "target persona",
    tags: "tags",
};

function humanizeFields(fields: string[] | undefined): string {
    if (!fields || fields.length === 0) return "details";
    return fields.map((f) => FIELD_LABELS[f] ?? f).join(", ");
}

function renderNotification(n: NotificationItem): { headline: string; detail: string | null } {
    if (n.type === "change") {
        return {
            headline: `${formatTriggeredBy(n.triggeredBy)} edited ${n.contentName}`,
            detail: `Changed ${humanizeFields(n.metadata.changedFields)}`,
        };
    }
    if (n.type === "ownership") {
        const newOwner = n.metadata.newOwnerName;
        return {
            headline: `${formatTriggeredBy(n.triggeredBy)} changed ownership of ${n.contentName}`,
            detail: newOwner ? `New owner: ${newOwner}` : "Owner removed",
        };
    }
    if (n.metadata.expired) {
        return {
            headline: `${n.contentName} has expired`,
            detail: null,
        };
    }
    return {
        headline: n.contentName,
        detail: `Expires in ${n.metadata.daysLeft} day${n.metadata.daysLeft === 1 ? "" : "s"}`,
    };
}

function renderIcon(n: NotificationItem, size: string) {
    if (n.type === "change") return <FileText className={cn(size, "text-primary")} />;
    if (n.type === "ownership") return <UserRoundCog className={cn(size, "text-primary")} />;
    if (n.metadata.expired) return <AlertTriangle className={cn(size, "text-destructive")} />;
    return <Clock className={cn(size, "text-accent")} />;
}

function formatTimestamp(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) {
        return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    }
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 0 && diffDays < 7) {
        return d.toLocaleDateString([], { weekday: "short" });
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function NotificationCard({ notification, compact = false, onSelect }: Props) {
    const { headline, detail } = renderNotification(notification);
    const timestamp = formatTimestamp(notification.createdAt);

    if (compact) {
        return (
            <Link
                to={`/file/${notification.contentId}`}
                onClick={onSelect}
                className={cn(
                    "flex items-start gap-3 px-3 py-2.5 rounded-md transition-colors cursor-pointer border",
                    "hover:bg-muted/80",
                )}
            >
                <div className="mt-0.5 shrink-0">
                    {renderIcon(notification, "h-4 w-4")}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug truncate">{headline}</p>
                    {detail && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {detail}
                        </p>
                    )}
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0 mt-1">
                    {timestamp}
                </span>
            </Link>
        );
    }

    return (
        <Link
            to={`/file/${notification.contentId}`}
            onClick={onSelect}
            className="block"
        >
            <Card className="transition-colors hover:bg-muted/40 cursor-pointer">
                <CardContent className="flex items-center gap-3 p-3">
                    <div className="shrink-0">
                        {renderIcon(notification, "h-5 w-5")}
                    </div>
                    <div className="flex-1 min-w-0 flex items-center gap-4">
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{headline}</p>
                            {detail && (
                                <p className="text-xs text-muted-foreground truncate">{detail}</p>
                            )}
                        </div>
                        <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                            {notification.type === "expiration" && notification.metadata.daysLeft !== undefined && !notification.metadata.expired && (
                                <span>
                                    <span className="font-medium text-foreground">Days left:</span>{" "}
                                    {notification.metadata.daysLeft}
                                </span>
                            )}
                        </div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                        {new Date(notification.createdAt).toLocaleString()}
                    </span>
                </CardContent>
            </Card>
        </Link>
    );
}