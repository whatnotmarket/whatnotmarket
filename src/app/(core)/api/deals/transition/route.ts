import { AbuseGuardResponse,enforceAbuseGuard } from "@/lib/domains/security/abuse-guards";
import {
evaluateDealTransition,
type DealTransitionResolution,
} from "@/lib/domains/security/deal-guards";
import { checkRateLimitDetailed,RateLimitResponse } from "@/lib/infra/security/rate-limit";
import { createAdminClient } from "@/lib/infra/supabase/supabase-admin";
import { createClient } from "@/lib/infra/supabase/supabase-server";
import type { DealStatus } from "@/types/trade";
import { NextResponse } from "next/server";
import { z } from "zod";

const transitionActions = [
  "accept",
  "reject",
  "counter",
  "cancel",
  "fund_escrow",
  "mark_shipped",
  "complete",
  "open_dispute",
  "resolve_dispute",
] as const;

const transitionSchema = z.object({
  dealId: z.string().uuid(),
  action: z.enum(transitionActions),
  price: z.number().positive().optional(),
  offerToken: z.string().trim().min(2).max(12).optional(),
  paymentType: z.enum(["crypto", "fiat"]).optional(),
  fiatMethod: z.string().trim().max(64).optional(),
  resolution: z.enum(["completed", "cancelled"]).optional(),
});

type DealRow = {
  id: string;
  buyer_id: string;
  seller_id: string;
  status: string;
  sender_id: string | null;
  last_action_by: string | null;
};

export async function POST(request: Request) {
  const preAuthLimit = checkRateLimitDetailed(request, { action: "deal_transition" });
  if (!preAuthLimit.allowed) {
    return RateLimitResponse(preAuthLimit);
  }

  const parsed = transitionSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid deal transition payload" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userLimit = checkRateLimitDetailed(request, {
    action: "deal_transition",
    identifier: user.id,
  });
  if (!userLimit.allowed) {
    return RateLimitResponse(userLimit);
  }

  const userAbuse = await enforceAbuseGuard({
    request,
    action: "deal_transition",
    endpointGroup: "commerce",
    userId: user.id,
  });
  if (!userAbuse.allowed) {
    return AbuseGuardResponse(userAbuse);
  }

  const admin = createAdminClient();
  const { data: actorProfile } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle<{ is_admin: boolean }>();
  const isAdmin = actorProfile?.is_admin === true;

  const { data: deal, error: dealError } = await admin
    .from("deals")
    .select("id,buyer_id,seller_id,status,sender_id,last_action_by")
    .eq("id", parsed.data.dealId)
    .maybeSingle<DealRow>();

  if (dealError || !deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  const transitionDecision = evaluateDealTransition({
    deal: {
      buyer_id: deal.buyer_id,
      seller_id: deal.seller_id,
      status: deal.status as DealStatus,
      sender_id: deal.sender_id,
      last_action_by: deal.last_action_by,
    },
    actorId: user.id,
    action: parsed.data.action,
    isAdmin,
    resolution: parsed.data.resolution as DealTransitionResolution | undefined,
  });

  if (!transitionDecision.allowed) {
    return NextResponse.json({ error: transitionDecision.reason }, { status: 403 });
  }

  const patch: Record<string, unknown> = {
    status: transitionDecision.nextStatus,
    last_action_by: user.id,
  };

  if (parsed.data.action === "counter") {
    if (!parsed.data.price) {
      return NextResponse.json({ error: "Counter offer requires a positive price" }, { status: 400 });
    }

    const paymentType = parsed.data.paymentType ?? "crypto";
    patch.price = parsed.data.price;
    patch.payment_type = paymentType;
    patch.token_symbol =
      paymentType === "fiat"
        ? "USD"
        : (parsed.data.offerToken || "SOL").toUpperCase();
    patch.fiat_method = paymentType === "fiat" ? parsed.data.fiatMethod ?? null : null;
    patch.sender_id = user.id;
  }

  const { data: updatedDeal, error: updateError } = await admin
    .from("deals")
    .update(patch)
    .eq("id", deal.id)
    .select("*")
    .single();

  if (updateError || !updatedDeal) {
    return NextResponse.json({ error: "Unable to transition deal state" }, { status: 500 });
  }

  return NextResponse.json({ deal: updatedDeal });
}

