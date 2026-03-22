import { verifyWalletChallengeSignature } from "@/lib/domains/auth/external-wallet";
import { AbuseGuardResponse,enforceAbuseGuard } from "@/lib/domains/security/abuse-guards";
import { checkRateLimitDetailed,RateLimitResponse } from "@/lib/infra/security/rate-limit";
import { createAdminClient } from "@/lib/infra/supabase/supabase-admin";
import { createClient } from "@/lib/infra/supabase/supabase-server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type Payload = {
  signature?: string;
  provider?: string;
};

type LinkTx = {
  nonce: string;
  address: string;
  chain: string;
  userId: string;
};

function parseLinkTx(raw: string | undefined): LinkTx | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LinkTx;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const preAuthLimit = checkRateLimitDetailed(request, { action: "wallet_link_verify" });
  if (!preAuthLimit.allowed) {
    return RateLimitResponse(preAuthLimit);
  }

  const body = (await request.json().catch(() => ({}))) as Payload;
  const signature = String(body.signature ?? "");
  const provider = body.provider?.trim() || "walletconnect";

  if (!signature) {
    return NextResponse.json({ error: "Signature is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userLimit = checkRateLimitDetailed(request, {
    action: "wallet_link_verify",
    identifier: user.id,
  });
  if (!userLimit.allowed) {
    return RateLimitResponse(userLimit);
  }

  const userAbuse = await enforceAbuseGuard({
    request,
    action: "wallet_link_verify",
    endpointGroup: "wallet",
    userId: user.id,
  });
  if (!userAbuse.allowed) {
    return AbuseGuardResponse(userAbuse);
  }

  const cookieStore = await cookies();
  const tx = parseLinkTx(cookieStore.get("wm_wallet_link_tx")?.value);

  if (!tx || tx.userId !== user.id) {
    return NextResponse.json({ error: "Wallet link challenge not found" }, { status: 400 });
  }

  const isValid = await verifyWalletChallengeSignature({
    address: tx.address,
    chain: tx.chain,
    nonce: tx.nonce,
    signature,
  });

  if (!isValid) {
    return NextResponse.json({ error: "Wallet ownership verification failed" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("wallets")
    .upsert(
      {
        user_id: user.id,
        address: tx.address,
        chain: tx.chain,
        provider,
        verified_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,address,chain",
      }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Unable to link wallet" }, { status: 500 });
  }

  cookieStore.set("wm_wallet_link_tx", "", { path: "/", maxAge: 0 });

  return NextResponse.json({
    wallet: data,
  });
}

