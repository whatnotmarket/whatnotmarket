import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { evaluateFundingSubmission } from "@/lib/security/payment-guards";
import { checkRateLimitDetailed, RateLimitResponse } from "@/lib/rate-limit";
import { AbuseGuardResponse, enforceAbuseGuard } from "@/lib/security/abuse-guards";

type Payload = {
  paymentId?: string;
  txHashIn?: string;
};

function isLikelyTxHash(value: string) {
  return /^0x[a-fA-F0-9]{64}$/.test(value);
}

export async function POST(request: Request) {
  const preAuthLimit = checkRateLimitDetailed(request, { action: "listing_payment_fund" });
  if (!preAuthLimit.allowed) {
    return RateLimitResponse(preAuthLimit);
  }

  const body = (await request.json().catch(() => ({}))) as Payload;
  const paymentId = String(body.paymentId ?? "").trim();
  const txHashIn = String(body.txHashIn ?? "").trim();

  if (!paymentId) {
    return NextResponse.json({ error: "paymentId is required" }, { status: 400 });
  }

  if (!isLikelyTxHash(txHashIn)) {
    return NextResponse.json({ error: "Invalid txHashIn format" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userLimit = checkRateLimitDetailed(request, {
    action: "listing_payment_fund",
    identifier: user.id,
  });
  if (!userLimit.allowed) {
    return RateLimitResponse(userLimit);
  }

  const userAbuse = await enforceAbuseGuard({
    request,
    action: "listing_payment_fund",
    endpointGroup: "payment",
    userId: user.id,
  });
  if (!userAbuse.allowed) {
    return AbuseGuardResponse(userAbuse);
  }

  const { data: payment } = await supabase
    .from("listing_payments")
    .select("*")
    .eq("id", paymentId)
    .eq("payer_user_id", user.id)
    .maybeSingle();

  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  const fundingGuard = evaluateFundingSubmission({
    status: payment.status,
    existingTxHash: payment.tx_hash_in,
    incomingTxHash: txHashIn,
  });

  if (!fundingGuard.allowed) {
    return NextResponse.json({ error: fundingGuard.reason }, { status: 409 });
  }

  if (fundingGuard.idempotent) {
    return NextResponse.json({
      payment,
      idempotent: true,
      requiresReview: true,
    });
  }

  const { data: updatedPayment, error: updateError } = await supabase
    .from("listing_payments")
    .update({
      tx_hash_in: txHashIn,
    })
    .eq("id", payment.id)
    .is("tx_hash_in", null)
    .select("*")
    .maybeSingle();

  if (updateError || !updatedPayment) {
    const { data: raceState } = await supabase
      .from("listing_payments")
      .select("*")
      .eq("id", payment.id)
      .maybeSingle();

    if (raceState) {
      return NextResponse.json({
        payment: raceState,
        idempotent: true,
        requiresReview: true,
      });
    }

    return NextResponse.json({ error: "Unable to persist funding proof" }, { status: 500 });
  }

  await supabase.from("escrow_actions").insert({
    payment_id: updatedPayment.id,
    action_type: "funding_submitted",
    performed_by_user_id: user.id,
    tx_hash: txHashIn,
    notes: "Funding proof submitted by payer. Waiting for server-side/admin verification.",
  });

  return NextResponse.json({
    payment: updatedPayment,
    idempotent: false,
    requiresReview: true,
  });
}
