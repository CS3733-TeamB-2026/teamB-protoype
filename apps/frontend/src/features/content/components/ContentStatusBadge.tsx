import { Badge } from "@/components/ui/badge.tsx";
import {useLocale} from "@/languageSupport/localeContext.tsx";
import {useTranslation} from "@/languageSupport/useTranslation.ts";
import type {TranslationKey} from "@/languageSupport/keys.ts";

type Status = "new" | "inProgress" | "complete";

const STATUS_STYLES: Record<Status, { label: string; className: string }> = {
    new:        { label: "new",         className: "bg-labellight2a text-labeltext" },
    inProgress: { label: "inProgress", className: "bg-labellight1a text-labeltext" },
    complete:   { label: "complete",    className: "bg-labellight4a  text-labeltext" },
};

export function ContentStatusBadge({ status }: { status: string | null }) {
    const { locale } = useLocale();
    const { ts } = useTranslation(locale);

    if (!status) return null;
    const style = STATUS_STYLES[status as Status];
    if (!style) return null;
    return (
        <Badge className={`rounded-sm text-xs ${style.className}`}>
            {ts(`status.${style.label}` as TranslationKey)}
        </Badge>
    );
}
