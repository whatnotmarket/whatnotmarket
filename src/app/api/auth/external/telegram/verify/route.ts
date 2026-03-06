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

type Payload = {
  telegramAuth?: TelegramAuthPayload;
  mode?: "signin" | "signup";
  inviteCode?: string;
  next?: string;
};

function normalizeNext(raw: string | undefined) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/market";
  }
  return raw;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Payload;
  const telegramAuth = body.telegramAuth;
  const mode = body.mode === "signup" ? "signup" : "signin";
  const inviteCode = body.inviteCode?.trim().toUpperCase() || null;
  const nextPath = normalizeNext(body.next);

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json(
      { error: "Telegram auth adapter is not configured (missing TELEGRAM_BOT_TOKEN)." },
      { status: 500 }
    );
  }

  if (!telegramAuth?.id || !telegramAuth.hash || !telegramAuth.auth_date) {
    return NextResponse.json({ error: "Invalid Telegram payload" }, { status: 400 });
  }

  if (!verifyTelegramAuthPayload(telegramAuth, botToken)) {
    return NextResponse.json({ error: "Telegram verification failed" }, { status: 401 });
  }

  const ageInSeconds = Math.abs(Math.floor(Date.now() / 1000) - Number(telegramAuth.auth_date));
  if (ageInSeconds > 60 * 10) {
    return NextResponse.json({ error: "Telegram payload expired" }, { status: 401 });
  }

  const inviteResolution = mode === "signup" ? resolveInviteCode(inviteCode) : null;
  if (mode === "signup" && inviteResolution && !inviteResolution.isValid) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 400 });
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
  if (mode === "signup") {
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

  const response = NextResponse.json({
    ok: true,
    redirectTo: nextPath,
    roleMessage,
  });

  await signInBridgeUserOnRoute({
    request,
    response,
    email: bridgeIdentity.email,
    password: bridgeIdentity.password,
  });

  return response;
}

