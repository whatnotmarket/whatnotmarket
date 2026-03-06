import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { applyRoleAssignmentForUser } from "@/lib/auth/role-assignment";
import { createAdminClient } from "@/lib/supabase-admin";
import { ensureBridgeUser, signInBridgeUserOnRoute } from "@/lib/auth/bridge";
import { verifyWalletChallengeSignature } from "@/lib/auth/external-wallet";

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
};

function parseTx(raw: string | undefined): WalletAuthTx | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as WalletAuthTx;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Payload;
  const signature = String(body.signature ?? "");
  const tx = parseTx(request.cookies.get("wm_wallet_auth_tx")?.value);

  if (!tx) {
    return NextResponse.json({ error: "Missing wallet auth transaction" }, { status: 400 });
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
  const bridgeIdentity = await ensureBridgeUser({
    subject,
    provider: "wallet",
    email: null,
    fullName: tx.address,
    avatarUrl: null,
  });

  let roleMessage: string | null = null;
  if (tx.mode === "signup") {
    const assignment = await applyRoleAssignmentForUser({
      userId: bridgeIdentity.userId,
      email: bridgeIdentity.email,
      desiredRole: tx.desiredRole,
      inviteCode: tx.inviteCode,
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
        provider: "walletconnect",
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

