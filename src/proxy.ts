import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  // Protect /admin routes
  if (request.nextUrl.pathname.startsWith("/admin") || request.nextUrl.pathname.startsWith("/api/admin")) {
    // Allow access to login page
    if (request.nextUrl.pathname === "/admin/login") {
      return NextResponse.next();
    }

    // Check for admin_token cookie
    const token = request.cookies.get("admin_token")?.value;

    if (!token) {
      if (request.nextUrl.pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    // Verify JWT
    const payload = await verifyToken(token);
    if (!payload || payload.role !== "admin") {
       if (request.nextUrl.pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
       return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
