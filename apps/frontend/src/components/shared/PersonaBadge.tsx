import { Badge } from "@/components/ui/badge";

type Persona = "underwriter" | "businessAnalyst" | "admin";

const PERSONA_STYLES: Record<Persona, { label: string; className: string }> = {
    underwriter:     { label: "Underwriter",          className: "bg-sky-100 text-sky-700" },
    businessAnalyst: { label: "Business Analyst",     className: "bg-violet-100 text-violet-700" },
    admin:           { label: "Admin",                className: "bg-rose-100 text-rose-700" },
};

export function PersonaBadge({ persona }: { persona: string | null }) {
    if (!persona) return null;
    const style = PERSONA_STYLES[persona as Persona];
    if (!style) return null;
    return (
        <Badge className={`rounded-sm text-xs ${style.className}`}>
            {style.label}
        </Badge>
    );
}
