import { assertAdminRequest } from "@/lib/domains/auth/admin-auth";
import { checkRateLimitDetailed,RateLimitResponse } from "@/lib/infra/security/rate-limit";
import { createAdminClient } from "@/lib/infra/supabase/supabase-admin";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

type ModerationCaseRow = {
  id: string;
  entity_type: string;
  entity_id: string;
  status: string;
  priority: number;
  risk_score: number;
  risk_level: string;
  reason_codes: string[] | null;
  summary: string | null;
  notes: string | null;
  assigned_admin_id: string | null;
  created_at: string;
  updated_at: string;
};

export async function GET(request: NextRequest) {
  try {
    await assertAdminRequest(request);
  } catch {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = checkRateLimitDetailed(request, { action: "trust_admin_review_queue" });
  if (!rateLimit.allowed) {
    return RateLimitResponse(rateLimit);
  }

  const admin = createAdminClient();
  const statusFilter = request.nextUrl.searchParams.get("status")?.trim() || "open,in_review";
  const statuses = statusFilter
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const query = admin
    .from("trust_moderation_cases")
    .select(
      "id,entity_type,entity_id,status,priority,risk_score,risk_level,reason_codes,summary,notes,assigned_admin_id,created_at,updated_at"
    )
    .order("priority", { ascending: false })
    .order("risk_score", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(200);

  const { data, error } =
    statuses.length > 0 ? await query.in("status", statuses) : await query;

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const rows = (data || []) as ModerationCaseRow[];
  const entityKeys = rows.map((row) => `${row.entity_type}:${row.entity_id}`);
  const snapshotFetch = await admin
    .from("trust_risk_snapshots")
    .select("entity_type,entity_id,risk_score,risk_level,reason_codes,updated_at")
    .in("entity_id", rows.map((row) => row.entity_id))
    .limit(300);

  const snapshots =
    snapshotFetch.error || !snapshotFetch.data
      ? new Map<string, unknown>()
      : new Map(
          snapshotFetch.data.map((snapshot) => [
            `${snapshot.entity_type}:${snapshot.entity_id}`,
            {
              riskScore: snapshot.risk_score,
              riskLevel: snapshot.risk_level,
              reasonCodes: snapshot.reason_codes || [],
              updatedAt: snapshot.updated_at,
            },
          ])
        );

  return NextResponse.json({
    ok: true,
    total: rows.length,
    cases: rows.map((row) => ({
      id: row.id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      status: row.status,
      priority: row.priority,
      riskScore: row.risk_score,
      riskLevel: row.risk_level,
      reasonCodes: row.reason_codes || [],
      summary: row.summary,
      notes: row.notes,
      assignedAdminId: row.assigned_admin_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      snapshot: snapshots.get(`${row.entity_type}:${row.entity_id}`) || null,
    })),
    meta: {
      statusFilter: statuses,
      entityKeys,
    },
  });
}

