import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { applyRoleAssignmentForUser } from "@/lib/auth/role-assignment";
import { ensureBridgeUser, signInBridgeUserOnRoute } from "@/lib/auth/bridge";
import {
  verifyTelegramAuthPayload,
  type TelegramAuthPayload,
} from "@/lib/auth/external-telegram";
import { resolveInviteCode } from "@/lib/invite-codes";
import { createAdminClient } from "@/lib/supabase-admin";

type TelegramTx = {
  mode: "signin" | "signup";
  inviteCode: string | null;
  nextPath: string;
};

function parseTx(raw: string | undefined): TelegramTx | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TelegramTx;
  } catch {
    return null;
  }
}

function normalizeNext(raw: string | undefined) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/market";
  }
  return raw;
}

function redirectToLogin(request: NextRequest, params: Record<string, string>) {
  const url = new URL("/login", request.url);
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });
  return url;
}

function parseTelegramPayload(request: NextRequest): TelegramAuthPayload | null {
  const idRaw = request.nextUrl.searchParams.get("id");
  const hash = request.nextUrl.searchParams.get("hash");
  const authDateRaw = request.nextUrl.searchParams.get("auth_date");

  if (!idRaw || !hash || !authDateRaw) {
    return null;
  }

  const id = Number(idRaw);
  const authDate = Number(authDateRaw);

  if (!Number.isFinite(id) || !Number.isFinite(authDate)) {
    return null;
  }

  return {
    id,
    hash,
    auth_date: authDate,
    first_name: request.nextUrl.searchParams.get("first_name") ?? undefined,
    last_name: request.nextUrl.searchParams.get("last_name") ?? undefined,
    username: request.nextUrl.searchParams.get("username") ?? undefined,
    photo_url: request.nextUrl.searchParams.get("photo_url") ?? undefined,
  };
}

export async function GET(request: NextRequest) {
  const tx = parseTx(request.cookies.get("wm_telegram_auth_tx")?.value);

  if (!tx) {
    return NextResponse.redirect(
      redirectToLogin(request, {
        auth_status: "error",
        auth_message: "Missing Telegram auth transaction context.",
      })
    );
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    const response = NextResponse.redirect(
      redirectToLogin(request, {
        auth_status: "error",
        auth_message: "Telegram auth adapter is not configured.",
      })
    );
    response.cookies.set("wm_telegram_auth_tx", "", { path: "/", maxAge: 0 });
    return response;
  }

  const telegramAuth = parseTelegramPayload(request);
  if (!telegramAuth) {
    const response = NextResponse.redirect(
      redirectToLogin(request, {
        auth_status: "cancelled",
        auth_message: "Telegram authentication cancelled or invalid.",
      })
    );
    response.cookies.set("wm_telegram_auth_tx", "", { path: "/", maxAge: 0 });
    return response;
  }

  if (!verifyTelegramAuthPayload(telegramAuth, botToken)) {
    const response = NextResponse.redirect(
      redirectToLogin(request, {
        auth_status: "error",
        auth_message: "Telegram verification failed.",
      })
    );
    response.cookies.set("wm_telegram_auth_tx", "", { path: "/", maxAge: 0 });
    return response;
  }

  const ageInSeconds = Math.abs(Math.floor(Date.now() / 1000) - Number(telegramAuth.auth_date));
  if (ageInSeconds > 60 * 10) {
    const response = NextResponse.redirect(
      redirectToLogin(request, {
        auth_status: "error",
        auth_message: "Telegram payload expired.",
      })
    );
    response.cookies.set("wm_telegram_auth_tx", "", { path: "/", maxAge: 0 });
    return response;
  }

  try {
    const inviteCode = tx.inviteCode?.trim().toUpperCase() || null;
    const inviteResolution = tx.mode === "signup" ? resolveInviteCode(inviteCode) : null;

    if (tx.mode === "signup" && inviteResolution && !inviteResolution.isValid) {
      throw new Error("Invalid invite code");
    }

    const fullName = [telegramAuth.first_name, telegramAuth.last_name]
      .filter(Boolean)
      .join(" ")
      .trim();

    const subject = `telegram:${telegramAuth.id}`;
    const bridgeIdentity = await ensureBridgeUser({
      subject,
      provider: "telegram",
      email: null,
      fullName: fullName || telegramAuth.username || `telegram_${telegramAuth.id}`,
      avatarUrl: telegramAuth.photo_url ?? null,
    });

    let roleMessage: string | null = null;
    if (tx.mode === "signup") {
      const assignment = await applyRoleAssignmentForUser({
        userId: bridgeIdentity.userId,
        email: bridgeIdentity.email,
        desiredRole: inviteResolution?.role ?? "buyer",
        inviteCode,
      });
      roleMessage = assignment.message;
    }

    const admin = createAdminClient();
    await admin
      .from("profiles")
      .update({
        telegram_user_id: String(telegramAuth.id),
        telegram_username: telegramAuth.username ?? null,
      })
      .eq("id", bridgeIdentity.userId);

    const nextUrl = new URL("/login", request.url);
    nextUrl.searchParams.set("next", normalizeNext(tx.nextPath));
    nextUrl.searchParams.set("auth_status", "success");
    if (roleMessage) {
      nextUrl.searchParams.set("auth_message", roleMessage);
    }

    const response = NextResponse.redirect(nextUrl);
    await signInBridgeUserOnRoute({
      request,
      response,
      email: bridgeIdentity.email,
      password: bridgeIdentity.password,
    });

    response.cookies.set("wm_telegram_auth_tx", "", { path: "/", maxAge: 0 });
    return response;
  } catch (error) {
    const response = NextResponse.redirect(
      redirectToLogin(request, {
        auth_status: "error",
        auth_message: error instanceof Error ? error.message : "Telegram authentication failed.",
      })
    );
    response.cookies.set("wm_telegram_auth_tx", "", { path: "/", maxAge: 0 });
    return response;
  }
}
