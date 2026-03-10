import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { applyRoleAssignmentForUser } from "@/lib/auth/role-assignment";
import { createAdminClient } from "@/lib/supabase-admin";
import {
  BridgeIdentityNotFoundError,
  ensureBridgeUser,
  signInBridgeUserOnRoute,
} from "@/lib/auth/bridge";
import { verifyWalletChallengeSignature } from "@/lib/auth/external-wallet";
import { resolveRequiredInviteCode } from "@/lib/invite-codes";
import { shouldAllowBridgeUserCreation } from "@/lib/security/auth-guards";
import { checkRateLimitDetailed, RateLimitResponse } from "@/lib/rate-limit";
import { AbuseGuardResponse, enforceAbuseGuard } from "@/lib/security/abuse-guards";

type Payload = {
  signature?: string;
};

type WalletAuthTx = {
  nonce: string;
  address: string;
  chain: string;
  mode: "signin" | "signup";
  desiredRole: "buyer" | "seller";
  inviteCode: string | null;
  nextPath: string;
  provider: "walletconnect" | "metamask" | "trustwallet" | "google" | "apple" | "wallet";
  displayName: string | null;
};

function normalizeProvider(raw: string | undefined): WalletAuthTx["provider"] {
  const value = String(raw ?? "")
    .trim()
    .toLowerCase();

  if (value === "metamask") return "metamask";
  if (value === "trustwallet" || value === "trust") return "trustwallet";
  if (value === "google") return "google";
  if (value === "apple") return "apple";
  if (value === "walletconnect") return "walletconnect";
  return "wallet";
}

function parseTx(raw: string | undefined): WalletAuthTx | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<WalletAuthTx>;
    if (!parsed.nonce || !parsed.address || !parsed.chain || !parsed.nextPath) {
      return null;
    }

    return {
      nonce: parsed.nonce,
      address: parsed.address,
      chain: parsed.chain,
      mode: parsed.mode === "signup" ? "signup" : "signin",
      desiredRole: parsed.desiredRole === "seller" ? "seller" : "buyer",
      inviteCode: parsed.inviteCode ?? null,
      nextPath: parsed.nextPath,
      provider: normalizeProvider(parsed.provider),
      displayName:
        typeof parsed.displayName === "string" && parsed.displayName.trim()
          ? parsed.displayName.trim().slice(0, 80)
          : null,
    };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimitDetailed(request, { action: "auth_wallet_verify" });
  if (!rateLimit.allowed) {
    return RateLimitResponse(rateLimit);
  }

  const abuseGuard = await enforceAbuseGuard({
    request,
    action: "auth_wallet_verify",
    endpointGroup: "auth",
  });
  if (!abuseGuard.allowed) {
    return AbuseGuardResponse(abuseGuard);
  }

  const body = (await request.json().catch(() => ({}))) as Payload;
  const signature = String(body.signature ?? "");
  const tx = parseTx(request.cookies.get("wm_wallet_auth_tx")?.value);

  if (!tx) {
    return NextResponse.json({ error: "Missing wallet auth transaction" }, { status: 400 });
  }

  const scopedLimit = checkRateLimitDetailed(request, {
    action: "auth_wallet_verify",
    identifier: `${tx.chain}:${tx.address.toLowerCase()}`,
  });
  if (!scopedLimit.allowed) {
    return RateLimitResponse(scopedLimit);
  }

  if (!signature) {
    return NextResponse.json({ error: "Signature is required" }, { status: 400 });
  }

  const isValidSignature = await verifyWalletChallengeSignature({
    address: tx.address,
    chain: tx.chain,
    nonce: tx.nonce,
    signature,
  });

  if (!isValidSignature) {
    return NextResponse.json({ error: "Wallet signature verification failed" }, { status: 401 });
  }

  const subject = `wallet:${tx.chain}:${tx.address.toLowerCase()}`;
  let desiredRole: "buyer" | "seller" = "buyer";
  let inviteCode: string | null = null;

  if (tx.mode === "signup") {
    const inviteResolution = await resolveRequiredInviteCode(tx.inviteCode, {
      allowedTypes: ["buyer", "seller"],
    });
    if (!inviteResolution.isValid) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 400 });
    }
    desiredRole = inviteResolution.role;
    inviteCode = inviteResolution.normalizedCode;
  }

  let bridgeIdentity;
  try {
    bridgeIdentity = await ensureBridgeUser(
      {
        subject,
        provider: tx.provider,
        email: null,
        fullName: tx.displayName || tx.address,
        avatarUrl: null,
      },
      {
        allowCreate: shouldAllowBridgeUserCreation(tx.mode),
      }
    );
  } catch (error) {
    if (error instanceof BridgeIdentityNotFoundError) {
      return NextResponse.json({ error: "Invalid authentication credentials" }, { status: 401 });
    }
    throw error;
  }

  let roleMessage: string | null = null;
  if (tx.mode === "signup") {
    const assignment = await applyRoleAssignmentForUser({
      userId: bridgeIdentity.userId,
      email: bridgeIdentity.email,
      desiredRole,
      inviteCode,
    });
    roleMessage = assignment.message;
  }

  const response = NextResponse.json({
    ok: true,
    redirectTo: tx.nextPath,
    roleMessage,
  });

  await signInBridgeUserOnRoute({
    request,
    response,
    email: bridgeIdentity.email,
    password: bridgeIdentity.password,
  });

  try {
    const admin = createAdminClient();
    await admin.from("wallets").upsert(
      {
        user_id: bridgeIdentity.userId,
        address: tx.address,
        chain: tx.chain,
        provider: tx.provider,
        verified_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,address,chain",
      }
    );
  } catch {
    // Wallet table might not be available before migrations are applied.
  }

  response.cookies.set("wm_wallet_auth_tx", "", {
    path: "/",
    maxAge: 0,
  });

  return response;
}
