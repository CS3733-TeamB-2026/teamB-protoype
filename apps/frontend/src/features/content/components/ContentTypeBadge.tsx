import { Badge } from "@/components/ui/badge.tsx";
import type {TranslationKey} from "@/languageSupport/keys.ts";
import {useLocale} from "@/languageSupport/localeContext.tsx";
import {useTranslation} from "@/languageSupport/useTranslation.ts";

type ContentType = "reference" | "workflow";

const TYPE_STYLES: Record<ContentType, { label: string; className: string }> = {
    reference: { label: "reference", className: "bg-labellight1a text-labeltext" },
    workflow:  { label: "workflow",  className: "bg-labellight2a text-labeltext" },
};

export function ContentTypeBadge({ contentType }: { contentType: string | null }) {
    const { locale } = useLocale();
    const { ts } = useTranslation(locale);

    if (!contentType) return null;
    const style = TYPE_STYLES[contentType as ContentType];
    if (!style) return null;
    return (
        <Badge className={`rounded-sm text-xs ${style.className}`}>
            {ts(`kind.${style.label}`  as TranslationKey)}
        </Badge>
    );
}
