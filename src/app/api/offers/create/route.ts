import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function POST(req: Request) {
  try {
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

    const { data: request, error: requestError } = await supabase
      .from("requests")
      .select("id, created_by, status")
      .eq("id", requestId)
      .single();

    if (requestError || !request) {
      return NextResponse.json({ ok: false, error: "Request not found" }, { status: 404 });
    }

    if (request.status !== "open") {
      return NextResponse.json({ ok: false, error: "Request is not open" }, { status: 409 });
    }

    if (request.created_by === user.id) {
      return NextResponse.json(
        { ok: false, error: "You cannot send an offer to your own request" },
        { status: 403 }
      );
    }

    const { data: offer, error: insertError } = await supabase
      .from("offers")
      .insert({
        request_id: requestId,
        price: numericPrice,
        message: typeof message === "string" ? message.trim() : "",
        created_by: user.id,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError || !offer) {
      return NextResponse.json({ ok: false, error: "Failed to create offer" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, offerId: offer.id });
  } catch (error) {
    console.error("Offer create error:", error);
    return NextResponse.json({ ok: false, error: "Unexpected server error" }, { status: 500 });
  }
}
