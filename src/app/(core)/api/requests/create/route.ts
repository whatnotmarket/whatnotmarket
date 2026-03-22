import { submitToIndexNow } from "@/lib/app/seo/indexnow";
import { revalidateMarketplaceSitemaps } from "@/lib/app/seo/sitemaps";
import { moderateContent } from "@/lib/domains/moderation/moderation.service";
import { AbuseGuardResponse,enforceAbuseGuard } from "@/lib/domains/security/abuse-guards";
import {
persistListingSafetyDecision,
validateListingBeforePublish,
} from "@/lib/domains/trust/services/listing-safety";
import { enforceActionGuard } from "@/lib/domains/trust/services/onboarding-security";
import { appendTrustAuditLog } from "@/lib/domains/trust/services/trust-store";
import { evaluateAndPersistUserRisk } from "@/lib/domains/trust/services/user-risk-service";
import { getClientIp,getRequestDeviceHint,hashSignal } from "@/lib/domains/trust/utils";
import { checkRateLimitDetailed,RateLimitResponse } from "@/lib/infra/security/rate-limit";
import { createClient } from "@/lib/infra/supabase/supabase-server";
import { NextResponse } from "next/server";

type CreateRequestPayload = {
  title?: string;
  category?: string;
  condition?: string;
  budgetMin?: number;
  budgetMax?: number;
  paymentMethod?: string;
  deliveryTime?: string;
  description?: string;
};

