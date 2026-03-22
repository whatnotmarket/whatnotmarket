import { SUPPORTED_LOCALES,type Locale } from "@/i18n/config";
import { SITE_URL } from "@/lib/core/config/site-config";
import type { Metadata } from "next";

const OPEN_GRAPH_LOCALE_BY_LANG: Record<Locale, string> = {
  en: "en_US",
  it: "it_IT",
  de: "de_DE",
  es: "es_ES",
  pl: "pl_PL",
  ru: "ru_RU",
  uk: "uk_UA",
  tr: "tr_TR",
  ro: "ro_RO",
  "pt-br": "pt_BR",
};

export function localizedPath(locale: Locale, pathname: string): string {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (normalized === "/") return `/${locale}`;
  return `/${locale}${normalized}`;
}

export function buildHreflang(pathname: string): Record<string, string> {
  const languages = Object.fromEntries(
    SUPPORTED_LOCALES.map((locale) => [locale, `${SITE_URL}${localizedPath(locale, pathname)}`])
  );
  return {
    ...languages,
    "x-default": `${SITE_URL}${localizedPath("en", pathname)}`,
  };
}

export function buildLocalizedMetadata(input: {
  locale: Locale;
  pathname: string;
  title: string;
  description: string;
}): Metadata {
  const canonical = `${SITE_URL}${localizedPath(input.locale, input.pathname)}`;
  const languages = buildHreflang(input.pathname);

  return {
    title: input.title,
    description: input.description,
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      title: input.title,
      description: input.description,
      url: canonical,
      siteName: "OpenlyMarket",
      locale: OPEN_GRAPH_LOCALE_BY_LANG[input.locale],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
    },
  };
}

