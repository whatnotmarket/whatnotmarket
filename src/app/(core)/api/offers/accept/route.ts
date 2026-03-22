import { AbuseGuardResponse,enforceAbuseGuard } from "@/lib/domains/security/abuse-guards";
import { checkRateLimitDetailed,RateLimitResponse } from "@/lib/infra/security/rate-limit";
import { createClient } from "@/lib/infra/supabase/supabase-server";
import { NextResponse } from "next/server";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function POST(req: Request) {
  try {
    const preAuthLimit = checkRateLimitDetailed(req, { action: "offer_accept" });
    if (!preAuthLimit.allowed) {
      return RateLimitResponse(preAuthLimit);
    }

    const { offerId } = await req.json();

    if (!offerId || !isUuid(offerId)) {
      return NextResponse.json({ ok: false, error: "Invalid offer id" }, { status: 400 });
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const userLimit = checkRateLimitDetailed(req, {
      action: "offer_accept",
      identifier: user.id,
    });
    if (!userLimit.allowed) {
      return RateLimitResponse(userLimit);
    }

    const userAbuse = await enforceAbuseGuard({
      request: req,
      action: "offer_accept",
      endpointGroup: "marketplace",
      userId: user.id,
    });
    if (!userAbuse.allowed) {
      return AbuseGuardResponse(userAbuse);
    }

    const { data: dealId, error: rpcError } = await supabase.rpc("accept_offer_and_open_chat", {
      p_offer_id: offerId,
    });

    if (rpcError || !dealId) {
      return NextResponse.json(
        {
          ok: false,
          error: rpcError?.message || "Failed to accept offer",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({ ok: true, dealId });
  } catch (error) {
    console.error("Offer accept error:", error);
    return NextResponse.json({ ok: false, error: "Unexpected server error" }, { status: 500 });
  }
}

