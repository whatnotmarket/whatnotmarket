import { toast } from "@/lib/domains/notifications";
import { createClient } from "@/lib/infra/supabase/supabase";
import { useCallback,useEffect,useMemo,useRef,useState } from "react";

export interface ChatMessage {
  id: string;
  content: string;
  user: {
    id: string;
    name: string;
    isVerified?: boolean;
    role?: string;
  };
  createdAt: string;
  reactions?: Record<string, string[]>;
  type?: "text" | "audio" | "system";
  audioUrl?: string;
  status?: "sent" | "read";
  is_deleted?: boolean;
}

interface UseRealtimeChatProps {
  roomName: string;
  userId: string;
  username: string;
  isVerified?: boolean;
  role?: string;
  onMessage?: (messages: ChatMessage[], updatedMessage?: ChatMessage | ChatMessage[]) => void;
  initialMessages?: ChatMessage[];
}

type ChatMessageRow = {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  type: "text" | "audio" | "system" | null;
  metadata: Record<string, unknown> | null;
  is_read: boolean;
  is_deleted: boolean;
  created_at: string;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  username: string | null;
  is_admin: boolean | null;
  seller_status: string | null;
};

export function useRealtimeChat({
  roomName,
  userId,
  username,
  isVerified,
  role = "User",
  onMessage,
  initialMessages = [],
}: UseRealtimeChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const onMessageRef = useRef(onMessage);
  const profileCacheRef = useRef<Record<string, ChatMessage["user"]>>({});
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  const resolveCanonicalUser = useCallback(
    async (senderId: string): Promise<ChatMessage["user"]> => {
      if (senderId === userId) {
        return {
          id: userId,
          name: username,
          isVerified,
          role,
        };
      }

      const cached = profileCacheRef.current[senderId];
      if (cached) {
        return cached;
      }

      const { data } = await supabase
        .from("profiles")
        .select("id,full_name,username,is_admin,seller_status")
        .eq("id", senderId)
        .maybeSingle<ProfileRow>();

      const mappedUser: ChatMessage["user"] = {
        id: senderId,
        name: data?.full_name || data?.username || "User",
        isVerified: data?.is_admin === true || data?.seller_status === "verified",
        role: data?.is_admin ? "Admin" : data?.seller_status === "verified" ? "Seller" : "Buyer",
      };
      profileCacheRef.current[senderId] = mappedUser;
      return mappedUser;
    },
    [isVerified, role, supabase, userId, username]
  );

  const mapRowToMessage = useCallback(
    async (row: ChatMessageRow): Promise<ChatMessage> => {
      const canonicalUser = await resolveCanonicalUser(row.sender_id);
      const metadata = (row.metadata ?? {}) as Record<string, unknown>;
      return {
        id: row.id,
        content: row.content,
        user: canonicalUser,
        createdAt: row.created_at,
        type: (row.type ?? "text") as ChatMessage["type"],
        audioUrl: typeof metadata.audioUrl === "string" ? metadata.audioUrl : undefined,
        reactions:
          metadata.reactions && typeof metadata.reactions === "object"
            ? (metadata.reactions as Record<string, string[]>)
            : {},
        status: row.is_read ? "read" : "sent",
        is_deleted: row.is_deleted,
      };
    },
    [resolveCanonicalUser]
  );

  useEffect(() => {
    const channel = supabase
      .channel(`chat-db-${roomName}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `room_id=eq.${roomName}` },
        async (payload) => {
          const row = payload.new as ChatMessageRow;
          if (!row || row.is_deleted) return;

          const mappedMessage = await mapRowToMessage(row);
          if (mappedMessage.user.id !== userId) {
            const displayRole =
              mappedMessage.user.role || (mappedMessage.user.isVerified ? "Verified" : "User");
            toast.info({
              title: `${mappedMessage.user.name} (${displayRole})`,
              description: (
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-zinc-300">{mappedMessage.content}</span>
                </div>
              ),
            });
          }

          setMessages((prev) => {
            if (prev.some((msg) => msg.id === mappedMessage.id)) {
              return prev;
            }
            const next = [...prev, mappedMessage].sort(
              (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
            );
            onMessageRef.current?.(next, mappedMessage);
            return next;
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chat_messages", filter: `room_id=eq.${roomName}` },
        async (payload) => {
          const row = payload.new as ChatMessageRow;
          if (!row) return;

          if (row.is_deleted) {
            setMessages((prev) => {
              const next = prev.filter((msg) => msg.id !== row.id);
              if (next.length !== prev.length) {
                onMessageRef.current?.(next);
              }
              return next;
            });
            return;
          }

          setMessages((prev) => {
            let updated = false;
            const next: ChatMessage[] = prev.map((msg) => {
              if (msg.id !== row.id) return msg;
              updated = true;
              const metadata = (row.metadata ?? {}) as Record<string, unknown>;
              const updatedMessage: ChatMessage = {
                ...msg,
                status: (row.is_read ? "read" : "sent") as "read" | "sent",
                reactions:
                  metadata.reactions && typeof metadata.reactions === "object"
                    ? (metadata.reactions as Record<string, string[]>)
                    : msg.reactions,
              };
              return updatedMessage;
            });

            if (updated) {
              onMessageRef.current?.(next);
              return next;
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mapRowToMessage, roomName, supabase, userId]);

  const sendMessage = async (
    content: string,
    type: "text" | "audio" | "system" = "text",
    audioUrl?: string
  ) => {
    const clientMessageId = crypto.randomUUID();
    const response = await fetch("/api/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomName,
        content,
        type,
        audioUrl,
        clientMessageId,
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | { message?: ChatMessage; error?: string }
      | null;

    if (!response.ok || !payload?.message) {
      toast.error(payload?.error || "Unable to send message");
      return;
    }

    setMessages((prev) => {
      if (prev.some((msg) => msg.id === payload.message?.id)) {
        return prev;
      }
      const next = [...prev, payload.message as ChatMessage];
      onMessageRef.current?.(next, payload.message as ChatMessage);
      return next;
    });
  };

  const sendReaction = async (messageId: string, emoji: string) => {
    setMessages((prev) => {
      let updatedMessage: ChatMessage | undefined;
      const next = prev.map((message) => {
        if (message.id !== messageId) return message;

        const currentReactions = message.reactions || {};
        const reactors = currentReactions[emoji] || [];
        const updatedReactors = reactors.includes(username)
          ? reactors.filter((entry) => entry !== username)
          : [...reactors, username];
        const nextReactions = { ...currentReactions, [emoji]: updatedReactors };
        if (updatedReactors.length === 0) {
          delete nextReactions[emoji];
        }

        updatedMessage = { ...message, reactions: nextReactions };
        return updatedMessage;
      });

      if (updatedMessage) {
        onMessageRef.current?.(next, updatedMessage);
      }
      return next;
    });
  };

  const markAsRead = async (messageIds: string[]) => {
    if (messageIds.length === 0) return;

    setMessages((prev) => {
      let hasUpdates = false;
      const next = prev.map((msg) => {
        if (messageIds.includes(msg.id) && msg.status !== "read") {
          hasUpdates = true;
          return { ...msg, status: "read" as const };
        }
        return msg;
      });
      if (hasUpdates) {
        onMessageRef.current?.(next);
        return next;
      }
      return prev;
    });

    const { error } = await supabase.rpc("mark_messages_as_read", {
      p_room_id: roomName,
      p_user_id: userId,
    });
    if (error) {
      console.error("Failed to mark messages as read in DB:", error);
    }
  };

  const clearRoom = async () => {
    const { error } = await supabase.rpc("soft_delete_room_messages", { target_room_id: roomName });
    if (error) {
      console.error("Failed to clear room:", error);
      toast.error("Failed to clear chat");
      return;
    }
    setMessages([]);
    toast.info("Chat cleared");
  };

  return { messages, sendMessage, sendReaction, markAsRead, clearRoom };
}

