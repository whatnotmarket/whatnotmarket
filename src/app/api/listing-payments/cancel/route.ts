import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { checkRateLimitDetailed, RateLimitResponse } from "@/lib/rate-limit";
import { AbuseGuardResponse, enforceAbuseGuard } from "@/lib/security/abuse-guards";

type Payload = {
  paymentId?: string;
  reason?: string;
};

export async function POST(request: Request) {
  const preAuthLimit = checkRateLimitDetailed(request, { action: "listing_payment_cancel" });
  if (!preAuthLimit.allowed) {
    return RateLimitResponse(preAuthLimit);
  }

  const body = (await request.json().catch(() => ({}))) as Payload;
  const paymentId = String(body.paymentId ?? "").trim();
  const reason = String(body.reason ?? "Cancelled by payer").trim();

  if (!paymentId) {
    return NextResponse.json({ error: "paymentId is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userLimit = checkRateLimitDetailed(request, {
    action: "listing_payment_cancel",
    identifier: user.id,
  });
  if (!userLimit.allowed) {
    return RateLimitResponse(userLimit);
  }

  const userAbuse = await enforceAbuseGuard({
    request,
    action: "listing_payment_cancel",
    endpointGroup: "payment",
    userId: user.id,
  });
  if (!userAbuse.allowed) {
    return AbuseGuardResponse(userAbuse);
  }

  const { data: updated, error } = await supabase
    .from("listing_payments")
    .update({
      status: "cancelled",
    })
    .eq("id", paymentId)
    .eq("payer_user_id", user.id)
    .eq("status", "pending")
    .select("*")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Unable to cancel payment" }, { status: 500 });
  }

  if (!updated) {
    const { data: current } = await supabase
      .from("listing_payments")
      .select("*")
      .eq("id", paymentId)
      .eq("payer_user_id", user.id)
      .maybeSingle();

    if (!current) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: `Cannot cancel payment in status ${current.status}` },
      { status: 409 }
    );
  }

  await supabase.from("escrow_actions").insert({
    payment_id: updated.id,
    action_type: "cancelled",
    performed_by_user_id: user.id,
    notes: reason,
  });

  return NextResponse.json({
    payment: updated,
  });
}
