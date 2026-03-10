import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import {
  containsDisallowedLink,
  isParticipantInRoom,
  normalizeChatContent,
} from "@/lib/security/chat-guards";
import { checkRateLimitDetailed, RateLimitResponse } from "@/lib/rate-limit";

const sendMessageSchema = z.object({
  roomName: z.string().min(1).max(120),
  content: z.string().min(1).max(2000),
  type: z.enum(["text", "audio", "system"]).default("text"),
  audioUrl: z.string().url().optional(),
  clientMessageId: z.string().uuid().optional(),
});

type ProfileRow = {
  id: string;
  full_name: string | null;
  username: string | null;
  seller_status: string | null;
  is_admin: boolean | null;
};

export async function POST(request: Request) {
  const parsed = sendMessageSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid message payload" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = checkRateLimitDetailed(request, {
    action: "chat_message_post",
    identifier: user.id,
  });
  if (!rateLimit.allowed) {
    return RateLimitResponse(rateLimit);
  }

  const normalizedContent = normalizeChatContent(parsed.data.content);
  if (!normalizedContent) {
    return NextResponse.json({ error: "Message content is empty" }, { status: 400 });
  }

  if (!isParticipantInRoom(parsed.data.roomName, user.id)) {
    return NextResponse.json({ error: "Invalid room membership" }, { status: 403 });
  }

  if ((parsed.data.type === "text" || parsed.data.type === "system") && containsDisallowedLink(normalizedContent)) {
    return NextResponse.json(
      { error: "Links are blocked in direct chat to reduce phishing risk" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id,full_name,username,seller_status,is_admin")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  const displayName = profile?.full_name || profile?.username || "User";
  const canonicalRole = profile?.is_admin
    ? "Admin"
    : profile?.seller_status === "verified"
      ? "Seller"
      : "Buyer";
  const canonicalVerified = profile?.is_admin === true || profile?.seller_status === "verified";

  const messageId = parsed.data.clientMessageId ?? randomUUID();
  const createdAt = new Date().toISOString();

  const { data: inserted, error: insertError } = await admin
    .from("chat_messages")
    .insert({
      id: messageId,
      room_id: parsed.data.roomName,
      sender_id: user.id,
      content: normalizedContent,
      type: parsed.data.type,
      metadata: {
        audioUrl: parsed.data.audioUrl ?? null,
        reactions: {},
        user_snapshot: {
          id: user.id,
          name: displayName,
          role: canonicalRole,
          isVerified: canonicalVerified,
        },
      },
      is_read: false,
      created_at: createdAt,
    })
    .select("id,content,type,metadata,is_read,is_deleted,created_at,sender_id")
    .single();

  if (insertError || !inserted) {
    return NextResponse.json({ error: "Unable to persist message" }, { status: 500 });
  }

  return NextResponse.json({
    message: {
      id: inserted.id,
      content: inserted.content,
      type: inserted.type || "text",
      audioUrl: inserted.metadata?.audioUrl ?? undefined,
      reactions: inserted.metadata?.reactions ?? {},
      createdAt: inserted.created_at,
      status: inserted.is_read ? "read" : "sent",
      is_deleted: inserted.is_deleted ?? false,
      user: {
        id: user.id,
        name: displayName,
        role: canonicalRole,
        isVerified: canonicalVerified,
      },
    },
  });
}
