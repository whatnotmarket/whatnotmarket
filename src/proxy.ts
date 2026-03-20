import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { verifyToken } from "@/lib/auth";
import { getRedirectPath } from "@/lib/redirects";
import { hasCanonicalAdminAccess } from "@/lib/security/admin-guards";
import {
  MAINTENANCE_PATHNAME,
  createMaintenanceHeaders,
  isMaintenanceModeEnabled,
} from "@/lib/maintenance";
import {
  LOCALE_COOKIE_NAME,
  detectPreferredLocale,
  isSupportedLocale,
  isPathNonLocalized,
  shouldLocalizePath,
  stripLocaleFromPathname,
  withLocale,
} from "@/i18n/config";

const STATIC_FILE_PATTERN =
  /\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml|json|webmanifest|woff2?|ttf|eot)$/i;
const SOURCE_MAP_PATTERN = /\.map$/i;
const MAINTENANCE_ALLOWED_ASSET_PATTERN = /^\/_next\/static(?:\/|$)/i;
const MAINTENANCE_ALLOWED_PUBLIC_PATHS = new Set<string>([
  "/manifest.json",
  "/favicon.ico",
  "/maintenance/favicon.ico",
]);
const MAINTENANCE_ALLOWED_API_PATHS = new Set<string>([
  "/api/maintenance/early-access",
  "/api/maintenance/feedback",
]);
const ENCODED_SEPARATOR_OR_TRAVERSAL_PATTERN = /%(?:2f|5c|2e%2e|252f|255c|252e%252e)/i;
const DOT_SEGMENT_PATTERN = /(?:^|\/)\.\.?(?:\/|$)/;
const MAINTENANCE_SAFE_PAGE_METHODS = new Set(["GET", "HEAD"]);

const LOCAL_ONLY_EXACT_PATHS = new Set<string>([
  "/about",
  "/auth",
  "/become-escrow",
  "/become-seller",
  "/broker",
  "/business",
  "/buy-with-crypto",
  "/contact",
  "/copy-demo",
  "/dashboard",
  "/dev",
  "/disclaimer",
  "/escrow",
  "/faq",
  "/fee-calculator",
  "/grafici-dev",
  "/homepage",
  "/install",
  "/link",
  "/market",
  "/my-deals",
  "/notifications",
  "/notifichetest",
  "/open-dispute",
  "/open-source",
  "/privacy",
  "/profile",
  "/promote-listings",
  "/redeem",
  "/refund",
  "/requests",
  "/roadmap",
  "/secure-transaction",
  "/sell",
  "/sidebar-test",
  "/smart-search",
  "/terms",
  "/testlogin",
]);

const LOCAL_ONLY_PREFIXES = [
  "/buyer/",
  "/category/",
  "/deal/",
  "/deals/",
  "/inbox",
  "/listing/",
  "/profile/",
  "/requests/",
  "/seller/",
  "/track/",
  "/user/",
] as const;

const SENSITIVE_PROBE_EXACT_PATHS = new Set<string>([
  "/.env",
  "/.env.local",
  "/.git/HEAD",
  "/wp-admin",
  "/wp-login.php",
  "/phpmyadmin",
  "/server-status",
]);
const SENSITIVE_PROBE_PREFIXES = ["/.git/", "/backup/", "/private/"] as const;
const INTERNAL_SENSITIVE_ALERT_PATH = "/api/internal/security/sensitive-access-attempt";
const INTERNAL_SENSITIVE_ALERT_TIMEOUT_MS = 1500;

type SensitiveAccessAlert = {
  reason: string;
  blocked: boolean;
  metadata?: Record<string, unknown>;
};

function isLocalHostname(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function isLocalOnlyPath(pathname: string) {
  if (LOCAL_ONLY_EXACT_PATHS.has(pathname)) return true;
  return LOCAL_ONLY_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix));
}

