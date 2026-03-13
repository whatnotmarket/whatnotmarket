import type { Locale } from "@/i18n/config";

export type UiDictionary = {
  common: {
    language: string;
    switchLanguage: string;
  };
  languages: Record<Locale, string>;
  home: {
    eyebrow: string;
    title: string;
    description: string;
    ctaPrimary: string;
    ctaSecondary: string;
    note: string;
  };
  market: {
    title: string;
    description: string;
  };
  metadata: {
    homeTitle: string;
    homeDescription: string;
    marketTitle: string;
    marketDescription: string;
  };
  dynamic: {
    marketSummarySource: string;
    marketSummary: Record<Exclude<Locale, "en">, string>;
  };
};
