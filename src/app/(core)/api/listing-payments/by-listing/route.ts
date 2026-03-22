import { NextResponse } from "next/server";
import { createClient } from "@/lib/infra/supabase/supabase-server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const listingId = String(url.searchParams.get("listingId") ?? "").trim();

  if (!listingId) {
    return NextResponse.json({ payments: [] });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ payments: [] });
  }

  const { data, error } = await supabase
    .from("listing_payments")
    .select("*")
    .eq("listing_id", listingId)
    .eq("payer_user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Unable to load listing payments" }, { status: 500 });
  }

  return NextResponse.json({
    payments: data ?? [],
  });
}


