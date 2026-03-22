import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/infra/supabase/supabase-server";
import { createAdminClient } from "@/lib/infra/supabase/supabase-admin";
import { checkRateLimitDetailed, RateLimitResponse } from "@/lib/infra/security/rate-limit";
import { AbuseGuardResponse, enforceAbuseGuard } from "@/lib/domains/security/abuse-guards";

const requestSchema = z.object({
  counterpartyUserId: z.string().uuid(),
  isBuying: z.boolean(),
  price: z.number().positive(),
  offerToken: z.string().trim().min(2).max(12).optional(),
  paymentType: z.enum(["crypto", "fiat"]).default("crypto"),
  fiatMethod: z.string().trim().max(64).optional(),
});

export async function POST(request: Request) {
  const preAuthLimit = checkRateLimitDetailed(request, { action: "deal_create" });
  if (!preAuthLimit.allowed) {
    return RateLimitResponse(preAuthLimit);
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid deal creation payload" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userLimit = checkRateLimitDetailed(request, {
    action: "deal_create",
    identifier: user.id,
  });
  if (!userLimit.allowed) {
    return RateLimitResponse(userLimit);
  }

  const userAbuse = await enforceAbuseGuard({
    request,
    action: "deal_create",
    endpointGroup: "commerce",
    userId: user.id,
  });
  if (!userAbuse.allowed) {
    return AbuseGuardResponse(userAbuse);
  }

  const { counterpartyUserId, isBuying, price, offerToken, paymentType, fiatMethod } = parsed.data;
  if (counterpartyUserId === user.id) {
    return NextResponse.json({ error: "Cannot create a deal with yourself" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: counterparty } = await admin
    .from("profiles")
    .select("id")
    .eq("id", counterpartyUserId)
    .maybeSingle<{ id: string }>();

  if (!counterparty) {
    return NextResponse.json({ error: "Counterparty not found" }, { status: 404 });
  }

  const buyerId = isBuying ? user.id : counterpartyUserId;
  const sellerId = isBuying ? counterpartyUserId : user.id;
  const status = isBuying ? "buyer_offer_sent" : "offer_sent";
  const normalizedToken = paymentType === "fiat" ? "USD" : (offerToken || "SOL").toUpperCase();

  const { data: existingOpenDeal } = await admin
    .from("deals")
    .select("id,status")
    .or(
      `and(buyer_id.eq.${buyerId},seller_id.eq.${sellerId}),and(buyer_id.eq.${sellerId},seller_id.eq.${buyerId})`
    )
    .not("status", "in", `("completed","cancelled","offer_rejected")`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string; status: string }>();

  if (existingOpenDeal) {
    return NextResponse.json(
      {
        error: "An active deal already exists between these users",
        dealId: existingOpenDeal.id,
        status: existingOpenDeal.status,
      },
      { status: 409 }
    );
  }

  const { data: insertedDeal, error: insertError } = await admin
    .from("deals")
    .insert({
      buyer_id: buyerId,
      seller_id: sellerId,
      status,
      price,
      token_symbol: normalizedToken,
      payment_type: paymentType,
      fiat_method: paymentType === "fiat" ? fiatMethod ?? null : null,
      fee: Number((price * 0.01).toFixed(8)),
      deal_type: "direct",
      sender_id: user.id,
      last_action_by: user.id,
      created_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (insertError || !insertedDeal) {
    return NextResponse.json({ error: "Unable to create deal" }, { status: 500 });
  }

  return NextResponse.json({ deal: insertedDeal });
}

