import { NextResponse } from "next/server";
import { createClient } from "@/lib/infra/supabase/supabase-server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ wallets: [] });
  }

  const { data, error } = await supabase
    .from("wallets")
    .select("id,address,chain,provider,verified_at,created_at,updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Unable to load wallets" }, { status: 500 });
  }

  return NextResponse.json({
    wallets: data ?? [],
  });
}


