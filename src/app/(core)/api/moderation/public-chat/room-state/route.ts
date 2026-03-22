import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/infra/supabase/supabase-admin";
import { createClient } from "@/lib/infra/supabase/supabase-server";
import { assertAdminRequest } from "@/lib/domains/auth/admin-auth";

type Payload = {
  action?: "slow_mode" | "close" | "open";
  room?: string;
  seconds?: number;
  minutes?: number;
};

export async function POST(request: NextRequest) {
  let isAdmin = false;
  try {
    await assertAdminRequest(request);
    isAdmin = true;
  } catch {}
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let isModerator = false;
  if (user) {
    const { data: ctrl } = await supabase
      .from("global_chat_user_controls")
      .select("is_moderator,moderator_override")
      .eq("user_id", user.id)
      .maybeSingle<{ is_moderator: boolean; moderator_override: boolean }>();
    isModerator = Boolean(ctrl?.is_moderator) || Boolean(ctrl?.moderator_override);
  }
  if (!isAdmin && !isModerator) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();
  const body = (await request.json().catch(() => ({}))) as Payload;
  const action = String(body.action || "").trim();
  const room = String(body.room || "").trim().toLowerCase();
  if (!room) return NextResponse.json({ error: "room is required" }, { status: 400 });

  if (action === "slow_mode") {
    const seconds = Number(body.seconds || 0);
    const { error } = await admin
      .from("global_chat_room_state")
      .upsert({ room_slug: room, slow_mode_seconds: Math.max(0, seconds) }, { onConflict: "room_slug" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }
  if (action === "close") {
    const minutes = Number(body.minutes ?? 0);
    const untilIso =
      minutes > 0
        ? new Date(Date.now() + minutes * 60_000).toISOString()
        : "2099-12-31T00:00:00.000Z"; // permanent close until reopened
    const { error } = await admin
      .from("global_chat_room_state")
      .upsert({ room_slug: room, closed_until: untilIso }, { onConflict: "room_slug" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }
  if (action === "open") {
    const { error } = await admin
      .from("global_chat_room_state")
      .upsert({ room_slug: room, closed_until: null }, { onConflict: "room_slug" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

