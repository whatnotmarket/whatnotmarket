import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { verifyToken } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (pathname === "/testlogin" || pathname.startsWith("/testlogin/")) {
    const url = new URL("/login", request.url);
    request.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });
    return NextResponse.redirect(url);
  }

  const supabaseResponse = NextResponse.next({ request });
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

  const withSupabaseCookies = (response: NextResponse) => {
    supabaseResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
    return response;
  };

  if (pathname === "/admin/login") {
    const attemptCookie = request.cookies.get("admin_login_attempts")?.value;
    const previousAttempts = Number.parseInt(attemptCookie || "0", 10);
    const safePreviousAttempts = Number.isFinite(previousAttempts) ? previousAttempts : 0;

    if (!user) {
      const response = NextResponse.redirect(new URL("/market", request.url));
      const nextAttempts = safePreviousAttempts + 1;
      response.cookies.set("admin_login_attempts", String(nextAttempts), {
        path: "/",
        httpOnly: true,
        maxAge: 60 * 30,
        sameSite: "lax",
      });
      if (nextAttempts >= 3) {
        request.cookies.getAll().forEach((cookie) => {
          if (
            cookie.name === "admin_token" ||
            cookie.name.startsWith("sb-") ||
            cookie.name.startsWith("supabase")
          ) {
            response.cookies.set(cookie.name, "", { path: "/", maxAge: 0 });
          }
        });
      }
      return withSupabaseCookies(response);
    }

    const { data: founderProfile } = await supabase
      .from("profiles")
      .select("username,is_admin")
      .eq("id", user.id)
      .maybeSingle<{ username: string | null; is_admin: boolean | null }>();

    const normalizedUsername = String(founderProfile?.username || "")
      .trim()
      .toLowerCase()
      .replace(/^@+/, "");
    const isFounder = Boolean(founderProfile?.is_admin) || normalizedUsername === "whatnotmarket";

    if (!isFounder) {
      const response = NextResponse.redirect(new URL("/market", request.url));
      const nextAttempts = safePreviousAttempts + 1;
      response.cookies.set("admin_login_attempts", String(nextAttempts), {
        path: "/",
        httpOnly: true,
        maxAge: 60 * 30,
        sameSite: "lax",
      });
      if (nextAttempts >= 3) {
        request.cookies.getAll().forEach((cookie) => {
          if (
            cookie.name === "admin_token" ||
            cookie.name.startsWith("sb-") ||
            cookie.name.startsWith("supabase")
          ) {
            response.cookies.set(cookie.name, "", { path: "/", maxAge: 0 });
          }
        });
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
    response.cookies.set("founder_admin_gate", "1", {
      path: "/",
      httpOnly: true,
      maxAge: 60 * 10,
      sameSite: "strict",
    });
    return withSupabaseCookies(response);
  }

  // Protect /admin routes with admin token.
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (pathname === "/api/admin/login") {
      return withSupabaseCookies(NextResponse.next());
    }

    // Check for admin_token cookie
    const token = request.cookies.get("admin_token")?.value;

    if (!token) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    // Verify JWT
    const payload = await verifyToken(token);
    if (!payload || payload.role !== "admin") {
       if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
       return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  // Public routes for authentication pages.
  const isAuthRoute =
    pathname === "/auth" ||
    pathname.startsWith("/auth/") ||
    pathname === "/login" ||
    pathname.startsWith("/login/");

  if (!user && !isAuthRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return withSupabaseCookies(NextResponse.redirect(loginUrl));
  }

  if (user && isAuthRoute) {
    return withSupabaseCookies(NextResponse.redirect(new URL("/market", request.url)));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)",
    "/api/admin/:path*",
  ],
};
