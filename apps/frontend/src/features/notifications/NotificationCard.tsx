import { Card, CardContent } from "@/components/ui/card.tsx";
import { FileText, UserRoundCog, Clock, AlertTriangle, X } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils.ts";
import type { NotificationItem } from "@/lib/types.ts";

type Props = {
    notification: NotificationItem;
    compact?: boolean;
    index?: number;
    onSelect?: () => void;
    onDismiss?: (id: string) => void;
};

/**
 * Formats the name of the user who triggered a notification.
 * Falls back to "Someone" if the user information is not available.
 *
 * @param t The user object containing firstName and lastName, or null.
 * @returns A formatted string representing the user's name.
 */
function formatTriggeredBy(t: NotificationItem["triggeredBy"]): string {
    return t ? `${t.firstName} ${t.lastName}` : "Someone";
}

// Maps internal database field names to human-readable labels for display
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

/**
 * Converts a list of raw field names into a human-readable, comma-separated string.
 * Uses `FIELD_LABELS` to map internal names to friendly labels.
 *
 * @param fields An array of string field names.
 * @returns A formatted string, or "details" if the array is empty or undefined.
 */
function humanizeFields(fields: string[] | undefined): string {
    if (!fields || fields.length === 0) return "details";
    return fields.map((f) => FIELD_LABELS[f] ?? f).join(", ");
}

/**
 * Determines the primary headline and secondary detail text for a notification based on its type and metadata.
 *
 * @param n The notification item to process.
 * @returns An object containing the generated `headline` and `detail` strings.
 */
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
        return { headline: `${n.contentName} has expired`, detail: null };
    }
    if (n.metadata.threshold === "1h") {
        return {
            headline: n.contentName,
            detail: `Expires in less than an hour`,
        };
    }
    return {
        headline: n.contentName,
        detail: `Expires in ${n.metadata.daysLeft} day${n.metadata.daysLeft === 1 ? "" : "s"}`,
    };
}

/**
 * Selects the appropriate icon component to display alongside the notification based on its type.
 *
 * @param n The notification item.
 * @returns A React Element representing the icon.
 */
function renderIcon(n: NotificationItem, size: string) {
    if (n.type === "change") return <FileText className={cn(size, "text-primary")} />;
    if (n.type === "ownership") return <UserRoundCog className={cn(size, "text-primary")} />;
    if (n.metadata.expired) return <AlertTriangle className={cn(size, "text-destructive")} />;
    return <Clock className={cn(size, "text-accent")} />;
}

/**
 * Formats an ISO timestamp into a user-friendly string.
 * Shows only the time if it's today, the short weekday if it's within the last 7 days,
 * and the short month and day for older dates.
 *
 * @param iso The ISO 8601 string representation of the date.
 * @returns A formatted date/time string.
 */
function formatTimestamp(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
        return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    }
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 0 && diffDays < 7) {
        return d.toLocaleDateString([], { weekday: "short" });
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

/**
 * A UI component that displays a single notification item.
 * It can render in two modes: a `compact` mode (used in popovers/dropdowns) and a full-size card mode.
 * The card is clickable and navigates the user to the associated content file.
 * It also provides a dismiss button if an `onDismiss` handler is provided.
 *
 * @param props.notification The notification data to display.
 * @param props.compact Whether to render the card in a compact, list-item style. Defaults to false.
 * @param props.onSelect An optional callback fired when the card is clicked.
 * @param props.onDismiss An optional callback fired when the dismiss button is clicked, receiving the notification ID.
 */
export function NotificationCard({ notification, compact = false, onSelect, onDismiss }: Props) {
    const { headline, detail } = renderNotification(notification);
    const timestamp = formatTimestamp(notification.createdAt);

    /**
     * Handles the click event for the dismiss button, preventing it from triggering the card's navigation link.
     */
    const handleDismiss = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onDismiss?.(notification.id);
    };

    if (compact) {
        return (
            <div className="relative">
                <Link
                    to={`/file/${notification.contentId}`}
                    onClick={onSelect}
                    className={cn(
                        "flex items-start gap-3 px-3 py-2.5 pr-8 rounded-md transition-colors cursor-pointer border",
                        "hover:bg-muted/80",
                    )}
                >
                    <div className="mt-0.5 shrink-0">
                        {renderIcon(notification, "h-4 w-4")}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm leading-snug truncate">{headline}</p>
                        {detail && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{detail}</p>
                        )}
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 mt-1">
                        {timestamp}
                    </span>
                </Link>
                {onDismiss && (
                    <button
                        onClick={handleDismiss}
                        className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Dismiss"
                    >
                        <X className="w-3 h-3" />
                    </button>
                )}
            </div>
        );
    }

    return (
        <Link
            to={`/file/${notification.contentId}`}
            onClick={onSelect}
            className="block"
        >
            <Card className="transition-colors hover:bg-muted/40 cursor-pointer relative">
                <CardContent className="flex items-center gap-3 p-3 pr-10">
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
                    {onDismiss && (
                        <button
                            onClick={handleDismiss}
                            className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            title="Dismiss"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </CardContent>
            </Card>
        </Link>
    );
}