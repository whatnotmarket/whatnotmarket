"use client";

import { useMemo, useState, useTransition } from "react";
import type { ElementType } from "react";
import * as Flags from "country-flag-icons/react/3x2";
import { ChevronDown } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { NavPopup } from "./NavPopup";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
  SUPPORTED_LOCALES,
  isPathNonLocalized,
  normalizeLocale,
  shouldLocalizePath,
  stripLocaleFromPathname,
  withLocale,
  type Locale,
} from "@/i18n/config";

const LANGUAGE_META: Record<
  Locale,
  { label: string; nativeLabel: string; Flag: ElementType }
> = {
  en: { label: "English", nativeLabel: "English", Flag: Flags.US },
  it: { label: "Italian", nativeLabel: "Italiano", Flag: Flags.IT },
  de: { label: "German", nativeLabel: "Deutsch", Flag: Flags.DE },
  es: { label: "Spanish", nativeLabel: "Español", Flag: Flags.ES },
  pl: { label: "Polish", nativeLabel: "Polski", Flag: Flags.PL },
  ru: { label: "Russian", nativeLabel: "Русский", Flag: Flags.RU },
  uk: { label: "Ukrainian", nativeLabel: "Українська", Flag: Flags.UA },
  tr: { label: "Turkish", nativeLabel: "Türkçe", Flag: Flags.TR },
  ro: { label: "Romanian", nativeLabel: "Română", Flag: Flags.RO },
  "pt-br": { label: "Portuguese (Brazil)", nativeLabel: "Português (Brasil)", Flag: Flags.BR },
};

function setLocaleCookie(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}

export function LanguageSelector() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const { locale: localeInPath, pathname: basePath } = useMemo(
    () => stripLocaleFromPathname(pathname || "/"),
    [pathname]
  );

  const activeLocale = normalizeLocale(localeInPath ?? DEFAULT_LOCALE);
  const activeLanguage = LANGUAGE_META[activeLocale];

  const onSelectLocale = (nextLocale: Locale) => {
    if (nextLocale === activeLocale && !isPathNonLocalized(basePath)) {
      setIsOpen(false);
      return;
    }

    setLocaleCookie(nextLocale);

    if (isPathNonLocalized(basePath)) {
      setIsOpen(false);
      return;
    }

    const targetPath = shouldLocalizePath(basePath) ? withLocale(basePath, nextLocale) : withLocale("/", nextLocale);

    startTransition(() => {
      router.replace(targetPath);
      router.refresh();
    });

    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Switch language"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex cursor-pointer items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold text-zinc-300 transition-all hover:bg-white/5 hover:text-white"
      >
        <activeLanguage.Flag className="h-5 w-5 rounded-[2px]" />
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-zinc-500 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      <NavPopup
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        align="center"
        className="w-[260px]"
        title="Language"
      >
        <div className="rounded-[16px] bg-[#1C1C1E] p-2">
          <div className="space-y-1">
            {SUPPORTED_LOCALES.map((locale) => {
              const entry = LANGUAGE_META[locale];
              const isActive = locale === activeLocale;
              return (
                <button
                  type="button"
                  key={locale}
                  onClick={() => onSelectLocale(locale)}
                  disabled={isPending}
                  className={cn(
                    "group flex h-[46px] w-full items-center justify-between rounded-lg px-3 transition-all",
                    isActive ? "bg-white/8 text-white" : "text-zinc-300 hover:bg-white/5 hover:text-white",
                    isPending && "cursor-wait opacity-80"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <entry.Flag className="h-5 w-5 rounded-[2px]" />
                    <span className="text-[15px] font-medium">{entry.nativeLabel}</span>
                  </div>
                  <div
                    className={cn(
                      "h-2.5 w-2.5 rounded-full transition-all",
                      isActive ? "bg-white" : "bg-zinc-600 group-hover:bg-zinc-400"
                    )}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </NavPopup>
    </div>
  );
}
