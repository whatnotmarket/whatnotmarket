import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

type Payload = {
  paymentId?: string;
  txHashIn?: string;
};

function isLikelyTxHash(value: string) {
  return /^0x[a-fA-F0-9]{64}$/.test(value);
}

export async function POST(request: Request) {
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

  const { data: payment } = await supabase
    .from("listing_payments")
    .select("*")
    .eq("id", paymentId)
    .eq("payer_user_id", user.id)
    .maybeSingle();

  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  if (payment.status !== "pending") {
    if (
      payment.status === "funded_to_escrow" ||
      payment.status === "awaiting_release" ||
      payment.status === "released"
    ) {
      return NextResponse.json({ payment, idempotent: true });
    }
    return NextResponse.json({ error: `Cannot fund payment in status ${payment.status}` }, { status: 409 });
  }

  const { data: funded, error: fundedError } = await supabase
    .from("listing_payments")
    .update({
      status: "funded_to_escrow",
      tx_hash_in: txHashIn,
    })
    .eq("id", payment.id)
    .eq("status", "pending")
    .select("*")
    .maybeSingle();

  if (fundedError || !funded) {
    const { data: raceState } = await supabase
      .from("listing_payments")
      .select("*")
      .eq("id", payment.id)
      .maybeSingle();

    if (raceState) {
      return NextResponse.json({ payment: raceState, idempotent: true });
    }

    return NextResponse.json({ error: "Unable to move payment to funded_to_escrow" }, { status: 500 });
  }

  await supabase.from("escrow_actions").insert([
    {
      payment_id: funded.id,
      action_type: "funded_to_escrow",
      performed_by_user_id: user.id,
      tx_hash: txHashIn,
      notes: "Payer submitted wallet transaction to escrow.",
    },
    {
      payment_id: funded.id,
      action_type: "awaiting_release",
      performed_by_user_id: user.id,
      notes: "Escrow funding detected. Waiting for admin release.",
    },
  ]);

  const { data: awaitingRelease } = await supabase
    .from("listing_payments")
    .update({
      status: "awaiting_release",
    })
    .eq("id", funded.id)
    .eq("status", "funded_to_escrow")
    .select("*")
    .maybeSingle();

  return NextResponse.json({
    payment: awaitingRelease ?? funded,
    idempotent: false,
  });
}

