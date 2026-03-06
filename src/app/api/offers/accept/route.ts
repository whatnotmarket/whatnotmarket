import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function POST(req: Request) {
  try {
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
