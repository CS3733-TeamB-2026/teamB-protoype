import { Badge } from "@/components/ui/badge.tsx";

type ContentType = "reference" | "workflow";

const TYPE_STYLES: Record<ContentType, { label: string; className: string }> = {
    reference: { label: "Reference", className: "bg-labellight1a text-labeltext" },
    workflow:  { label: "Workflow",  className: "bg-labellight2a text-labeltext" },
};

export function ContentTypeBadge({ contentType }: { contentType: string | null }) {
    if (!contentType) return null;
    const style = TYPE_STYLES[contentType as ContentType];
    if (!style) return null;
    return (
        <Badge className={`rounded-sm text-xs ${style.className}`}>
            {style.label}
        </Badge>
    );
}
