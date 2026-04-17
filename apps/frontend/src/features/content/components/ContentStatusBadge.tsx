import { Badge } from "@/components/ui/badge.tsx";

type Status = "new" | "inProgress" | "complete";

const STATUS_STYLES: Record<Status, { label: string; className: string }> = {
    new:        { label: "New",         className: "bg-labellight2a text-labeltext" },
    inProgress: { label: "In Progress", className: "bg-labellight1a text-labeltext" },
    complete:   { label: "Complete",    className: "bg-labellight4a  text-labeltext" },
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
