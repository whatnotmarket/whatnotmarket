import { createWalletChallengeMessage } from "@/lib/domains/auth/external-wallet";
import { resolveRequiredInviteCode } from "@/lib/domains/auth/invite-codes";
import { AbuseGuardResponse,enforceAbuseGuard } from "@/lib/domains/security/abuse-guards";
import { checkRateLimitDetailed,RateLimitResponse } from "@/lib/infra/security/rate-limit";
import { randomUUID } from "crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

type Payload = {
  address?: string;
  chain?: string;
  mode?: "signin" | "signup";
  inviteCode?: string;
  next?: string;
  provider?: string;
  displayName?: string;
};

const providerAliases: Record<string, "walletconnect" | "metamask" | "trustwallet" | "google" | "apple" | "wallet"> = {
  walletconnect: "walletconnect",
  metamask: "metamask",
  trustwallet: "trustwallet",
  trust: "trustwallet",
  google: "google",
  apple: "apple",
  wallet: "wallet",
};

function normalizeProvider(raw: string | undefined) {
  const value = String(raw ?? "")
    .trim()
    .toLowerCase();

  return providerAliases[value] ?? "wallet";
}

function normalizeDisplayName(raw: string | undefined) {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  return value.slice(0, 80);
}

function normalizeNext(raw: string | undefined) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/market";
  }
  return raw;
}

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimitDetailed(request, { action: "auth_wallet_challenge" });
  if (!rateLimit.allowed) {
    return RateLimitResponse(rateLimit);
  }

  const abuseGuard = await enforceAbuseGuard({
    request,
    action: "auth_wallet_challenge",
    endpointGroup: "auth",
  });
  if (!abuseGuard.allowed) {
    return AbuseGuardResponse(abuseGuard);
  }

  const body = (await request.json().catch(() => ({}))) as Payload;
  const address = String(body.address ?? "")
    .trim()
    .toLowerCase();
  const chain = String(body.chain ?? "")
    .trim()
    .toLowerCase();

  if (!address || !address.startsWith("0x") || address.length !== 42) {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
  }

  if (!chain) {
    return NextResponse.json({ error: "Chain is required" }, { status: 400 });
  }

  const addressRateLimit = checkRateLimitDetailed(request, {
    action: "auth_wallet_challenge",
    identifier: `${chain}:${address}`,
  });
  if (!addressRateLimit.allowed) {
    return RateLimitResponse(addressRateLimit);
  }

  const mode = body.mode === "signup" ? "signup" : "signin";
  const inviteCode = body.inviteCode?.trim().toUpperCase() || null;
  const nextPath = normalizeNext(body.next);
  const provider = normalizeProvider(body.provider);
  const displayName = normalizeDisplayName(body.displayName);

  let inviteResolution: Awaited<ReturnType<typeof resolveRequiredInviteCode>> | null = null;

  if (mode === "signup") {
    inviteResolution = await resolveRequiredInviteCode(inviteCode, {
      allowedTypes: ["buyer", "seller"],
    });
    if (!inviteResolution.isValid) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 400 });
    }
  }

  const desiredRole = mode === "signup" ? inviteResolution?.role ?? "buyer" : ("buyer" as const);

  const nonce = randomUUID();
  const message = createWalletChallengeMessage({
    address,
    chain,
    nonce,
  });

  const response = NextResponse.json({
    message,
    nonce,
  });

  response.cookies.set(
    "wm_wallet_auth_tx",
    JSON.stringify({
      nonce,
      address,
      chain,
      mode,
      desiredRole,
      inviteCode,
      nextPath,
      provider,
      displayName,
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