export async function POST(req: Request) {
  try {
    const preAuthLimit = checkRateLimitDetailed(req, { action: "request_create" });
    if (!preAuthLimit.allowed) {
      return RateLimitResponse(preAuthLimit);
    }

    const payload = (await req.json()) as CreateRequestPayload;

    const title = typeof payload.title === "string" ? payload.title.trim() : "";
    const category = typeof payload.category === "string" ? payload.category.trim() : "";
    const condition = typeof payload.condition === "string" ? payload.condition.trim() : "";
    const description = typeof payload.description === "string" ? payload.description.trim() : "";
    const paymentMethod = typeof payload.paymentMethod === "string" ? payload.paymentMethod.trim() : "";
    const deliveryTime = typeof payload.deliveryTime === "string" ? payload.deliveryTime.trim() : "";

    const budgetMin = Number(payload.budgetMin);
    const budgetMax = Number(payload.budgetMax);

    if (title.length < 5) {
      return NextResponse.json({ ok: false, error: "Title is too short" }, { status: 400 });
    }

    if (!category) {
      return NextResponse.json({ ok: false, error: "Category is required" }, { status: 400 });
    }

    if (!condition) {
      return NextResponse.json({ ok: false, error: "Condition is required" }, { status: 400 });
    }

    if (description.length < 10) {
      return NextResponse.json({ ok: false, error: "Description is too short" }, { status: 400 });
    }

    if (!Number.isFinite(budgetMin) || !Number.isFinite(budgetMax) || budgetMin < 0 || budgetMax < 0) {
      return NextResponse.json({ ok: false, error: "Invalid budget values" }, { status: 400 });
    }

    if (budgetMax < budgetMin) {
      return NextResponse.json({ ok: false, error: "Max budget cannot be lower than min budget" }, { status: 400 });
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
      action: "request_create",
      identifier: user.id,
    });
    if (!userLimit.allowed) {
      return RateLimitResponse(userLimit);
    }

    const userAbuse = await enforceAbuseGuard({
      request: req,
      action: "request_create",
      endpointGroup: "marketplace",
      userId: user.id,
    });
    if (!userAbuse.allowed) {
      return AbuseGuardResponse(userAbuse);
    }

    const actionGuard = await enforceActionGuard(user.id, "create_listing");
    if (!actionGuard.allowed) {
      return NextResponse.json(
        {
          ok: false,
          code: actionGuard.code,
          error: actionGuard.message || "Action blocked by trust policy",
        },
        { status: 403 }
      );
    }

    const [titleModeration, descriptionModeration] = await Promise.all([
      moderateContent({
        targetType: "listing_title",
        text: title,
        actorId: user.id,
        context: {
          pathname: "/api/requests/create",
          source: "route_handler",
          endpointTag: "requests_create",
        },
      }),
      moderateContent({
        targetType: "listing_description",
        text: description,
        actorId: user.id,
        context: {
          pathname: "/api/requests/create",
          source: "route_handler",
          endpointTag: "requests_create",
        },
      }),
    ]);

    const blockingModeration = [titleModeration, descriptionModeration].find((result) => result.shouldBlock);
    if (blockingModeration) {
      return NextResponse.json(
        {
          ok: false,
          code: "PUBLIC_CONTENT_POLICY_VIOLATION",
          error: blockingModeration.userMessage,
          reasonCodes: blockingModeration.reasonCodes,
        },
        { status: 400 }
      );
    }

    const sanitizedTitle = titleModeration.sanitizedText;
    const sanitizedDescription = descriptionModeration.sanitizedText;
    const moderationRequiresReview = [titleModeration, descriptionModeration].some((result) => result.shouldReview);
    const moderationReasonCodes = Array.from(
      new Set([...titleModeration.reasonCodes, ...descriptionModeration.reasonCodes])
    );

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

    const listingRisk = await validateListingBeforePublish({
      userId: user.id,
      listing: {
        title: sanitizedTitle,
        category,
        budgetMin,
        budgetMax,
        description: sanitizedDescription,
      },
      accountAgeHours: userRisk.signals.accountAgeHours,
      listingVelocityLast24h: userRisk.signals.listingsCreatedLast24h + 1,
    });

    if (listingRisk.decision.blocked) {
      await appendTrustAuditLog({
        actorUserId: user.id,
        eventType: "listing_create_blocked",
        targetType: "listing",
        reasonCodes: listingRisk.score.reasonCodes,
        ipHash: hashSignal(getClientIp(req)),
        deviceHash: hashSignal(getRequestDeviceHint(req)),
        metadata: {
          score: listingRisk.score.score,
          level: listingRisk.score.level,
          action: listingRisk.decision.action,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          code: "LISTING_BLOCKED",
          error: listingRisk.decision.userMessage || "Listing blocked for security reasons",
          reasonCodes: listingRisk.score.reasonCodes,
        },
        { status: 403 }
      );
    }

    const finalListingSafetyStatus = moderationRequiresReview
      ? "pending_review"
      : listingRisk.decision.listingSafetyStatus;
    const finalVisibilityState = moderationRequiresReview ? "limited" : listingRisk.decision.visibilityState;
    const combinedReasonCodes = Array.from(
      new Set([...listingRisk.score.reasonCodes, ...moderationReasonCodes])
    );

    const insertPayload: Record<string, unknown> = {
      title: sanitizedTitle,
      category,
      condition,
      budget_min: budgetMin,
      budget_max: budgetMax,
      payment_method: paymentMethod || null,
      delivery_time: deliveryTime || null,
      description: sanitizedDescription,
      created_by: user.id,
      status: "open",
      safety_status: finalListingSafetyStatus,
      visibility_state: finalVisibilityState,
      trust_reason_codes: combinedReasonCodes,
      last_risk_score: listingRisk.score.score,
      moderation_notes: listingRisk.decision.warningMessage || null,
    };

    let { data, error } = await supabase.from("requests").insert(insertPayload).select("id").single();

    if (error && /Could not find the '([^']+)' column/.test(String(error.message || ""))) {
      delete insertPayload.safety_status;
      delete insertPayload.visibility_state;
      delete insertPayload.trust_reason_codes;
      delete insertPayload.last_risk_score;
      delete insertPayload.moderation_notes;

      const fallback = await supabase.from("requests").insert(insertPayload).select("id").single();
      data = fallback.data;
      error = fallback.error;
    }

    if (error || !data) {
      console.error("Create request error:", error);
      return NextResponse.json({ ok: false, error: "Failed to create request" }, { status: 500 });
    }

    await persistListingSafetyDecision({
      listingId: data.id,
      userId: user.id,
      score: listingRisk.score,
      decision: {
        ...listingRisk.decision,
        action: moderationRequiresReview ? "PENDING_REVIEW" : listingRisk.decision.action,
        listingSafetyStatus: finalListingSafetyStatus,
        visibilityState: finalVisibilityState,
      },
      signals: listingRisk.signals,
    }).catch((persistError) => {
      console.error("Failed to persist listing trust decision", persistError);
    });

    // Submit to IndexNow in background (non-blocking)
    if (data?.id) {
      submitToIndexNow(`/requests/${data.id}`).catch((err) =>
        console.error("IndexNow background submit error:", err)
      );
    }

    revalidateMarketplaceSitemaps();

    return NextResponse.json({
      ok: true,
      requestId: data.id,
      listingSafetyStatus: listingRisk.decision.listingSafetyStatus,
      trust: {
        riskScore: listingRisk.score.score,
        riskLevel: listingRisk.score.level,
        reasonCodes: combinedReasonCodes,
      },
      message:
        finalListingSafetyStatus === "pending_review"
          ? "Annuncio inviato in review manuale."
          : finalListingSafetyStatus === "restricted"
            ? "Annuncio pubblicato con visibilita ridotta."
            : "Annuncio pubblicato.",
    });
  } catch (error) {
    console.error("Create request unexpected error:", error);
    return NextResponse.json({ ok: false, error: "Unexpected server error" }, { status: 500 });
  }
}

