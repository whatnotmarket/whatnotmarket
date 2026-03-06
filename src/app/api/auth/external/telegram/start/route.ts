import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { resolveInviteCode } from "@/lib/invite-codes";

type AuthMode = "signin" | "signup";

function normalizeNext(raw: string | null) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/market";
  }
  return raw;
}

function parseMode(raw: string | null): AuthMode {
  return raw === "signup" ? "signup" : "signin";
}

export async function GET(request: NextRequest) {
  const mode = parseMode(request.nextUrl.searchParams.get("mode"));
  const inviteCode = request.nextUrl.searchParams.get("inviteCode")?.trim().toUpperCase() || null;
  const nextPath = normalizeNext(request.nextUrl.searchParams.get("next"));

  if (mode === "signup") {
    const inviteResolution = resolveInviteCode(inviteCode);
    if (!inviteResolution.isValid) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("auth_status", "error");
      loginUrl.searchParams.set("auth_message", "Invalid invite code.");
      return NextResponse.redirect(loginUrl);
    }
  }

  const redirectUrl = new URL("/login/telegram", request.url);
  const response = NextResponse.redirect(redirectUrl);

  response.cookies.set(
    "wm_telegram_auth_tx",
    JSON.stringify({
      mode,
      inviteCode,
      nextPath,
    }),
    {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 10,
    }
  );

  return response;
}
