import { ts } from './translation';
import type {TranslationKey} from "@/languageSupport/keys.ts";

export const useTranslation = (locale: string) => ({
    ts: (key: TranslationKey) => ts(key, locale),
});