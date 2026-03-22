import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/infra/supabase/supabase-admin";
import { assertAdminRequest } from "@/lib/domains/auth/admin-auth";

export async function GET(request: NextRequest) {
  try {
    await assertAdminRequest(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: payments, error: paymentsError } = await admin
    .from("listing_payments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (paymentsError) {
    return NextResponse.json({ error: "Unable to load listing payments" }, { status: 500 });
  }

  const paymentIds = (payments ?? []).map((payment) => payment.id);
  let actionsByPayment: Record<string, unknown[]> = {};

  if (paymentIds.length > 0) {
    const { data: actions } = await admin
      .from("escrow_actions")
      .select("*")
      .in("payment_id", paymentIds)
      .order("created_at", { ascending: false });

    actionsByPayment = (actions ?? []).reduce<Record<string, unknown[]>>((acc, action) => {
      const key = String(action.payment_id);
      if (!acc[key]) acc[key] = [];
      acc[key].push(action);
      return acc;
    }, {});
  }

  return NextResponse.json({
    payments: (payments ?? []).map((payment) => ({
      ...payment,
      actions: actionsByPayment[String(payment.id)] ?? [],
    })),
  });
}

