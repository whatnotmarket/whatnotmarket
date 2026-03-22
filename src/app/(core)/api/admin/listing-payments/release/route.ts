import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/infra/supabase/supabase-admin";
import { assertAdminRequest } from "@/lib/domains/auth/admin-auth";
import { canTransitionStatus, type ListingPaymentStatus } from "@/lib/domains/payments/listing-escrow";

type Payload = {
  paymentId?: string;
  action?: "mark_awaiting_release" | "release" | "fail";
  notes?: string;
  txHashOut?: string;
  idempotencyKey?: string;
};

function resolveTargetStatus(action: Payload["action"]): ListingPaymentStatus | null {
  if (action === "mark_awaiting_release") return "awaiting_release";
  if (action === "release") return "released";
  if (action === "fail") return "failed";
  return null;
}

export async function POST(request: NextRequest) {
  try {
    await assertAdminRequest(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Payload;
  const paymentId = String(body.paymentId ?? "").trim();
  const action = body.action;
  const targetStatus = resolveTargetStatus(action);
  const notes = String(body.notes ?? "").trim() || null;
  const txHashOut = String(body.txHashOut ?? "").trim() || null;
  const idempotencyKey =
    request.headers.get("Idempotency-Key") || String(body.idempotencyKey ?? "").trim() || null;

  if (!paymentId || !targetStatus) {
    return NextResponse.json({ error: "paymentId and action are required" }, { status: 400 });
  }

  if (targetStatus === "released" && !txHashOut) {
    return NextResponse.json({ error: "txHashOut is required for release" }, { status: 400 });
  }

  const admin = createAdminClient();

  if (idempotencyKey) {
    const { data: existingAction } = await admin
      .from("escrow_actions")
      .select("payment_id")
      .eq("payment_id", paymentId)
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    if (existingAction) {
      const { data: currentPayment } = await admin
        .from("listing_payments")
        .select("*")
        .eq("id", paymentId)
        .maybeSingle();

      return NextResponse.json({
        payment: currentPayment,
        idempotent: true,
      });
    }
  }

  const { data: payment } = await admin
    .from("listing_payments")
    .select("*")
    .eq("id", paymentId)
    .maybeSingle();

  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  const currentStatus = payment.status as ListingPaymentStatus;
  if (!canTransitionStatus(currentStatus, targetStatus) && currentStatus !== targetStatus) {
    return NextResponse.json(
      { error: `Invalid transition ${currentStatus} -> ${targetStatus}` },
      { status: 409 }
    );
  }

  if (currentStatus === targetStatus) {
    return NextResponse.json({
      payment,
      idempotent: true,
    });
  }

  const updatePayload: Record<string, string> = {
    status: targetStatus,
  };
  if (targetStatus === "released" && txHashOut) {
    updatePayload.tx_hash_out = txHashOut;
  }

  const { data: updated, error: updateError } = await admin
    .from("listing_payments")
    .update(updatePayload)
    .eq("id", paymentId)
    .eq("status", currentStatus)
    .select("*")
    .maybeSingle();

  if (updateError || !updated) {
    const { data: raceState } = await admin
      .from("listing_payments")
      .select("*")
      .eq("id", paymentId)
      .maybeSingle();

    if (raceState) {
      return NextResponse.json({
        payment: raceState,
        idempotent: true,
      });
    }

    return NextResponse.json({ error: "Unable to update payment status" }, { status: 500 });
  }

  await admin.from("escrow_actions").insert({
    payment_id: paymentId,
    action_type: targetStatus,
    notes,
    tx_hash: txHashOut,
    idempotency_key: idempotencyKey,
  });

  await admin.from("audit_logs").insert({
    action: `listing_payment_${targetStatus}`,
    target_id: paymentId,
    target_type: "listing_payment",
    metadata: {
      from_status: currentStatus,
      to_status: targetStatus,
      tx_hash_out: txHashOut,
      notes,
      idempotency_key: idempotencyKey,
    },
  });

  return NextResponse.json({
    payment: updated,
    idempotent: false,
  });
}


