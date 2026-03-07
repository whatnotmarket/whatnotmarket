import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { assertAdminRequest } from "@/lib/admin-auth";
import { createClient as createServerClient } from "@/lib/supabase-server";
import { canTransitionStatus, type ListingPaymentStatus } from "@/lib/payments/listing-escrow";
import { getOrderById, saveOrder, type OrderStatus } from "@/lib/orders-db";

type DashboardActionPayload = {
  action?: string;
  targetId?: string;
  value?: unknown;
  note?: string;
};

const requestStatuses = new Set(["open", "accepted", "closed"]);
const offerStatuses = new Set(["pending", "accepted", "rejected"]);
const dealStatuses = new Set(["verification", "completed", "cancelled"]);
const roleValues = new Set(["buyer", "seller", "both"]);
const sellerStatuses = new Set(["unverified", "pending_telegram", "verified", "rejected"]);
const inviteStatuses = new Set(["active", "used", "revoked", "expired", "exhausted"]);
const inviteTypes = new Set(["buyer", "seller", "founder"]);
const verificationStatuses = new Set(["issued", "used", "expired"]);
const listingPaymentStatuses = new Set([
  "pending",
  "funded_to_escrow",
  "awaiting_release",
  "released",
  "failed",
  "cancelled",
]);
const proxyOrderStatuses = new Set([
  "CREATED",
  "PLACED",
  "PROCESSING",
  "LOCKER_ASSIGNED",
  "READY_FOR_PICKUP",
  "PICKED_UP",
  "COMPLETED",
  "CANCELLED",
]);

