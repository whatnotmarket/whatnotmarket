import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { buildEscrowReference } from "@/lib/payments/listing-escrow";

type Payload = {
  listingId?: string;
  payeeUserId?: string | null;
  payerWalletAddress?: string;
  targetWalletAddress?: string;
  amount?: number;
  currency?: string;
  chain?: string;
  idempotencyKey?: string;
};

function normalizeAddress(raw: string | undefined) {
  return String(raw ?? "")
    .trim()
    .toLowerCase();
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Payload;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const listingId = String(body.listingId ?? "").trim();
  const amount = Number(body.amount ?? NaN);
  const currency = String(body.currency ?? "").trim().toUpperCase();
  const chain = String(body.chain ?? "").trim().toLowerCase();
  const payerWalletAddress = normalizeAddress(body.payerWalletAddress);
  const targetWalletAddress = normalizeAddress(body.targetWalletAddress);
  const idempotencyKey =
    request.headers.get("Idempotency-Key") || String(body.idempotencyKey ?? "").trim();

  if (!listingId) {
    return NextResponse.json({ error: "listingId is required" }, { status: 400 });
  }

  if (!idempotencyKey) {
    return NextResponse.json({ error: "Missing Idempotency-Key" }, { status: 400 });
  }

  if (!payerWalletAddress || !targetWalletAddress) {
    return NextResponse.json(
      { error: "payerWalletAddress and targetWalletAddress are required" },
      { status: 400 }
    );
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  if (!currency || !chain) {
    return NextResponse.json({ error: "currency and chain are required" }, { status: 400 });
  }

  const { data: linkedWallet } = await supabase
    .from("wallets")
    .select("id")
    .eq("user_id", user.id)
    .eq("address", payerWalletAddress)
    .eq("chain", chain)
    .not("verified_at", "is", null)
    .maybeSingle<{ id: string }>();

  if (!linkedWallet) {
    return NextResponse.json(
      { error: "Wallet is not linked/verified for this account" },
      { status: 400 }
    );
  }

  const { data: existingPayment } = await supabase
    .from("listing_payments")
    .select("*")
    .eq("payer_user_id", user.id)
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (existingPayment) {
    return NextResponse.json({
      payment: existingPayment,
      idempotent: true,
    });
  }

  const { data: insertedPayment, error: insertError } = await supabase
    .from("listing_payments")
    .insert({
      listing_id: listingId,
      payer_user_id: user.id,
      payee_user_id: body.payeeUserId ?? null,
      payer_wallet_address: payerWalletAddress,
      target_wallet_address: targetWalletAddress,
      amount,
      currency,
      chain,
      status: "pending",
      escrow_reference: buildEscrowReference(),
      idempotency_key: idempotencyKey,
    })
    .select("*")
    .single();

  if (insertError || !insertedPayment) {
    if (insertError?.code === "23505") {
      const { data: racePayment } = await supabase
        .from("listing_payments")
        .select("*")
        .eq("payer_user_id", user.id)
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();

      if (racePayment) {
        return NextResponse.json({
          payment: racePayment,
          idempotent: true,
        });
      }
    }

    return NextResponse.json({ error: "Unable to create payment" }, { status: 500 });
  }

  await supabase.from("escrow_actions").insert({
    payment_id: insertedPayment.id,
    action_type: "pending",
    performed_by_user_id: user.id,
    notes: "Listing payment created. Awaiting wallet transfer to escrow.",
  });

  return NextResponse.json({
    payment: insertedPayment,
    idempotent: false,
  });
}

