import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import {
  buildAuthError,
  buildBanError,
  buildDuplicateError,
  buildFloodError,
  buildMuteError,
  type ModerationError,
  validateMessageShape,
} from "@/lib/chat/global-chat-moderation";
import { z } from "zod";

const postSchema = z.object({
  room: z.string().trim().min(1),
  message: z.string(),
  replyToId: z.string().uuid().nullable().optional(),
  mentions: z.array(z.string().trim().regex(/^[a-zA-Z0-9_]{1,30}$/)).max(20).optional(),
});

type RoomRow = {
  slug: string;
  is_active: boolean;
};

type UserControlRow = {
  user_id: string;
  is_muted: boolean;
  muted_until: string | null;
  is_banned: boolean;
  banned_until: string | null;
  moderator_override: boolean;
};

type PhraseRow = {
  phrase: string;
};

type ReplyTargetRow = {
  id: string;
  room: string;
};

function extractMentionHandles(message: string) {
  const mentions = new Set<string>();
  const mentionRegex = /@([a-zA-Z0-9_]{1,30})/g;

  let match = mentionRegex.exec(message);
  while (match) {
    const rawHandle = match[1];
    if (rawHandle) {
      mentions.add(rawHandle.toLowerCase());
    }
    match = mentionRegex.exec(message);
  }

  return Array.from(mentions).slice(0, 20);
}

function statusCodeForError(error: ModerationError) {
  switch (error.code) {
    case "AUTH_REQUIRED":
      return 401;
    case "BAN_ACTIVE":
    case "MUTE_ACTIVE":
      return 403;
    case "FLOOD_LIMIT":
    case "DUPLICATE_SPAM":
      return 429;
    default:
      return 400;
  }
}

async function logModerationRejection(input: {
  userId: string;
  room: string;
  message: string;
  code: string;
  reason: string;
}) {
  try {
    const admin = createAdminClient();
    await admin.from("global_chat_moderation_logs").insert({
      user_id: input.userId,
      room: input.room,
      message: input.message,
      code: input.code,
      reason: input.reason,
    });
  } catch {
    // Ignore log failures to avoid blocking the request lifecycle.
  }
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const error = buildAuthError();
    return NextResponse.json(error, { status: statusCodeForError(error) });
  }

  const body = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        code: "INVALID_PAYLOAD",
        message: "Invalid payload.",
      },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const room = parsed.data.room.trim().toLowerCase();
  const message = parsed.data.message;
  const replyToId = parsed.data.replyToId ?? null;
  const isThreadReply = Boolean(replyToId);

  const { data: roomRow } = await admin
    .from("global_chat_rooms")
    .select("slug,is_active")
    .eq("slug", room)
    .maybeSingle<RoomRow>();

  if (!roomRow || !roomRow.is_active) {
    return NextResponse.json(
      { ok: false, code: "INVALID_ROOM", message: "Invalid chat room." },
      { status: 400 }
    );
  }

  const [{ data: phraseRows }, { data: userControl }, { data: latestMessage }] = await Promise.all([
    admin.from("global_chat_blocked_phrases").select("phrase").eq("is_active", true),
    admin
      .from("global_chat_user_controls")
      .select("user_id,is_muted,muted_until,is_banned,banned_until,moderator_override")
      .eq("user_id", user.id)
      .maybeSingle<UserControlRow>(),
    admin
      .from("global_chat_messages")
      .select("created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ created_at: string }>(),
  ]);

  const now = Date.now();
  if (userControl && !userControl.moderator_override) {
    const bannedUntil = userControl.banned_until ? new Date(userControl.banned_until).getTime() : 0;
    const mutedUntil = userControl.muted_until ? new Date(userControl.muted_until).getTime() : 0;

    if (userControl.is_banned || (bannedUntil && bannedUntil > now)) {
      const error = buildBanError();
      await logModerationRejection({
        userId: user.id,
        room,
        message,
        code: error.code,
        reason: error.message,
      });
      return NextResponse.json(error, { status: statusCodeForError(error) });
    }

    if (userControl.is_muted || (mutedUntil && mutedUntil > now)) {
      const error = buildMuteError();
      await logModerationRejection({
        userId: user.id,
        room,
        message,
        code: error.code,
        reason: error.message,
      });
      return NextResponse.json(error, { status: statusCodeForError(error) });
    }
  }

  if (!isThreadReply && latestMessage?.created_at) {
    const diffMs = now - new Date(latestMessage.created_at).getTime();
    if (diffMs < 5000) {
      const error = buildFloodError();
      await logModerationRejection({
        userId: user.id,
        room,
        message,
        code: error.code,
        reason: error.message,
      });
      return NextResponse.json(error, { status: statusCodeForError(error) });
    }
  }

  const moderation = validateMessageShape({
    room,
    message,
    blockedPhrases: ((phraseRows || []) as PhraseRow[]).map((item) => item.phrase),
  });

  if (!moderation.ok) {
    await logModerationRejection({
      userId: user.id,
      room,
      message,
      code: moderation.code,
      reason: moderation.message,
    });
    return NextResponse.json(moderation, { status: statusCodeForError(moderation) });
  }

  if (!isThreadReply) {
    const sixtySecondsAgoIso = new Date(now - 60_000).toISOString();
    const { data: duplicate } = await admin
      .from("global_chat_messages")
      .select("id")
      .eq("user_id", user.id)
      .eq("room", moderation.room)
      .eq("message_normalized", moderation.normalizedMessage)
      .gte("created_at", sixtySecondsAgoIso)
      .limit(1)
      .maybeSingle<{ id: string }>();

    if (duplicate) {
      const error = buildDuplicateError();
      await logModerationRejection({
        userId: user.id,
        room,
        message,
        code: error.code,
        reason: error.message,
      });
      return NextResponse.json(error, { status: statusCodeForError(error) });
    }
  }

  if (replyToId) {
    const { data: replyTarget } = await admin
      .from("global_chat_messages")
      .select("id,room")
      .eq("id", replyToId)
      .maybeSingle<ReplyTargetRow>();

    if (!replyTarget || replyTarget.room !== moderation.room) {
      return NextResponse.json(
        {
          ok: false,
          code: "INVALID_REPLY_TARGET",
          message: "The selected message cannot be replied to in this room.",
        },
        { status: 400 }
      );
    }
  }

  const mentionedHandles = extractMentionHandles(message);

  const { data: inserted, error: insertError } = await admin
    .from("global_chat_messages")
    .insert({
      user_id: user.id,
      room: moderation.room,
      message: message.trim().replace(/\s+/g, " "),
      message_normalized: moderation.normalizedMessage,
      reply_to_id: replyToId,
      mentioned_handles: mentionedHandles,
    })
    .select("id,user_id,room,message,created_at,reply_to_id,mentioned_handles")
    .single();

  if (insertError) {
    return NextResponse.json(
      { ok: false, code: "INTERNAL_ERROR", message: "Unable to send message right now." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    data: inserted,
  });
}
