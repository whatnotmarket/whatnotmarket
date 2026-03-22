import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/infra/supabase/supabase-server";
import { createWalletChallengeMessage } from "@/lib/domains/auth/external-wallet";
import { checkRateLimitDetailed, RateLimitResponse } from "@/lib/infra/security/rate-limit";
import { AbuseGuardResponse, enforceAbuseGuard } from "@/lib/domains/security/abuse-guards";

type Payload = {
  address?: string;
  chain?: string;
};

export async function POST(request: Request) {
  const preAuthLimit = checkRateLimitDetailed(request, { action: "wallet_link_challenge" });
  if (!preAuthLimit.allowed) {
    return RateLimitResponse(preAuthLimit);
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userLimit = checkRateLimitDetailed(request, {
    action: "wallet_link_challenge",
    identifier: user.id,
  });
  if (!userLimit.allowed) {
    return RateLimitResponse(userLimit);
  }

  const userAbuse = await enforceAbuseGuard({
    request,
    action: "wallet_link_challenge",
    endpointGroup: "wallet",
    userId: user.id,
  });
  if (!userAbuse.allowed) {
    return AbuseGuardResponse(userAbuse);
  }

  const nonce = randomUUID();
  const message = createWalletChallengeMessage({ address, chain, nonce });

  const cookieStore = await cookies();
  cookieStore.set(
    "wm_wallet_link_tx",
    JSON.stringify({
      nonce,
      address,
      chain,
      userId: user.id,
    }),
    {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 10,
    }
  );

  return NextResponse.json({
    message,
  });
}

