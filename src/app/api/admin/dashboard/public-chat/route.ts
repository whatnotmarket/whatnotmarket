import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { assertAdminRequest } from "@/lib/admin-auth";

function asString(v: unknown) {
  const s = String(v ?? "").trim();
  return s || "";
}

function isTableMissing(message: string | null | undefined) {
  const m = String(message || "").toLowerCase();
  return m.includes("relation") && m.includes("does not exist");
}

export async function GET(request: NextRequest) {
  try {
    await assertAdminRequest(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Supabase admin connection is not configured" },
      { status: 500 }
    );
  }

  const room = asString(request.nextUrl.searchParams.get("room"));
  const q = asString(request.nextUrl.searchParams.get("q")).toLowerCase();
  const limit = Number(request.nextUrl.searchParams.get("limit") || "200");
  const userIdParam = asString(request.nextUrl.searchParams.get("userId"));

  let query = admin
    .from("global_chat_messages")
    .select("id,user_id,room,message,created_at,reply_to_id,is_deleted,profiles!global_chat_messages_user_id_fkey(username,full_name,avatar_url)")
    .order("created_at", { ascending: false })
    .limit(Math.max(50, Math.min(limit, 500)));

  if (room) query = query.eq("room", room);

  const { data, error } = await query;
  if (error) {
    if (isTableMissing(error.message)) {
      return NextResponse.json(
        { error: "global_chat_messages table is missing. Run latest migrations.", messages: [] },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const messagesRaw = (data || []);
  const messages = messagesRaw.filter((row) => {
    if (!q) return true;
    const text = String(row.message || "").toLowerCase();
    const uname = String((row as any).profiles?.username || "").toLowerCase();
    const fname = String((row as any).profiles?.full_name || "").toLowerCase();
    return text.includes(q) || uname.includes(q) || fname.includes(q);
  });

  // Room state
  let roomState: { slow_mode_seconds: number; closed_until: string | null } | null = null;
  if (room) {
    const { data: stateRow } = await admin
      .from("global_chat_room_state")
      .select("slow_mode_seconds,closed_until")
      .eq("room_slug", room)
      .maybeSingle<{ slow_mode_seconds: number; closed_until: string | null }>();
    if (stateRow) {
      roomState = { slow_mode_seconds: Number(stateRow.slow_mode_seconds || 0), closed_until: stateRow.closed_until || null };
    }
  }

  // Blocked phrases for flagging
  const { data: blocked } = await admin
    .from("global_chat_blocked_phrases")
    .select("phrase")
    .eq("is_active", true);
  const phrases = (blocked || []).map((row) => String((row as any).phrase || "").toLowerCase()).filter(Boolean);

  // Add flagged
  const flaggedMessages = messages.map((row) => {
    const text = String(row.message || "").toLowerCase();
    const flagged = phrases.some((p) => p && text.includes(p));
    return { ...row, flagged };
  });

  // Active users (last 15 minutes)
  let activeUsers: Array<{ user_id: string; username: string | null; full_name: string | null; last_message_at: string; messages_count: number; status: "online" | "muted" | "banned" | "unknown" }> = [];
  {
    const sinceIso = new Date(Date.now() - 15 * 60_000).toISOString();
    let base = admin
      .from("global_chat_messages")
      .select("user_id,created_at,profiles!global_chat_messages_user_id_fkey(username,full_name)")
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .limit(2000);
    if (room) base = base.eq("room", room);
    const { data: recent } = await base;
    const map = new Map<string, { count: number; last: string; profile: { username: string | null; full_name: string | null } }>();
    (recent || []).forEach((row) => {
      const uid = String((row as any).user_id);
      const last = String((row as any).created_at);
      const profile = (row as any).profiles || {};
      const prev = map.get(uid);
      if (!prev) {
        map.set(uid, { count: 1, last, profile: { username: profile?.username || null, full_name: profile?.full_name || null } });
      } else {
        prev.count += 1;
        if (new Date(last).getTime() > new Date(prev.last).getTime()) prev.last = last;
      }
    });
    const ids = Array.from(map.keys());
    let statuses: Record<string, "online" | "muted" | "banned" | "unknown"> = {};
    if (ids.length > 0) {
      const { data: controls } = await admin
        .from("global_chat_user_controls")
        .select("user_id,is_muted,muted_until,is_banned,banned_until")
        .in("user_id", ids);
      (controls || []).forEach((row) => {
        const uid = String((row as any).user_id);
        const isMuted = Boolean((row as any).is_muted) || Boolean((row as any).muted_until);
        const isBanned = Boolean((row as any).is_banned) || Boolean((row as any).banned_until);
        statuses[uid] = isBanned ? "banned" : isMuted ? "muted" : "online";
      });
    }
    activeUsers = ids.map((uid) => {
      const entry = map.get(uid)!;
      return {
        user_id: uid,
        username: entry.profile.username,
        full_name: entry.profile.full_name,
        last_message_at: entry.last,
        messages_count: entry.count,
        status: statuses[uid] || "online",
      };
    });
  }

  // Optional user history
  let userHistory: Array<{ id: string; message: string; created_at: string; is_deleted: boolean }> = [];
  if (userIdParam) {
    const { data: hist } = await admin
      .from("global_chat_messages")
      .select("id,message,created_at,is_deleted")
      .eq("user_id", userIdParam)
      .order("created_at", { ascending: false })
      .limit(200);
    userHistory = (hist || []) as any;
  }

  return NextResponse.json({ messages: flaggedMessages, activeUsers, roomState, userHistory });
}

type AdminActionPayload = {
  action?: "delete_message" | "ban_message" | "mute_user" | "ban_user";
  messageId?: string;
  userId?: string;
  room?: string;
  reason?: string;
  muteMinutes?: number;
};

export async function POST(request: NextRequest) {
  try {
    await assertAdminRequest(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Supabase admin connection is not configured" },
      { status: 500 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as AdminActionPayload;
  const action = asString(body.action);
  const messageId = asString(body.messageId);
  const userId = asString(body.userId);
  const reason = asString(body.reason || "moderation");
  const muteMinutes = Number(body.muteMinutes || 60);

  if (!action) {
    return NextResponse.json({ error: "action is required" }, { status: 400 });
  }

  try {
    if (action === "delete_message" || action === "ban_message") {
      if (!messageId) return NextResponse.json({ error: "messageId is required" }, { status: 400 });
      const { data, error } = await admin
        .from("global_chat_messages")
        .update({ is_deleted: true })
        .eq("id", messageId)
        .select("id,user_id,room,message")
        .maybeSingle();
      if (error) throw error;
      await admin.from("global_chat_moderation_logs").insert({
        user_id: data?.user_id || null,
        room: data?.room || null,
        message: data?.message || null,
        code: action === "ban_message" ? "ADMIN_BAN_MESSAGE" : "ADMIN_DELETE_MESSAGE",
        reason,
        metadata: { message_id: messageId },
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "mute_user") {
      if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });
      const until = new Date(Date.now() + Math.max(1, muteMinutes) * 60_000).toISOString();
      const { error } = await admin
        .from("global_chat_user_controls")
        .upsert({
          user_id: userId,
          is_muted: true,
          muted_until: until,
        }, { onConflict: "user_id" });
      if (error) throw error;
      await admin.from("global_chat_moderation_logs").insert({
        user_id: userId,
        code: "ADMIN_MUTE_USER",
        reason,
        metadata: { muted_until: until },
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "ban_user") {
      if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });
      const { error } = await admin
        .from("global_chat_user_controls")
        .upsert({
          user_id: userId,
          is_banned: true,
          banned_until: null,
        }, { onConflict: "user_id" });
      if (error) throw error;
      const { error: delErr } = await admin
        .from("global_chat_messages")
        .update({ is_deleted: true })
        .eq("user_id", userId);
      if (delErr) throw delErr;
      await admin.from("global_chat_moderation_logs").insert({
        user_id: userId,
        code: "ADMIN_BAN_USER",
        reason,
        metadata: { deleted_all_messages: true },
      });
      return NextResponse.json({ ok: true });
    }
    if (action === "unmute_user") {
      if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });
      const { error } = await admin
        .from("global_chat_user_controls")
        .upsert({
          user_id: userId,
          is_muted: false,
          muted_until: null,
        }, { onConflict: "user_id" });
      if (error) throw error;
      await admin.from("global_chat_moderation_logs").insert({
        user_id: userId,
        code: "ADMIN_UNMUTE_USER",
        reason,
      });
      return NextResponse.json({ ok: true });
    }
    if (action === "unban_user") {
      if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });
      const { error } = await admin
        .from("global_chat_user_controls")
        .upsert({
          user_id: userId,
          is_banned: false,
          banned_until: null,
        }, { onConflict: "user_id" });
      if (error) throw error;
      await admin.from("global_chat_moderation_logs").insert({
        user_id: userId,
        code: "ADMIN_UNBAN_USER",
        reason,
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (isTableMissing(msg)) {
      return NextResponse.json({ error: "Required tables are missing. Run latest migrations." }, { status: 500 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
