import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { assertAdminRequest } from "@/lib/admin-auth";

type DashboardActionPayload = {
  action?: string;
  targetId?: string;
  value?: string | boolean | null;
};

const requestStatuses = new Set(["open", "accepted", "closed"]);
const offerStatuses = new Set(["pending", "accepted", "rejected"]);
const dealStatuses = new Set(["verification", "completed", "cancelled"]);
const roleValues = new Set(["buyer", "seller", "both"]);
const sellerStatuses = new Set(["unverified", "pending_telegram", "verified", "rejected"]);

export async function POST(request: NextRequest) {
  try {
    await assertAdminRequest(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as DashboardActionPayload;
  const action = String(body.action || "").trim();
  const targetId = String(body.targetId || "").trim();

  if (!action || !targetId) {
    return NextResponse.json({ error: "action and targetId are required" }, { status: 400 });
  }

  const admin = createAdminClient();
  let updateError: { message: string } | null = null;

  if (action === "user.toggleAdmin") {
    const nextValue = Boolean(body.value);
    const { error } = await admin.from("profiles").update({ is_admin: nextValue }).eq("id", targetId);
    updateError = error;
  } else if (action === "user.setRole") {
    const role = String(body.value || "");
    if (!roleValues.has(role)) {
      return NextResponse.json({ error: "Invalid role value" }, { status: 400 });
    }
    const { error } = await admin
      .from("profiles")
      .update({
        role_preference: role,
        onboarding_status: role === "buyer" ? "completed" : "started",
      })
      .eq("id", targetId);
    updateError = error;
  } else if (action === "user.setSellerStatus") {
    const sellerStatus = String(body.value || "");
    if (!sellerStatuses.has(sellerStatus)) {
      return NextResponse.json({ error: "Invalid seller status" }, { status: 400 });
    }
    const { error } = await admin.from("profiles").update({ seller_status: sellerStatus }).eq("id", targetId);
    updateError = error;
  } else if (action === "request.setStatus") {
    const status = String(body.value || "");
    if (!requestStatuses.has(status)) {
      return NextResponse.json({ error: "Invalid request status" }, { status: 400 });
    }
    const { error } = await admin.from("requests").update({ status }).eq("id", targetId);
    updateError = error;
  } else if (action === "offer.setStatus") {
    const status = String(body.value || "");
    if (!offerStatuses.has(status)) {
      return NextResponse.json({ error: "Invalid offer status" }, { status: 400 });
    }
    const { error } = await admin.from("offers").update({ status }).eq("id", targetId);
    updateError = error;
  } else if (action === "deal.setStatus") {
    const status = String(body.value || "");
    if (!dealStatuses.has(status)) {
      return NextResponse.json({ error: "Invalid deal status" }, { status: 400 });
    }
    const { error } = await admin.from("deals").update({ status }).eq("id", targetId);
    updateError = error;
  } else {
    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  }

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await admin.from("audit_logs").insert({
    action: `dashboard_${action}`,
    target_id: targetId,
    target_type: "dashboard_action",
    metadata: {
      value: body.value ?? null,
      source: "admin_dashboard",
    },
  });

  return NextResponse.json({ ok: true });
}
