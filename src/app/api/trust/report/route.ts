import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase-server";
import { checkRateLimitDetailed, RateLimitResponse } from "@/lib/rate-limit";
import { AbuseGuardResponse, enforceAbuseGuard } from "@/lib/security/abuse-guards";
import { createTrustReport } from "@/lib/trust/services/reports";
import { moderateContent } from "@/lib/moderation/moderation.service";

const reportSchema = z.object({
  targetType: z.enum(["user", "listing", "conversation", "review"]),
  targetId: z.string().min(2).max(160),
  category: z.string().trim().min(2).max(64),
  description: z.string().trim().min(4).max(2000).optional(),
  evidenceUrls: z.array(z.string().url()).max(8).optional(),
});

function computePriorityFromCategory(category: string) {
  const normalized = category.toLowerCase();
  if (["scam", "phishing", "off_platform_payment", "fake_listing"].includes(normalized)) return 5;
  if (["spam", "abuse", "impersonation"].includes(normalized)) return 4;
  return 3;
}

function computeRiskLevelFromCategory(category: string) {
  const normalized = category.toLowerCase();
  if (["scam", "phishing", "off_platform_payment", "fake_listing"].includes(normalized)) return "high" as const;
  if (["spam", "abuse", "impersonation"].includes(normalized)) return "medium" as const;
  return "medium" as const;
}

export async function POST(request: Request) {
  const rateLimit = checkRateLimitDetailed(request, { action: "trust_report_create" });
  if (!rateLimit.allowed) {
    return RateLimitResponse(rateLimit);
  }

  const abuseGuard = await enforceAbuseGuard({
    request,
    action: "trust_report_create",
    endpointGroup: "trust_safety",
  });
  if (!abuseGuard.allowed) {
    return AbuseGuardResponse(abuseGuard);
  }

  const parsed = reportSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid report payload" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const payload = parsed.data;
  const reportTextModeration = await moderateContent({
    targetType: "report_text",
    text: payload.description || "",
    actorId: user.id,
    entityId: payload.targetId,
    context: {
      pathname: "/api/trust/report",
      source: "route_handler",
      endpointTag: "trust_report",
    },
  });

  if (reportTextModeration.shouldBlock) {
    return NextResponse.json(
      {
        ok: false,
        code: "PUBLIC_CONTENT_POLICY_VIOLATION",
        error: reportTextModeration.userMessage,
        reasonCodes: reportTextModeration.reasonCodes,
      },
      { status: 400 }
    );
  }

  const result = await createTrustReport({
    reporterId: user.id,
    targetType: payload.targetType,
    targetId: payload.targetId,
    category: payload.category,
    description: reportTextModeration.sanitizedText || null,
    evidenceUrls: payload.evidenceUrls || [],
    riskLevel: computeRiskLevelFromCategory(payload.category),
    priority: computePriorityFromCategory(payload.category),
  });

  return NextResponse.json({
    ok: true,
    reportId: result.reportId,
    moderationCaseId: result.caseId,
    message:
      reportTextModeration.decision === "review"
        ? "Il contenuto è stato inviato e sarà verificato prima della pubblicazione."
        : "Operazione completata.",
    moderation: {
      decision: reportTextModeration.decision,
      reasonCodes: reportTextModeration.reasonCodes,
    },
  });
}