const actionsRequiringNote = new Set([
  "user.ban",
  "user.setAccountStatus",
  "user.delete",
  "user.setAdmin",
  "user.revokeAdmin",
  "user.forceLogout",
  "request.setStatus",
  "offer.setStatus",
  "deal.setStatus",
  "payment.transition",
  "wallet.unlink",
  "identity.unlink",
  "invite.create",
  "invite.setStatus",
  "invite.delete",
  "config.set",
  "proxyOrder.updateStatus",
]);

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function asString(value: unknown) {
  return String(value ?? "").trim();
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

async function resolveActorId() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    await assertAdminRequest(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as DashboardActionPayload;
  const action = asString(body.action);
  const targetId = asString(body.targetId);
  const note = asString(body.note);

  if (!action) {
    return NextResponse.json({ error: "action is required" }, { status: 400 });
  }

  if (actionsRequiringNote.has(action) && note.length < 3) {
    return NextResponse.json({ error: "Internal note is required for this action" }, { status: 400 });
  }

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Supabase admin connection is not configured" },
      { status: 500 }
    );
  }
  const actorId = await resolveActorId();
  const auditMetadata: Record<string, unknown> = {
    note: note || null,
    source: "admin_dashboard",
    value: body.value ?? null,
  };

  let targetType = "dashboard_action";
  let auditTargetId: string | null = targetId || null;

  if (action === "user.revokeAdmin") {
    if (!targetId) return NextResponse.json({ error: "targetId is required" }, { status: 400 });
    const { error } = await admin.from("profiles").update({ is_admin: false }).eq("id", targetId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    targetType = "profile";
  } else if (action === "user.setAdmin") {
    if (!targetId) return NextResponse.json({ error: "targetId is required" }, { status: 400 });
    const setAdmin = Boolean(body.value);
    const { error } = await admin.from("profiles").update({ is_admin: setAdmin }).eq("id", targetId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    targetType = "profile";
    auditMetadata.is_admin = setAdmin;
  } else if (action === "user.setRole") {
    if (!targetId) return NextResponse.json({ error: "targetId is required" }, { status: 400 });
    const role = asString(body.value);
    if (!roleValues.has(role)) return NextResponse.json({ error: "Invalid role value" }, { status: 400 });
    const { error } = await admin
      .from("profiles")
      .update({
        role_preference: role,
        onboarding_status: role === "buyer" ? "completed" : "started",
      })
      .eq("id", targetId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    targetType = "profile";
  } else if (action === "user.setSellerStatus") {
    if (!targetId) return NextResponse.json({ error: "targetId is required" }, { status: 400 });
    const sellerStatus = asString(body.value);
    if (!sellerStatuses.has(sellerStatus)) {
      return NextResponse.json({ error: "Invalid seller status" }, { status: 400 });
    }
    const { error } = await admin.from("profiles").update({ seller_status: sellerStatus }).eq("id", targetId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    targetType = "profile";
  } else if (action === "user.resetOnboarding") {
    if (!targetId) return NextResponse.json({ error: "targetId is required" }, { status: 400 });
    const { error } = await admin
      .from("profiles")
      .update({
        onboarding_status: "started",
      })
      .eq("id", targetId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    targetType = "profile";
  } else if (action === "user.ban") {
    if (!targetId) return NextResponse.json({ error: "targetId is required" }, { status: 400 });
    const payload = asRecord(body.value);
    const duration = asString(payload.duration || "720h");
    const { error } = await admin.auth.admin.updateUserById(targetId, {
      ban_duration: duration,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await admin
      .from("profiles")
      .update({
        account_status: "banned",
        account_note: note || null,
      })
      .eq("id", targetId);
    auditMetadata.duration = duration;
    targetType = "auth_user";
  } else if (action === "user.unban") {
    if (!targetId) return NextResponse.json({ error: "targetId is required" }, { status: 400 });
    const { error } = await admin.auth.admin.updateUserById(targetId, {
      ban_duration: "none",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await admin
      .from("profiles")
      .update({
        account_status: "active",
        account_note: null,
      })
      .eq("id", targetId);
    targetType = "auth_user";
  } else if (action === "user.setAccountStatus") {
    if (!targetId) return NextResponse.json({ error: "targetId is required" }, { status: 400 });
    const payload = asRecord(body.value);
    const accountStatus = asString(payload.status).toLowerCase();
    if (!["active", "suspended", "banned"].includes(accountStatus)) {
      return NextResponse.json({ error: "Invalid account status" }, { status: 400 });
    }

    const profileUpdate: Record<string, unknown> = {
      account_status: accountStatus,
      account_note: note || null,
    };
    if (accountStatus === "active") {
      profileUpdate.session_force_logout_at = null;
    }

    const { error: profileError } = await admin.from("profiles").update(profileUpdate).eq("id", targetId);
    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

    if (accountStatus === "active") {
      await admin.auth.admin.updateUserById(targetId, { ban_duration: "none" });
    } else if (accountStatus === "suspended") {
      const duration = asString(payload.duration || "168h");
      await admin.auth.admin.updateUserById(targetId, { ban_duration: duration });
      auditMetadata.duration = duration;
    } else if (accountStatus === "banned") {
      await admin.auth.admin.updateUserById(targetId, { ban_duration: "87600h" });
    }

    targetType = "profile";
  } else if (action === "user.forceLogout") {
    if (!targetId) return NextResponse.json({ error: "targetId is required" }, { status: 400 });
    const { error } = await admin
      .from("profiles")
      .update({ session_force_logout_at: new Date().toISOString() })
      .eq("id", targetId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    targetType = "profile";
  } else if (action === "user.delete") {
    if (!targetId) return NextResponse.json({ error: "targetId is required" }, { status: 400 });
    const { error } = await admin.auth.admin.deleteUser(targetId, true);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    targetType = "auth_user";
  } else if (action === "wallet.unlink") {
    if (!targetId) return NextResponse.json({ error: "targetId is required" }, { status: 400 });
    const { error } = await admin.from("wallets").delete().eq("id", targetId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    targetType = "wallet";
  } else if (action === "identity.unlink") {
    if (!targetId) return NextResponse.json({ error: "targetId is required" }, { status: 400 });
    const { error } = await admin.from("auth_bridge_identities").delete().eq("auth_subject", targetId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    targetType = "identity";
    auditTargetId = null;
    auditMetadata.auth_subject = targetId;
  } else if (action === "invite.create") {
    const payload = asRecord(body.value);
    const code = asString(payload.code || targetId).toUpperCase();
    const expiresAt = asString(payload.expires_at || payload.expiresAt) || null;
    const type = asString(payload.type || "buyer").toLowerCase();
    const singleUse = Boolean(payload.single_use ?? payload.singleUse ?? false);
    const usageLimitRaw = asString(payload.usage_limit ?? payload.usageLimit ?? "");
    const usageLimit = usageLimitRaw ? Number(usageLimitRaw) : null;
    const notes = asString(payload.notes || note) || null;
    const metadata = asRecord(payload.metadata);

    if (!code) return NextResponse.json({ error: "Invite code is required" }, { status: 400 });
    if (!inviteTypes.has(type)) return NextResponse.json({ error: "Invalid invite type" }, { status: 400 });
    if (usageLimit !== null && (!Number.isFinite(usageLimit) || usageLimit <= 0)) {
      return NextResponse.json({ error: "usageLimit must be > 0" }, { status: 400 });
    }

    const { error } = await admin.from("invite_codes").insert({
      code,
      type,
      status: "active",
      single_use: singleUse,
      usage_limit: usageLimit,
      usage_count: 0,
      created_by: actorId,
      expires_at: expiresAt,
      notes,
      metadata,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    targetType = "invite_code";
    auditTargetId = null;
    auditMetadata.code = code;
    auditMetadata.type = type;
    auditMetadata.single_use = singleUse;
    auditMetadata.usage_limit = usageLimit;
    auditMetadata.expires_at = expiresAt;
  } else if (action === "invite.setStatus") {
    const payload = asRecord(body.value);
    const status = asString(payload.status || "").toLowerCase();
    const inviteCode = asString(payload.code || targetId).toUpperCase();
    if (!inviteStatuses.has(status)) {
      return NextResponse.json({ error: "Invalid invite status" }, { status: 400 });
    }
    if (!inviteCode) return NextResponse.json({ error: "Invite code is required" }, { status: 400 });
    const { error } = await admin.from("invite_codes").update({ status }).eq("code", inviteCode);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    targetType = "invite_code";
    auditTargetId = null;
    auditMetadata.code = inviteCode;
    auditMetadata.status = status;
  } else if (action === "invite.delete") {
    const inviteCode = targetId.toUpperCase();
    if (!inviteCode) return NextResponse.json({ error: "Invite code is required" }, { status: 400 });
    const { error } = await admin.from("invite_codes").delete().eq("code", inviteCode);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    targetType = "invite_code";
    auditTargetId = null;
    auditMetadata.code = inviteCode;
  } else if (action === "config.set") {
    const payload = asRecord(body.value);
    const key = asString(payload.key || targetId).toLowerCase();
    const value = payload.value;
    const description = asString(payload.description || "");

    if (!key) return NextResponse.json({ error: "Config key is required" }, { status: 400 });

    const { error } = await admin.from("admin_settings").upsert(
      {
        key,
        value: value ?? {},
        description: description || null,
        updated_by: actorId,
      },
      { onConflict: "key" }
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    targetType = "admin_setting";
    auditTargetId = null;
    auditMetadata.key = key;
  } else if (action === "request.setStatus") {
    if (!targetId) return NextResponse.json({ error: "targetId is required" }, { status: 400 });
    const status = asString(body.value);
    if (!requestStatuses.has(status)) {
      return NextResponse.json({ error: "Invalid request status" }, { status: 400 });
    }
    const { error } = await admin.from("requests").update({ status }).eq("id", targetId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    targetType = "request";
  } else if (action === "offer.setStatus") {
    if (!targetId) return NextResponse.json({ error: "targetId is required" }, { status: 400 });
    const status = asString(body.value);
    if (!offerStatuses.has(status)) {
      return NextResponse.json({ error: "Invalid offer status" }, { status: 400 });
    }
    const { error } = await admin.from("offers").update({ status }).eq("id", targetId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    targetType = "offer";
  } else if (action === "deal.setStatus") {
    if (!targetId) return NextResponse.json({ error: "targetId is required" }, { status: 400 });
    const status = asString(body.value);
    if (!dealStatuses.has(status)) {
      return NextResponse.json({ error: "Invalid deal status" }, { status: 400 });
    }
    const { error } = await admin.from("deals").update({ status }).eq("id", targetId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    targetType = "deal";
  } else if (action === "sellerVerification.setStatus") {
    if (!targetId) return NextResponse.json({ error: "targetId is required" }, { status: 400 });
    const status = asString(body.value);
    if (!verificationStatuses.has(status)) {
      return NextResponse.json({ error: "Invalid verification status" }, { status: 400 });
    }
    const updatePayload: Record<string, string | null> = { status };
    if (status === "used") updatePayload.used_at = new Date().toISOString();
    if (status !== "used") updatePayload.used_at = null;
    const { error } = await admin.from("seller_verifications").update(updatePayload).eq("id", targetId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    targetType = "seller_verification";
  } else if (action === "payment.transition") {
    if (!targetId) return NextResponse.json({ error: "targetId is required" }, { status: 400 });
    const payload = asRecord(body.value);
    const nextStatus = asString(payload.status) as ListingPaymentStatus;
    const txHashOut = asString(payload.txHashOut || "");
    if (!listingPaymentStatuses.has(nextStatus)) {
      return NextResponse.json({ error: "Invalid listing payment status" }, { status: 400 });
    }

    const { data: payment, error: paymentError } = await admin
      .from("listing_payments")
      .select("id,status")
      .eq("id", targetId)
      .maybeSingle();
    if (paymentError) return NextResponse.json({ error: paymentError.message }, { status: 500 });
    if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

    const currentStatus = payment.status as ListingPaymentStatus;
    if (currentStatus !== nextStatus && !canTransitionStatus(currentStatus, nextStatus)) {
      return NextResponse.json(
        { error: `Invalid transition ${currentStatus} -> ${nextStatus}` },
        { status: 409 }
      );
    }

    const updatePayload: Record<string, unknown> = { status: nextStatus };
    if (nextStatus === "released") {
      if (!txHashOut) return NextResponse.json({ error: "txHashOut is required for release" }, { status: 400 });
      updatePayload.tx_hash_out = txHashOut;
    }

    const { error } = await admin.from("listing_payments").update(updatePayload).eq("id", targetId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await admin.from("escrow_actions").insert({
      payment_id: targetId,
      action_type: nextStatus,
      performed_by_user_id: actorId,
      notes: note || null,
      tx_hash: txHashOut || null,
    });

    targetType = "listing_payment";
    auditMetadata.from_status = currentStatus;
    auditMetadata.to_status = nextStatus;
    auditMetadata.tx_hash_out = txHashOut || null;
  } else if (action === "proxyOrder.updateStatus") {
    if (!targetId) return NextResponse.json({ error: "targetId is required" }, { status: 400 });
    const payload = asRecord(body.value);
    const status = asString(payload.status) as OrderStatus;
    const message = asString(payload.message || "");
    const metadata = asRecord(payload.metadata);

    if (!proxyOrderStatuses.has(status)) {
      return NextResponse.json({ error: "Invalid proxy order status" }, { status: 400 });
    }
    if (!message) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    const order = await getOrderById(targetId);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    order.status = status;
    order.updates.push({
      status,
      message,
      timestamp: new Date().toISOString(),
      metadata,
    });

    if (status === "LOCKER_ASSIGNED" && metadata.lockerId) {
      order.lockerDetails = {
        id: String(metadata.lockerId),
        city: asString(metadata.city || order.city || "Unknown City"),
        region: asString(metadata.region || order.region || "Unknown Region"),
      };
    }

    if (status === "READY_FOR_PICKUP" && metadata.pickupCode && order.lockerDetails) {
      order.lockerDetails.code = String(metadata.pickupCode);
    }

    await saveOrder(order);
    targetType = "proxy_order";
  } else if (action === "notification.send") {
    const payload = asRecord(body.value);
    const recipientId = asString(payload.recipientId || targetId);
    const type = asString(payload.type || "admin_manual");
    const title = asString(payload.title);
    const notificationBody = asString(payload.body);
    const link = asString(payload.link || "") || null;
    const metadata = asRecord(payload.metadata);

    if (!recipientId || !title || !notificationBody) {
      return NextResponse.json(
        { error: "recipientId, title and body are required" },
        { status: 400 }
      );
    }

    const { error } = await admin.from("notifications").insert({
      recipient_id: recipientId,
      actor_id: actorId,
      type,
      title,
      body: notificationBody,
      link,
      metadata,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    targetType = "notification";
    auditTargetId = null;
    auditMetadata.recipient_id = recipientId;
  } else {
    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  }

  await admin.from("audit_logs").insert({
    actor_id: actorId,
    action: `dashboard_${action}`,
    target_type: targetType,
    target_id: auditTargetId && isUuid(auditTargetId) ? auditTargetId : null,
    metadata: {
      ...auditMetadata,
      raw_target_id: auditTargetId && !isUuid(auditTargetId) ? auditTargetId : null,
    },
  });

  return NextResponse.json({ ok: true });
}
