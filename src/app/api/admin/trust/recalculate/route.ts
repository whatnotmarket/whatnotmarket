import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { assertAdminRequest } from "@/lib/admin-auth";
import { runTrustRiskRecalculationWorker } from "@/lib/trust/workers/recalculate-risk";

export async function POST(request: NextRequest) {
  try {
    await assertAdminRequest(request);
  } catch {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const limitParam = Number(request.nextUrl.searchParams.get("limit") || "120");
  const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(500, limitParam)) : 120;

  const result = await runTrustRiskRecalculationWorker(limit);
  return NextResponse.json({
    ok: true,
    worker: result,
  });
}
