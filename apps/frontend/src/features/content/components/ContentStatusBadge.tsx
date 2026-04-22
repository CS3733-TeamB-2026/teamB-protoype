import { Badge } from "@/components/ui/badge.tsx";
import { useLocale } from "@/languageSupport/localeContext.tsx";
import { useTranslation } from "@/languageSupport/useTranslation.ts";
import type { TranslationKey } from "@/languageSupport/keys.ts";
import type { ContentStatus } from "@/lib/types.ts";

const STATUS_STYLES: Record<ContentStatus, { className: string }> = {
    new:        { className: "bg-labellight2a text-labeltext" },
    inProgress: { className: "bg-labellight1a text-labeltext" },
    complete:   { className: "bg-labellight4a  text-labeltext" },
};

export function ContentStatusBadge({ status }: { status: string | null }) {
    const { locale } = useLocale();
    const { ts } = useTranslation(locale);

    if (!status) return null;
    const style = STATUS_STYLES[status as ContentStatus];
    if (!style) return null;
    return (
        <Badge className={`rounded-sm text-xs ${style.className}`}>
            {ts(`status.${status}` as TranslationKey)}
        </Badge>
    );
}
