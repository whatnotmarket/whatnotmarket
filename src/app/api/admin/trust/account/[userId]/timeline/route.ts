import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { assertAdminRequest } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase-admin";
import { checkRateLimitDetailed, RateLimitResponse } from "@/lib/rate-limit";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    await assertAdminRequest(request);
  } catch {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = checkRateLimitDetailed(request, { action: "trust_admin_review_queue" });
  if (!rateLimit.allowed) {
    return RateLimitResponse(rateLimit);
  }

  const { userId } = await context.params;
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Missing user id" }, { status: 400 });
  }

  const admin = createAdminClient();
  const [riskEventsResp, securityEventsResp, reportsResp, casesResp] = await Promise.all([
    admin
      .from("trust_risk_events")
      .select("id,entity_type,entity_id,risk_score,risk_level,reason_codes,action,blocked,created_at")
      .eq("actor_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100),
    admin
      .from("trust_security_events")
      .select("id,event_type,is_suspicious,reason_codes,created_at,metadata")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100),
    admin
      .from("trust_reports")
      .select("id,target_type,target_id,category,status,risk_level,reason_codes,created_at")
      .or(`reporter_id.eq.${userId},target_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(100),
    admin
      .from("trust_moderation_cases")
      .select("id,entity_type,entity_id,status,priority,risk_score,risk_level,reason_codes,summary,created_at,updated_at")
      .or(`entity_id.eq.${userId},assigned_admin_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  return NextResponse.json({
    ok: true,
    userId,
    timeline: {
      riskEvents: riskEventsResp.data || [],
      securityEvents: securityEventsResp.data || [],
      reports: reportsResp.data || [],
      moderationCases: casesResp.data || [],
    },
  });
}
