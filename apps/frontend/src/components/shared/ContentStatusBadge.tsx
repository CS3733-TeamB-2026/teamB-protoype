import { Badge } from "@/components/ui/badge";

type Status = "new" | "inProgress" | "complete";

const STATUS_STYLES: Record<Status, { label: string; className: string }> = {
    new:        { label: "New",         className: "bg-sky-100 text-sky-700" },
    inProgress: { label: "In Progress", className: "bg-amber-100 text-amber-700" },
    complete:   { label: "Complete",    className: "bg-green-100 text-green-700" },
};

export function ContentStatusBadge({ status }: { status: string | null }) {
    if (!status) return null;
    const style = STATUS_STYLES[status as Status];
    if (!style) return null;
    return (
        <Badge className={`rounded-sm text-xs ${style.className}`}>
            {style.label}
        </Badge>
    );
}
