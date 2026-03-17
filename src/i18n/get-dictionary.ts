import { cache } from "react";
import { DEFAULT_LOCALE, normalizeLocale, type Locale } from "@/i18n/config";
import type { UiDictionary } from "@/i18n/dictionaries/types";

const dictionaryLoaders: Record<Locale, () => Promise<UiDictionary>> = {
  en: () => import("@/i18n/dictionaries/en").then((mod) => mod.dictionary),
  it: () => import("@/i18n/dictionaries/it").then((mod) => mod.dictionary),
  de: () => import("@/i18n/dictionaries/de").then((mod) => mod.dictionary),
  es: () => import("@/i18n/dictionaries/es").then((mod) => mod.dictionary),
  pl: () => import("@/i18n/dictionaries/pl").then((mod) => mod.dictionary),
  ru: () => import("@/i18n/dictionaries/ru").then((mod) => mod.dictionary),
  uk: () => import("@/i18n/dictionaries/uk").then((mod) => mod.dictionary),
  tr: () => import("@/i18n/dictionaries/tr").then((mod) => mod.dictionary),
  ro: () => import("@/i18n/dictionaries/ro").then((mod) => mod.dictionary),
  "pt-br": () => import("@/i18n/dictionaries/pt-br").then((mod) => mod.dictionary),
};

export const getDictionary = cache(async (locale: Locale): Promise<UiDictionary> => {
  const safeLocale = normalizeLocale(locale);
  const loader = dictionaryLoaders[safeLocale] ?? dictionaryLoaders[DEFAULT_LOCALE];
  return loader();
});
