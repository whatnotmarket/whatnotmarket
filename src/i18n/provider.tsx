"use client";

import type { Locale } from "@/i18n/config";
import type { UiDictionary } from "@/i18n/dictionaries/types";
import { createContext,useContext } from "react";

type I18nContextValue = {
  locale: Locale;
  dictionary: UiDictionary;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  value,
  children,
}: {
  value: I18nContextValue;
  children: React.ReactNode;
}) {
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider");
  }
  return context;
}
