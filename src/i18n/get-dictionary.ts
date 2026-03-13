import { cache } from "react";
import { DEFAULT_LOCALE, normalizeLocale, type Locale } from "@/i18n/config";
import type { UiDictionary } from "@/i18n/dictionaries/types";

const dictionaryLoaders: Record<Locale, () => Promise<UiDictionary>> = {
  en: () => import("@/i18n/dictionaries/en").then((mod) => mod.dictionary),
  it: () => import("@/i18n/dictionaries/it").then((mod) => mod.dictionary),
  de: () => import("@/i18n/dictionaries/de").then((mod) => mod.dictionary),
};

export const getDictionary = cache(async (locale: Locale): Promise<UiDictionary> => {
  const safeLocale = normalizeLocale(locale);
  const loader = dictionaryLoaders[safeLocale] ?? dictionaryLoaders[DEFAULT_LOCALE];
  return loader();
});
