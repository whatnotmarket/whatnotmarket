
/**
 * Unified logic for handling post-login redirects and navigation paths.
 * Ensures all redirects are safe, internal, and normalized.
 */
export function getRedirectPath(
  searchParamsOrPath: URLSearchParams | Record<string, string | undefined> | string | null | undefined,
  defaultPath: string = "/market"
): string {
  let rawNext: string | null = null;

  if (typeof searchParamsOrPath === "string") {
    rawNext = searchParamsOrPath;
  } else if (searchParamsOrPath instanceof URLSearchParams) {
    rawNext = searchParamsOrPath.get("next") || searchParamsOrPath.get("callbackUrl") || searchParamsOrPath.get("returnTo");
  } else if (typeof searchParamsOrPath === "object" && searchParamsOrPath !== null) {
    rawNext = searchParamsOrPath.next || searchParamsOrPath.callbackUrl || searchParamsOrPath.returnTo || null;
  }

  const next = String(rawNext || "").trim();

  // 1. Must be relative (start with /)
  // 2. Must not be protocol-relative (start with //) which allows open redirects
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return defaultPath;
  }

  // 3. Prevent redirect loops to auth routes
  const forbiddenPrefixes = ["/auth", "/api/auth"];
  if (forbiddenPrefixes.some((prefix) => next === prefix || next.startsWith(`${prefix}/`))) {
    return defaultPath;
  }

  return next;
}
