import {en_us, sp_sp} from './dictionaries.ts';
import type { TranslationKey } from './keys';

type Dictionary = Partial<Record<TranslationKey, string>>;

const dictionaries: Record<string, Dictionary> = {
    en_us,
    sp_sp,
};

//default to english
export const ts = (key: TranslationKey, locale: string = 'en_us'): string => {
    const dict = dictionaries[locale] ?? {};
    return dict[key] ?? en_us[key] ?? key;
};