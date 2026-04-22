import { Badge } from "@/components/ui/badge.tsx";
import type { TranslationKey } from "@/languageSupport/keys.ts";
import { useLocale } from "@/languageSupport/localeContext.tsx";
import { useTranslation } from "@/languageSupport/useTranslation.ts";
import type { ContentType } from "@/lib/types.ts";

const TYPE_STYLES: Record<ContentType, { className: string }> = {
    reference: { className: "bg-labellight1a text-labeltext" },
    workflow:  { className: "bg-labellight2a text-labeltext" },
};

export function ContentTypeBadge({ contentType }: { contentType: string | null }) {
    const { locale } = useLocale();
    const { ts } = useTranslation(locale);

    if (!contentType) return null;
    const style = TYPE_STYLES[contentType as ContentType];
    if (!style) return null;
    return (
        <Badge className={`rounded-sm text-xs ${style.className}`}>
            {ts(`kind.${contentType}` as TranslationKey)}
        </Badge>
    );
}