function isFrameworkAssetPath(pathname: string) {
  if (!MAINTENANCE_ALLOWED_ASSET_PATTERN.test(pathname)) return false;
  if (ENCODED_SEPARATOR_OR_TRAVERSAL_PATTERN.test(pathname)) return false;
  if (DOT_SEGMENT_PATTERN.test(pathname)) return false;
  return true;
}

function getClientIp(request: NextRequest) {
  const directIp = request.headers.get("cf-connecting-ip")?.trim();
  if (directIp) return directIp;

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  return "unknown";
}

function isSensitiveProbePath(pathname: string) {
  if (SENSITIVE_PROBE_EXACT_PATHS.has(pathname)) return true;
  return SENSITIVE_PROBE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

async function reportSensitiveAccessAttempt(request: NextRequest, alert: SensitiveAccessAlert) {
  if (process.env.NODE_ENV !== "production") return;

  const token = process.env.INTERNAL_SECURITY_ALERT_TOKEN?.trim();
  if (!token) return;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), INTERNAL_SENSITIVE_ALERT_TIMEOUT_MS);

  try {
    const response = await fetch(new URL(INTERNAL_SENSITIVE_ALERT_PATH, request.nextUrl.origin), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-security-token": token,
      },
      body: JSON.stringify({
        path: request.nextUrl.pathname,
        method: request.method.toUpperCase(),
        ip: getClientIp(request),
        reason: alert.reason,
        metadata: {
          blocked: alert.blocked,
          userAgent: request.headers.get("user-agent") || "",
          referer: request.headers.get("referer") || "",
          host: request.headers.get("host") || request.nextUrl.host,
          ...alert.metadata,
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error(
        `[security-sensitive-alert] internal endpoint returned HTTP ${response.status} for ${request.nextUrl.pathname}`
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[security-sensitive-alert] failed to report ${request.nextUrl.pathname}: ${message}`);
  } finally {
    clearTimeout(timeout);
  }
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const maintenanceEnabled = isMaintenanceModeEnabled();
  const maintenanceHeaders = createMaintenanceHeaders();

  if (isSensitiveProbePath(pathname)) {
    await reportSensitiveAccessAttempt(request, {
      reason: "sensitive_probe_path",
      blocked: false,
      metadata: { severity: "high" },
    });
  }

  if (maintenanceEnabled) {
    if (SOURCE_MAP_PATTERN.test(pathname)) {
      const headers = new Headers(maintenanceHeaders);
      headers.set("Content-Type", "text/plain; charset=utf-8");
      return new NextResponse("Not Found", { status: 404, headers });
    }

    if (pathname === MAINTENANCE_PATHNAME) {
      const response = NextResponse.rewrite(new URL(MAINTENANCE_PATHNAME, request.url), {
        status: 503,
      });
      maintenanceHeaders.forEach((value, key) => response.headers.set(key, value));
      return response;
    }

    if (MAINTENANCE_ALLOWED_API_PATHS.has(pathname)) {
      const method = request.method.toUpperCase();
      if (method !== "POST" && method !== "OPTIONS") {
        const headers = new Headers(maintenanceHeaders);
        headers.set("Allow", "POST, OPTIONS");
        headers.set("Content-Type", "application/json; charset=utf-8");
        return new NextResponse(JSON.stringify({ ok: false, error: "Method Not Allowed" }), {
          status: 405,
          headers,
        });
      }

      const response = NextResponse.next({ request });
      maintenanceHeaders.forEach((value, key) => response.headers.set(key, value));
      return response;
    }

    if (MAINTENANCE_ALLOWED_PUBLIC_PATHS.has(pathname)) {
      const response = NextResponse.next({ request });
      maintenanceHeaders.forEach((value, key) => response.headers.set(key, value));
      return response;
    }

    if (isFrameworkAssetPath(pathname)) {
      const response = NextResponse.next({ request });
      maintenanceHeaders.forEach((value, key) => response.headers.set(key, value));
      return response;
    }

    if (pathname === "/api" || pathname.startsWith("/api/")) {
      const headers = new Headers(maintenanceHeaders);
      headers.set("Content-Type", "application/json; charset=utf-8");
      return new NextResponse(
        JSON.stringify({
          error: "Service Unavailable",
          code: "MAINTENANCE_MODE",
          message: "API temporarily unavailable during scheduled maintenance.",
        }),
        { status: 503, headers }
      );
    }

    if (!MAINTENANCE_SAFE_PAGE_METHODS.has(request.method.toUpperCase())) {
      const headers = new Headers(maintenanceHeaders);
      headers.set("Content-Type", "text/plain; charset=utf-8");
      return new NextResponse("Service temporarily unavailable during scheduled maintenance.", {
        status: 503,
        headers,
      });
    }

    const maintenanceUrl = new URL(MAINTENANCE_PATHNAME, request.url);
    const response = NextResponse.rewrite(maintenanceUrl, { status: 503 });
    maintenanceHeaders.forEach((value, key) => response.headers.set(key, value));
    return response;
  }

  if (process.env.NODE_ENV === "production" && SOURCE_MAP_PATTERN.test(pathname)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  if (pathname.startsWith("/_next/")) {
    return NextResponse.next({ request });
  }

  if (STATIC_FILE_PATTERN.test(pathname)) {
    return NextResponse.next({ request });
  }

  if ((pathname === "/api" || pathname.startsWith("/api/")) && !pathname.startsWith("/api/admin")) {
    return NextResponse.next({ request });
  }

  const isProduction = process.env.NODE_ENV === "production";
  const hostname = request.nextUrl.hostname.toLowerCase();
  const seoCriticalPaths = new Set<string>([
    "/sitemap.xml",
    "/robots.txt",
    "/manifest.json",
  ]);

  if (
    seoCriticalPaths.has(pathname) ||
    pathname.startsWith("/sitemap-") ||
    pathname.startsWith("/sitemap/") ||
    pathname.startsWith("/sitemaps/")
  ) {
    return NextResponse.next({ request });
  }

  // Keep listed pages available only on localhost/dev. On public hosts redirect to app root.
  const [, firstSegment] = pathname.split("/");
  const hasLocalePrefix = isSupportedLocale(firstSegment || "");
  if (!hasLocalePrefix && isLocalOnlyPath(pathname) && !isLocalHostname(hostname)) {
    const publicAppOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim();
    const redirectBase = publicAppOrigin && /^https?:\/\//i.test(publicAppOrigin)
      ? publicAppOrigin
      : request.nextUrl.origin;
    const redirectUrl = new URL("/", redirectBase);
    return NextResponse.redirect(redirectUrl);
  }

  const localeInfo = stripLocaleFromPathname(pathname);
  const pathnameWithoutLocale = localeInfo.pathname;

  if (localeInfo.locale && isPathNonLocalized(pathnameWithoutLocale)) {
    const redirectUrl = new URL(pathnameWithoutLocale, request.url);
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set(LOCALE_COOKIE_NAME, localeInfo.locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return response;
  }

  if (!localeInfo.locale && shouldLocalizePath(pathname)) {
    const preferredLocale = detectPreferredLocale({
      cookieLocale: request.cookies.get(LOCALE_COOKIE_NAME)?.value ?? null,
      acceptLanguage: request.headers.get("accept-language"),
    });
    const redirectUrl = new URL(withLocale(pathname, preferredLocale), request.url);
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set(LOCALE_COOKIE_NAME, preferredLocale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return response;
  }

  const supabaseResponse = NextResponse.next({ request });
  if (localeInfo.locale) {
    supabaseResponse.cookies.set(LOCALE_COOKIE_NAME, localeInfo.locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const clearAuthCookies = (response: NextResponse) => {
    request.cookies.getAll().forEach((cookie) => {
      if (
        cookie.name === "admin_token" ||
        cookie.name.startsWith("sb-") ||
        cookie.name.startsWith("supabase")
      ) {
        response.cookies.set(cookie.name, "", { path: "/", maxAge: 0 });
      }
    });
    return response;
  };

  const withSupabaseCookies = (response: NextResponse) => {
    supabaseResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
    return response;
  };

  if (pathname === "/admin/login") {
    if (!isProduction) {
      const response = NextResponse.next();
      response.cookies.set("admin_login_attempts", "0", {
        path: "/",
        httpOnly: true,
        maxAge: 60 * 30,
        sameSite: "lax",
      });
      return withSupabaseCookies(response);
    }

    const attemptCookie = request.cookies.get("admin_login_attempts")?.value;
    const previousAttempts = Number.parseInt(attemptCookie || "0", 10);
    const safePreviousAttempts = Number.isFinite(previousAttempts) ? previousAttempts : 0;

    if (!user) {
      await reportSensitiveAccessAttempt(request, {
        reason: "admin_login_without_session",
        blocked: true,
      });
      const response = NextResponse.redirect(new URL("/market", request.url));
      const nextAttempts = safePreviousAttempts + 1;
      response.cookies.set("admin_login_attempts", String(nextAttempts), {
        path: "/",
        httpOnly: true,
        maxAge: 60 * 30,
        sameSite: "lax",
      });
      if (nextAttempts >= 3) {
        clearAuthCookies(response);
      }
      return withSupabaseCookies(response);
    }

    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle<{ is_admin: boolean | null }>();

    if (!hasCanonicalAdminAccess(adminProfile)) {
      await reportSensitiveAccessAttempt(request, {
        reason: "admin_login_non_admin_user",
        blocked: true,
        metadata: { userId: user.id },
      });
      const response = NextResponse.redirect(new URL("/market", request.url));
      const nextAttempts = safePreviousAttempts + 1;
      response.cookies.set("admin_login_attempts", String(nextAttempts), {
        path: "/",
        httpOnly: true,
        maxAge: 60 * 30,
        sameSite: "lax",
      });
      if (nextAttempts >= 3) {
        clearAuthCookies(response);
      }
      return withSupabaseCookies(response);
    }

    const response = NextResponse.next();
    response.cookies.set("admin_login_attempts", "0", {
      path: "/",
      httpOnly: true,
      maxAge: 60 * 30,
      sameSite: "lax",
    });
    return withSupabaseCookies(response);
  }

  // Protect admin routes with admin token.
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/admintest") ||
    pathname.startsWith("/api/admin")
  ) {
    if (pathname === "/api/admin/login") {
      return withSupabaseCookies(NextResponse.next());
    }

    // Check for admin_token cookie
    const token = request.cookies.get("admin_token")?.value;

    if (!token) {
      await reportSensitiveAccessAttempt(request, {
        reason: "admin_route_missing_token",
        blocked: true,
      });
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    // Verify JWT
    const payload = await verifyToken(token);
    if (!payload || payload.role !== "admin") {
      await reportSensitiveAccessAttempt(request, {
        reason: "admin_route_invalid_token",
        blocked: true,
      });
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  // Keep `/auth` as optional entrypoint.
  const isAuthRoute = pathname === "/auth" || pathname.startsWith("/auth/");

  if (user && isAuthRoute) {
    const next = getRedirectPath(request.nextUrl.searchParams);
    return withSupabaseCookies(NextResponse.redirect(new URL(next, request.url)));
  }

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    const accountStatus = String((profile as { account_status?: string } | null)?.account_status || "active");
    const forceLogoutAt = (profile as { session_force_logout_at?: string | null } | null)
      ?.session_force_logout_at;
    const lastSignInAt = user.last_sign_in_at ? new Date(user.last_sign_in_at).getTime() : 0;
    const forcedAt = forceLogoutAt ? new Date(forceLogoutAt).getTime() : 0;

    if (["banned", "suspended"].includes(accountStatus) || (forcedAt && lastSignInAt && lastSignInAt < forcedAt)) {
      const marketUrl = new URL("/market", request.url);
      marketUrl.searchParams.set("reason", "session_reset");
      const response = NextResponse.redirect(marketUrl);
      clearAuthCookies(response);
      return withSupabaseCookies(response);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/:path*",
  ],
};
