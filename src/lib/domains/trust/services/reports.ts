import type { ReasonCode } from "@/lib/domains/trust/reason-codes";
import { appendTrustAuditLog,createModerationCase } from "@/lib/domains/trust/services/trust-store";
import type { RiskLevel } from "@/lib/domains/trust/types";
import { createAdminClient } from "@/lib/infra/supabase/supabase-admin";

export type ReportTargetType = "user" | "listing" | "conversation" | "review";

export async function createTrustReport(params: {
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  category: string;
  description: string | null;
  evidenceUrls: string[];
  reasonCodes?: ReasonCode[];
  riskLevel?: RiskLevel;
  priority?: number;
}) {
  const admin = createAdminClient();

  const { data: reportRow, error } = await admin
    .from("trust_reports")
    .insert({
      reporter_id: params.reporterId,
      target_type: params.targetType,
      target_id: params.targetId,
      category: params.category,
      description: params.description,
      evidence_urls: params.evidenceUrls,
      reason_codes: params.reasonCodes || [],
      risk_level: params.riskLevel || "medium",
      priority: params.priority || 2,
    })
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error || !reportRow) {
    throw new Error(error?.message || "Unable to create trust report");
  }

  const caseId = await createModerationCase({
    sourceReportId: reportRow.id,
    entityType: params.targetType,
    entityId: params.targetId,
    priority: params.priority || 2,
    riskScore: params.riskLevel === "critical" ? 90 : params.riskLevel === "high" ? 70 : 45,
    riskLevel: params.riskLevel || "medium",
    reasonCodes: params.reasonCodes || [],
    summary: `User report: ${params.category}`,
    notes: params.description,
  });

  await appendTrustAuditLog({
    actorUserId: params.reporterId,
    eventType: "trust_report_created",
    targetType: params.targetType,
    targetId: params.targetId,
    reasonCodes: params.reasonCodes || [],
    metadata: {
      reportId: reportRow.id,
      caseId,
      category: params.category,
    },
  });

  return {
    reportId: reportRow.id,
    caseId,
  };
}

