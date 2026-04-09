import { Badge } from "@/components/ui/badge";

type ContentType = "reference" | "workflow";

const TYPE_STYLES: Record<ContentType, { label: string; className: string }> = {
    reference: { label: "Reference", className: "bg-violet-100 text-violet-700" },
    workflow:  { label: "Workflow",  className: "bg-orange-100 text-orange-700" },
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
