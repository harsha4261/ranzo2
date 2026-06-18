import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import { create } from 'zustand';
import { KEY_LANGUAGE, loadJSON, saveJSON } from '@/data/storage';
import { loadLanguagePreference, saveLanguagePreference } from '@/storage/languagePreference';
import { en } from '@/core/i18n/locales/en';
import { hi } from '@/core/i18n/locales/hi';
import { te } from '@/core/i18n/locales/te';

const SUPPORTED_LOCALES = ['en', 'hi', 'te'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

function normalizeLocale(tag: string): SupportedLocale {
  const base = tag.split(/[-_]/)[0]?.toLowerCase() ?? 'en';
  if (base === 'hi') return 'hi';
  if (base === 'te') return 'te';
  return 'en';
}

function isSupportedLocale(code: string): code is SupportedLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(code);
}

export const i18n = new I18n({ en, hi, te });

i18n.enableFallback = true;
i18n.defaultLocale = 'en';

type I18nState = {
  locale: string;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setLocale: (locale: string) => Promise<void>;
};

export const useI18nStore = create<I18nState>((set) => ({
  locale: 'en',
  hydrated: false,
  hydrate: async () => {
    const fromMmkv = await loadLanguagePreference();
    const saved = await loadJSON<string>(KEY_LANGUAGE);
    const raw = fromMmkv ?? saved;
    const device = Localization.getLocales()[0]?.languageTag ?? 'en';
    const next: SupportedLocale =
      raw && isSupportedLocale(raw) ? raw : normalizeLocale(device);
    if (raw && !isSupportedLocale(raw)) {
      await saveLanguagePreference(next);
      await saveJSON(KEY_LANGUAGE, next);
    }
    i18n.locale = next;
    set({ locale: next, hydrated: true });
  },
  setLocale: async (locale) => {
    const next = isSupportedLocale(locale) ? locale : normalizeLocale(locale);
    i18n.locale = next;
    set({ locale: next });
    await saveLanguagePreference(next);
    await saveJSON(KEY_LANGUAGE, next);
  },
}));

export function t(key: string, options?: Record<string, unknown>) {
  return i18n.t(key, options);
}

/** Subscribe to locale changes so screens re-render with new language. */
export function useTranslation() {
  const locale = useI18nStore((s) => s.locale);
  return {
    locale,
    t: (key: string, options?: Record<string, unknown>) => i18n.t(key, options),
  };
}
