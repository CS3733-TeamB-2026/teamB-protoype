import { Badge } from "@/components/ui/badge";
import type { Persona } from "@/lib/types.ts";

const PERSONA_STYLES: Record<Persona, { label: string; className: string }> = {
    underwriter:     { label: "Underwriter",           className: "bg-labellight1a text-labeltext"  },
    businessAnalyst: { label: "Business Analyst",      className: "bg-labellight2a text-labeltext"  },
    actuarialAnalyst:{ label: "Actuarial Analyst",    className: "bg-labellight2a text-labeltext"  },
    excelOperator:   { label: "Excel Operator",         className: "bg-labellight2a text-labeltext"  },
    businessOps:     { label: "Business Ops",          className: "bg-labellight2a text-labeltext"  },
    admin:           { label: "Admin",                 className: "bg-labellight4a text-labeltext"  },
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
