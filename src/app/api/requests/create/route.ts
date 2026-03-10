import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { checkRateLimitDetailed, RateLimitResponse } from "@/lib/rate-limit";
import { AbuseGuardResponse, enforceAbuseGuard } from "@/lib/security/abuse-guards";

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

    const { data, error } = await supabase
      .from("requests")
      .insert({
        title,
        category,
        condition,
        budget_min: budgetMin,
        budget_max: budgetMax,
        payment_method: paymentMethod || null,
        delivery_time: deliveryTime || null,
        description,
        created_by: user.id,
        status: "open",
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("Create request error:", error);
      return NextResponse.json({ ok: false, error: "Failed to create request" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, requestId: data.id });
  } catch (error) {
    console.error("Create request unexpected error:", error);
    return NextResponse.json({ ok: false, error: "Unexpected server error" }, { status: 500 });
  }
}

