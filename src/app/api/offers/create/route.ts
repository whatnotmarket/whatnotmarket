import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { checkRateLimitDetailed, RateLimitResponse } from "@/lib/rate-limit";
import { AbuseGuardResponse, enforceAbuseGuard } from "@/lib/security/abuse-guards";
import { enforceActionGuard } from "@/lib/trust/services/onboarding-security";
import { evaluateAndPersistUserRisk } from "@/lib/trust/services/user-risk-service";
import { moderateContent } from "@/lib/moderation/moderation.service";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function POST(req: Request) {
  try {
    const preAuthLimit = checkRateLimitDetailed(req, { action: "offer_create" });
    if (!preAuthLimit.allowed) {
      return RateLimitResponse(preAuthLimit);
    }

    const { requestId, price, message } = await req.json();

    if (!requestId || !isUuid(requestId)) {
      return NextResponse.json({ ok: false, error: "Invalid request id" }, { status: 400 });
    }

    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      return NextResponse.json({ ok: false, error: "Invalid price" }, { status: 400 });
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
      action: "offer_create",
      identifier: user.id,
    });
    if (!userLimit.allowed) {
      return RateLimitResponse(userLimit);
    }

    const userAbuse = await enforceAbuseGuard({
      request: req,
      action: "offer_create",
      endpointGroup: "marketplace",
      userId: user.id,
    });
    if (!userAbuse.allowed) {
      return AbuseGuardResponse(userAbuse);
    }

    const actionGuard = await enforceActionGuard(user.id, "create_offer");
    if (!actionGuard.allowed) {
      return NextResponse.json(
        {
          ok: false,
          code: actionGuard.code,
          error: actionGuard.message || "Offer blocked by trust policy",
        },
        { status: 403 }
      );
    }

    const userRisk = await evaluateAndPersistUserRisk(user.id);
    if (userRisk.policy.blocked) {
      return NextResponse.json(
        {
          ok: false,
          code: "ACCOUNT_RISK_BLOCKED",
          error: userRisk.policy.userMessage || "Account temporarily blocked",
          reasonCodes: userRisk.score.reasonCodes,
        },
        { status: 403 }
      );
    }

    const { data: request, error: requestError } = await supabase
      .from("requests")
      .select("id, created_by, status, safety_status")
      .eq("id", requestId)
      .single();

    if (requestError || !request) {
      return NextResponse.json({ ok: false, error: "Request not found" }, { status: 404 });
    }

    if (request.status !== "open") {
      return NextResponse.json({ ok: false, error: "Request is not open" }, { status: 409 });
    }

    if (request.safety_status && request.safety_status !== "published") {
      return NextResponse.json(
        { ok: false, error: "This listing is under safety review and cannot receive offers yet" },
        { status: 409 }
      );
    }

    if (request.created_by === user.id) {
      return NextResponse.json(
        { ok: false, error: "You cannot send an offer to your own request" },
        { status: 403 }
      );
    }

    const rawMessage = typeof message === "string" ? message.trim() : "";
    const offerMessageModeration = await moderateContent({
      targetType: "marketplace_content",
      text: rawMessage,
      actorId: user.id,
      entityId: requestId,
      context: {
        pathname: "/api/offers/create",
        source: "route_handler",
        endpointTag: "offers_create",
      },
    });

    if (offerMessageModeration.shouldBlock) {
      return NextResponse.json(
        {
          ok: false,
          code: "PUBLIC_CONTENT_POLICY_VIOLATION",
          error: offerMessageModeration.userMessage,
          reasonCodes: offerMessageModeration.reasonCodes,
        },
        { status: 400 }
      );
    }

    const { data: offer, error: insertError } = await supabase
      .from("offers")
      .insert({
        request_id: requestId,
        price: numericPrice,
        message: offerMessageModeration.sanitizedText,
        created_by: user.id,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError || !offer) {
      return NextResponse.json({ ok: false, error: "Failed to create offer" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      offerId: offer.id,
      moderation: {
        decision: offerMessageModeration.decision,
        reasonCodes: offerMessageModeration.reasonCodes,
        message: offerMessageModeration.userMessage,
      },
    });
  } catch (error) {
    console.error("Offer create error:", error);
    return NextResponse.json({ ok: false, error: "Unexpected server error" }, { status: 500 });
  }
}
