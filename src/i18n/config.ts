export const SUPPORTED_LOCALES = ["en", "it", "de", "es", "pl", "ru", "uk", "tr", "ro", "pt-br"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE_NAME = "om_locale";

export const NON_LOCALIZED_PATH_PREFIXES = ["/inbox", "/global-chat"] as const;
export const LOCALIZED_EXACT_PATHS = ["/", "/market"] as const;

const localizedPathSet = new Set<string>(LOCALIZED_EXACT_PATHS);

export function isSupportedLocale(value: string | null | undefined): value is Locale {
  if (!value) return false;
  return SUPPORTED_LOCALES.includes(value as Locale);
}

export function normalizeLocale(value: string | null | undefined): Locale {
  if (!value) return DEFAULT_LOCALE;
  const lower = value.toLowerCase().trim();
  if (isSupportedLocale(lower)) return lower;
  const base = lower.split("-")[0];
  return isSupportedLocale(base) ? base : DEFAULT_LOCALE;
}

export function stripLocaleFromPathname(pathname: string): {
  locale: Locale | null;
  pathname: string;
} {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const [, maybeLocale, ...rest] = normalizedPath.split("/");
  if (isSupportedLocale(maybeLocale)) {
    const basePath = `/${rest.join("/")}`.replace(/\/+$/, "") || "/";
    return { locale: maybeLocale, pathname: basePath };
  }
  return { locale: null, pathname: normalizedPath.replace(/\/+$/, "") || "/" };
}

export function isPathNonLocalized(pathname: string): boolean {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return NON_LOCALIZED_PATH_PREFIXES.some(
    (prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`)
  );
}

export function shouldLocalizePath(pathname: string): boolean {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (isPathNonLocalized(normalizedPath)) return false;
  return localizedPathSet.has(normalizedPath);
}

export function withLocale(pathname: string, locale: Locale): string {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (normalizedPath === "/") return `/${locale}`;
  return `/${locale}${normalizedPath}`;
}

function parseAcceptLanguageHeader(headerValue: string | null | undefined): string[] {
  if (!headerValue) return [];
  return headerValue
    .split(",")
    .map((entry) => entry.split(";")[0]?.trim().toLowerCase())
    .filter(Boolean);
}

export function detectPreferredLocale(input: {
  cookieLocale?: string | null;
  acceptLanguage?: string | null;
}): Locale {
  if (input.cookieLocale) {
    const cookieLocale = input.cookieLocale.toLowerCase().trim();
    if (isSupportedLocale(cookieLocale)) return cookieLocale;
    const baseCookieLocale = cookieLocale.split("-")[0];
    if (isSupportedLocale(baseCookieLocale)) return baseCookieLocale;
  }

  const accepted = parseAcceptLanguageHeader(input.acceptLanguage);
  for (const candidate of accepted) {
    if (isSupportedLocale(candidate)) return candidate;
    const base = candidate.split("-")[0];
    if (isSupportedLocale(base)) return base;
  }

  return DEFAULT_LOCALE;
}
