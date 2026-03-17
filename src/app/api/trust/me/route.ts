import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getTrustAccountState } from "@/lib/trust/services/trust-store";
import { evaluateAndPersistUserRisk } from "@/lib/trust/services/user-risk-service";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const [state, riskEvaluation] = await Promise.all([
    getTrustAccountState(user.id),
    evaluateAndPersistUserRisk(user.id),
  ]);

  return NextResponse.json({
    ok: true,
    trust: {
      accountFlag: state.accountFlag,
      trustScore: state.trustScore,
      riskScore: riskEvaluation.score.score,
      riskLevel: riskEvaluation.score.level,
      reasonCodes: riskEvaluation.score.reasonCodes,
      requiresVerification: riskEvaluation.policy.requiresVerification,
      requiresManualReview: riskEvaluation.policy.requiresManualReview,
    },
  });
}
