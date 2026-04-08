import { type Category, CATEGORY_COLORS } from "@/helpers/mime.ts";
import { Badge } from "@/components/ui/badge.tsx";

export function ContentExtBadge({
    category,
    ext,
    isLink,
}: {
    category: Category;
    ext: string | null;
    isLink: boolean;
}) {
    const colors = CATEGORY_COLORS[isLink ? "link" : category];
    const label = isLink ? "Link" : (ext ?? "unknown").toUpperCase();
    return <Badge className={`text-xs ${colors.badge}`}>{label}</Badge>;
}
