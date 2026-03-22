import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { assertAdminRequest } from "@/lib/domains/auth/admin-auth";
import { createAdminClient } from "@/lib/infra/supabase/supabase-admin";
import { createClient as createServerClient } from "@/lib/infra/supabase/supabase-server";
import { checkRateLimitDetailed, RateLimitResponse } from "@/lib/infra/security/rate-limit";
import { appendModerationAction, appendTrustAuditLog } from "@/lib/domains/trust/services/trust-store";

const actionSchema = z.object({
  actionType: z.enum([
    "dismiss_case",
    "resolve_case",
    "assign_case",
    "request_kyc",
    "suspend_user",
    "unsuspend_user",
    "restrict_listing",
    "publish_listing",
    "remove_listing",
    "shadow_limit_user",
  ]),
  notes: z.string().trim().max(1200).optional(),
  targetId: z.string().trim().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

type TrustCaseRow = {
  id: string;
  entity_type: "user" | "listing" | "conversation" | "review" | "account";
  entity_id: string;
  status: string;
  reason_codes: string[] | null;
};

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

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ caseId: string }> }
) {
  try {
    await assertAdminRequest(request);
  } catch {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = checkRateLimitDetailed(request, { action: "trust_admin_case_action" });
  if (!rateLimit.allowed) {
    return RateLimitResponse(rateLimit);
  }

  const { caseId } = await context.params;
  if (!caseId) {
    return NextResponse.json({ ok: false, error: "Missing case id" }, { status: 400 });
  }

  const parsed = actionSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid action payload" }, { status: 400 });
  }

  const admin = createAdminClient();
  const actorUserId = await resolveActorId();

  const { data: trustCase, error: trustCaseError } = await admin
    .from("trust_moderation_cases")
    .select("id,entity_type,entity_id,status,reason_codes")
    .eq("id", caseId)
    .maybeSingle<TrustCaseRow>();

  if (trustCaseError || !trustCase) {
    return NextResponse.json({ ok: false, error: "Moderation case not found" }, { status: 404 });
  }

  const notes = parsed.data.notes || null;
  const metadata = parsed.data.metadata || {};
  const reasonCodes = (trustCase.reason_codes || []) as string[];
  const targetId = parsed.data.targetId || trustCase.entity_id;

  if (parsed.data.actionType === "suspend_user" || parsed.data.actionType === "shadow_limit_user") {
    const accountFlag = parsed.data.actionType === "suspend_user" ? "suspended" : "under_review";
    await admin.from("trust_account_states").upsert(
      {
        user_id: targetId,
        account_flag: accountFlag,
        risk_level: parsed.data.actionType === "suspend_user" ? "critical" : "high",
        risk_score: parsed.data.actionType === "suspend_user" ? 95 : 72,
        restrictions: {
          stepUpVerificationRequired: true,
          manualReviewLocked: true,
        },
        last_reason_codes: reasonCodes,
      },
      { onConflict: "user_id" }
    );

    await admin
      .from("profiles")
      .update({
        account_status: parsed.data.actionType === "suspend_user" ? "suspended" : "active",
        account_note: notes,
      })
      .eq("id", targetId);
  }

  if (parsed.data.actionType === "unsuspend_user") {
    await admin.from("trust_account_states").upsert(
      {
        user_id: targetId,
        account_flag: "limited",
        risk_level: "medium",
        restrictions: {
          stepUpVerificationRequired: false,
        },
      },
      { onConflict: "user_id" }
    );

    await admin
      .from("profiles")
      .update({
        account_status: "active",
        account_note: notes,
      })
      .eq("id", targetId);
  }

  if (parsed.data.actionType === "request_kyc") {
    await admin.from("trust_account_states").upsert(
      {
        user_id: targetId,
        account_flag: "under_review",
        kyc_status: "pending",
        restrictions: {
          stepUpVerificationRequired: true,
          kycRequired: true,
        },
      },
      { onConflict: "user_id" }
    );
  }

  if (
    parsed.data.actionType === "restrict_listing" ||
    parsed.data.actionType === "publish_listing" ||
    parsed.data.actionType === "remove_listing"
  ) {
    const safetyStatus =
      parsed.data.actionType === "restrict_listing"
        ? "restricted"
        : parsed.data.actionType === "remove_listing"
          ? "removed"
          : "published";
    const visibilityState = parsed.data.actionType === "publish_listing" ? "normal" : "limited";

    await admin
      .from("requests")
      .update({
        safety_status: safetyStatus,
        visibility_state: visibilityState,
        moderation_notes: notes,
        trust_reason_codes: reasonCodes,
      })
      .eq("id", targetId);
  }

  if (parsed.data.actionType === "assign_case") {
    await admin
      .from("trust_moderation_cases")
      .update({
        status: "in_review",
        assigned_admin_id: targetId,
      })
      .eq("id", trustCase.id);
  } else {
    const nextStatus =
      parsed.data.actionType === "dismiss_case"
        ? "dismissed"
        : parsed.data.actionType === "resolve_case"
          ? "resolved"
          : "actioned";

    await admin
      .from("trust_moderation_cases")
      .update({
        status: nextStatus,
        notes,
        resolved_at: nextStatus === "resolved" || nextStatus === "dismissed" ? new Date().toISOString() : null,
      })
      .eq("id", trustCase.id);
  }

  await appendModerationAction({
    caseId: trustCase.id,
    actorUserId,
    actionType: parsed.data.actionType,
    targetType: trustCase.entity_type,
    targetId,
    reasonCodes,
    notes,
    metadata,
  }).catch((error) => {
    console.error("Failed to append moderation action", error);
  });

  await appendTrustAuditLog({
    actorUserId,
    eventType: "trust_case_action",
    targetType: trustCase.entity_type,
    targetId: trustCase.entity_id,
    reasonCodes,
    metadata: {
      caseId: trustCase.id,
      actionType: parsed.data.actionType,
      targetId,
      notes,
      metadata,
    },
  }).catch((error) => {
    console.error("Failed to append trust audit log", error);
  });

  return NextResponse.json({
    ok: true,
    caseId: trustCase.id,
    actionType: parsed.data.actionType,
    status: parsed.data.actionType === "dismiss_case" ? "dismissed" : parsed.data.actionType === "resolve_case" ? "resolved" : "actioned",
  });
}

