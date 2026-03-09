"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  LogIn,
  Reply,
  Send,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { authToast as toast } from "@/lib/notifications";
import { GLOBAL_CHAT_ROOMS, type GlobalChatRoom } from "@/lib/chat/global-chat-config";

const PROFILE_SELECT = "username,full_name,avatar_url,created_at,role_preference,seller_status";
const MESSAGE_SELECT = `id,user_id,room,message,created_at,reply_to_id,mentioned_handles,profiles!global_chat_messages_user_id_fkey(${PROFILE_SELECT})`;
const LEGACY_MESSAGE_SELECT = `id,user_id,room,message,created_at,profiles!global_chat_messages_user_id_fkey(${PROFILE_SELECT})`;

type ProfileRef = {
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string | null;
  role_preference: "buyer" | "seller" | "both" | null;
  seller_status: string | null;
};

type GlobalChatRow = {
  id: string;
  user_id: string;
  room: string;
  message: string;
  created_at: string;
  reply_to_id?: string | null;
  mentioned_handles?: string[] | null;
  profiles: ProfileRef | ProfileRef[] | null;
};

type GlobalChatMessage = {
  id: string;
  userId: string;
  room: string;
  text: string;
  createdAt: string;
  displayName: string;
  handle: string;
  avatarUrl: string | null;
  memberSince: string | null;
  isSeller: boolean;
  isBuyer: boolean;
  replyToId: string | null;
  mentionedHandles: string[];
};

type PostChatResponse =
  | {
      ok: true;
      data: {
        id: string;
        user_id: string;
        room: string;
        message: string;
        created_at: string;
        reply_to_id: string | null;
        mentioned_handles: string[] | null;
      };
    }
  | { ok: false; code: string; message: string };

type MentionContext = {
  query: string;
  start: number;
  end: number;
};

type MentionableUser = {
  userId: string;
  displayName: string;
  handle: string;
  avatarUrl: string | null;
  memberSince: string | null;
  isSeller: boolean;
  isBuyer: boolean;
};

type PresencePayload = {
  userId?: string;
  username?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
  memberSince?: string | null;
  rolePreference?: "buyer" | "seller" | "both" | null;
  sellerStatus?: string | null;
  isSeller?: boolean;
  isBuyer?: boolean;
};

function firstProfile(profile: ProfileRef | ProfileRef[] | null): ProfileRef | null {
  if (!profile) return null;
  if (Array.isArray(profile)) return profile[0] || null;
  return profile;
}

function deriveHandle(profile: ProfileRef | null, userId: string) {
  const username = String(profile?.username || "")
    .trim()
    .replace(/^@+/, "")
    .toLowerCase();
  if (username) return username;

  const fullName = String(profile?.full_name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (fullName) return fullName.slice(0, 30);

  return `user_${userId.slice(0, 8)}`;
}

function deriveDisplayName(profile: ProfileRef | null, userId: string) {
  const fullName = String(profile?.full_name || "").trim();
  if (fullName) return fullName;
  const username = String(profile?.username || "").trim().replace(/^@+/, "");
  if (username) return username;
  return `User ${userId.slice(0, 6)}`;
}

function resolveRoles(profile: ProfileRef | null) {
  const rolePreference = profile?.role_preference;
  const isSeller =
    rolePreference === "seller" || rolePreference === "both" || profile?.seller_status === "verified";
  const isBuyer = rolePreference === "buyer" || rolePreference === "both" || !isSeller;

  return { isSeller, isBuyer };
}

function extractMentionHandles(text: string) {
  const handles = new Set<string>();
  const mentionRegex = /@([a-zA-Z0-9_]{1,30})/g;

  let match = mentionRegex.exec(text);
  while (match) {
    if (match[1]) {
      handles.add(match[1].toLowerCase());
    }
    match = mentionRegex.exec(text);
  }

  return Array.from(handles).slice(0, 20);
}

function resolveMentionContext(text: string, cursorPosition: number): MentionContext | null {
  const beforeCursor = text.slice(0, cursorPosition);
  const match = beforeCursor.match(/(?:^|\s)@([a-zA-Z0-9_]*)$/);
  if (!match) return null;

  const query = match[1] || "";
  const start = cursorPosition - query.length - 1;
  if (start < 0) return null;

  return { query, start, end: cursorPosition };
}

function getAvatarFallback(name: string) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return initials || "U";
}

function truncateMessage(text: string, maxLength = 90) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

function chunkArray<T>(items: T[], size: number) {
  if (size <= 0) return [items];
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function formatRelativeTime(createdAt: string) {
  const timestamp = new Date(createdAt).getTime();
  if (Number.isNaN(timestamp)) return "";

  const diffMs = Date.now() - timestamp;
  const minute = 60_000;
  const hour = 60 * minute;

  if (diffMs < minute) return "now";
  if (diffMs < hour) return `${Math.max(1, Math.floor(diffMs / minute))} min ago`;
  return `${Math.max(1, Math.floor(diffMs / hour))} h ago`;
}

function renderMessageWithMentions(text: string, currentHandle: string | null) {
  const normalizedCurrentHandle = currentHandle?.toLowerCase() || null;
  const parts = text.split(/(@[a-zA-Z0-9_]{1,30})/g);
  return parts.map((part, index) => {
    if (part.startsWith("@")) {
      const mentionHandle = part.slice(1).toLowerCase();
      const isCurrentUserMention =
        normalizedCurrentHandle !== null && mentionHandle === normalizedCurrentHandle;

      return (
        <span
          key={`${part}-${index}`}
          className={cn(
            "rounded px-1 py-0.5 font-semibold",
            isCurrentUserMention
              ? "bg-[#6f5d1f] text-[#fff4bf]"
              : "bg-[#35546a] text-[#d8ecff]"
          )}
        >
          {part}
        </span>
      );
    }
    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

export function GlobalChatClient() {
  const supabase = useMemo(() => createClient(), []);
  const { user, isLoading } = useUser();

  const [messages, setMessages] = useState<GlobalChatMessage[]>([]);
  const [currentProfile, setCurrentProfile] = useState<ProfileRef | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<MentionableUser[]>([]);
  const [draft, setDraft] = useState("");
  const [mentionContext, setMentionContext] = useState<MentionContext | null>(null);
  const [activeMentionIndex, setActiveMentionIndex] = useState(0);
  const [replyTarget, setReplyTarget] = useState<GlobalChatMessage | null>(null);
  const [activeThreadRootId, setActiveThreadRootId] = useState<string | null>(null);
  const [isThreadLoading, setIsThreadLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [activeRoom, setActiveRoom] = useState<GlobalChatRoom>("english");
  const [isRoomMenuOpen, setIsRoomMenuOpen] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [showScrollToLatest, setShowScrollToLatest] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const roomMenuRef = useRef<HTMLDivElement>(null);
  const canWrite = Boolean(user);

  const activeRoomLabel =
    GLOBAL_CHAT_ROOMS.find((room) => room.slug === activeRoom)?.label || "English";

  const handleRoomChange = useCallback((nextRoom: GlobalChatRoom) => {
    setActiveRoom(nextRoom);
    setActiveThreadRootId(null);
    setIsThreadLoading(false);
    setReplyTarget(null);
    setMentionContext(null);
    setActiveMentionIndex(0);
    setIsRoomMenuOpen(false);
  }, []);

  const currentHandle = useMemo(() => {
    if (!user) return null;
    return deriveHandle(currentProfile, user.id);
  }, [currentProfile, user]);

  const updateScrollToLatestVisibility = useCallback(() => {
    const container = listRef.current;
    if (!container) {
      setShowScrollToLatest(false);
      return;
    }

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    setShowScrollToLatest(distanceFromBottom > 260);
  }, []);

  const scrollToLatestMessage = useCallback(() => {
    const container = listRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, []);

  const toMentionableUser = useCallback(
    (input: {
      userId: string;
      profile: ProfileRef | null;
      fallbackDisplayName?: string;
      fallbackHandle?: string;
      fallbackAvatarUrl?: string | null;
      fallbackMemberSince?: string | null;
      fallbackIsSeller?: boolean;
      fallbackIsBuyer?: boolean;
    }): MentionableUser => {
      const roles = resolveRoles(input.profile);
      const displayName =
        input.fallbackDisplayName || deriveDisplayName(input.profile, input.userId);
      const handle = (input.fallbackHandle || deriveHandle(input.profile, input.userId)).replace(
        /^@+/,
        ""
      );

      return {
        userId: input.userId,
        displayName,
        handle,
        avatarUrl: input.fallbackAvatarUrl ?? input.profile?.avatar_url ?? null,
        memberSince: input.fallbackMemberSince ?? input.profile?.created_at ?? null,
        isSeller: input.fallbackIsSeller ?? roles.isSeller,
        isBuyer: input.fallbackIsBuyer ?? roles.isBuyer,
      };
    },
    []
  );

  const normalizeMessage = useCallback((row: GlobalChatRow): GlobalChatMessage => {
    const profile = firstProfile(row.profiles);
    const { isSeller, isBuyer } = resolveRoles(profile);
    const displayName = deriveDisplayName(profile, row.user_id);
    const handle = deriveHandle(profile, row.user_id);

    return {
      id: row.id,
      userId: row.user_id,
      room: row.room,
      text: row.message,
      createdAt: row.created_at,
      displayName,
      handle,
      avatarUrl: profile?.avatar_url || null,
      memberSince: profile?.created_at || null,
      isSeller,
      isBuyer,
      replyToId: row.reply_to_id || null,
      mentionedHandles: (row.mentioned_handles || []).map((handleValue) =>
        String(handleValue).toLowerCase()
      ),
    };
  }, []);

  const fetchMessageById = useCallback(
    async (messageId: string) => {
      const primary = await supabase
        .from("global_chat_messages")
        .select(MESSAGE_SELECT)
        .eq("id", messageId)
        .maybeSingle();

      if (primary.error) {
        const fallback = await supabase
          .from("global_chat_messages")
          .select(LEGACY_MESSAGE_SELECT)
          .eq("id", messageId)
          .maybeSingle();

        if (fallback.error || !fallback.data) return null;
        return normalizeMessage(fallback.data as GlobalChatRow);
      }

      if (!primary.data) return null;
      return normalizeMessage(primary.data as GlobalChatRow);
    },
    [normalizeMessage, supabase]
  );

  useEffect(() => {
    let active = true;
    if (!user) return;

    const loadCurrentProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(PROFILE_SELECT)
        .eq("id", user.id)
        .maybeSingle();

      if (!active) return;
      if (error) {
        setCurrentProfile(null);
        return;
      }

      setCurrentProfile((data as ProfileRef | null) || null);
    };

    loadCurrentProfile();

    return () => {
      active = false;
    };
  }, [supabase, user]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const targetNode = event.target as Node | null;
      if (!targetNode) return;
      if (!roomMenuRef.current?.contains(targetNode)) {
        setIsRoomMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsRoomMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const loadMessages = useCallback(async () => {
    setIsFetching(true);

    const primary = await supabase
      .from("global_chat_messages")
      .select(MESSAGE_SELECT)
      .eq("room", activeRoom)
      .order("created_at", { ascending: false })
      .limit(200);

    let rows: GlobalChatRow[] = [];

    if (primary.error) {
      const fallback = await supabase
        .from("global_chat_messages")
        .select(LEGACY_MESSAGE_SELECT)
        .eq("room", activeRoom)
        .order("created_at", { ascending: false })
        .limit(200);

      if (fallback.error) {
        toast.error("Unable to load global chat right now.");
        setIsFetching(false);
        return;
      }

      rows = (fallback.data || []) as GlobalChatRow[];
    } else {
      rows = (primary.data || []) as GlobalChatRow[];

      const hasRootInPage = rows.some((row) => !row.reply_to_id);
      if (!hasRootInPage) {
        const rootFallbackQuery = await supabase
          .from("global_chat_messages")
          .select(MESSAGE_SELECT)
          .eq("room", activeRoom)
          .is("reply_to_id", null)
          .order("created_at", { ascending: false })
          .limit(200);

        if (!rootFallbackQuery.error && rootFallbackQuery.data) {
          const rootRows = rootFallbackQuery.data as GlobalChatRow[];
          const mergedById = new Map<string, GlobalChatRow>();
          [...rows, ...rootRows].forEach((row) => {
            mergedById.set(row.id, row);
          });
          rows = Array.from(mergedById.values());
        }
      }
    }

    const normalized = rows
      .map(normalizeMessage)
      .sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());

    setMessages(normalized);
    setIsFetching(false);
  }, [activeRoom, normalizeMessage, supabase]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadMessages();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadMessages]);

  useEffect(() => {
    const channel = supabase
      .channel(`global-chat:stream:${activeRoom}`, {
        config: {
          presence: {
            key: user?.id || "anon-viewer",
          },
        },
      })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "global_chat_messages",
          filter: `room=eq.${activeRoom}`,
        },
        async (payload) => {
          const inserted = payload.new as { id?: string | null };
          if (!inserted.id) return;

          const nextMessage = await fetchMessageById(inserted.id);
          if (!nextMessage) return;

          setMessages((prev) => {
            if (prev.some((item) => item.id === nextMessage.id)) return prev;
            const merged = [...prev, nextMessage];
            if (merged.length > 300) {
              return merged.slice(merged.length - 300);
            }
            return merged;
          });
        }
      )
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresencePayload>();
        const nextMap = new Map<string, MentionableUser>();

        Object.entries(state).forEach(([presenceKey, entries]) => {
          entries.forEach((entry) => {
            const userId = entry.userId || presenceKey;
            if (!userId) return;

            const profile: ProfileRef = {
              username: entry.username ?? null,
              full_name: entry.fullName ?? null,
              avatar_url: entry.avatarUrl ?? null,
              created_at: entry.memberSince ?? null,
              role_preference: entry.rolePreference ?? null,
              seller_status: entry.sellerStatus ?? null,
            };

            const mentionable = toMentionableUser({
              userId,
              profile,
              fallbackIsSeller: entry.isSeller,
              fallbackIsBuyer: entry.isBuyer,
            });

            nextMap.set(userId, mentionable);
          });
        });

        setOnlineUsers(
          Array.from(nextMap.values()).sort((left, right) =>
            left.displayName.localeCompare(right.displayName)
          )
        );
      })
      .subscribe(async (status) => {
        if (status !== "SUBSCRIBED") return;
        if (!user) return;

        const profile = currentProfile;
        const roles = resolveRoles(profile);

        try {
          await channel.track({
            userId: user.id,
            username: profile?.username ?? user.user_metadata?.username ?? null,
            fullName: profile?.full_name ?? user.user_metadata?.full_name ?? null,
            avatarUrl: profile?.avatar_url ?? null,
            memberSince: profile?.created_at ?? null,
            rolePreference: profile?.role_preference ?? null,
            sellerStatus: profile?.seller_status ?? null,
            isSeller: roles.isSeller,
            isBuyer: roles.isBuyer,
          });
        } catch {
          // Ignore presence failures and keep chat usable.
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeRoom, currentProfile, fetchMessageById, supabase, toMentionableUser, user]);

  useEffect(() => {
    if (!listRef.current) return;
    if (activeThreadRootId) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
    updateScrollToLatestVisibility();
  }, [activeThreadRootId, messages.length, updateScrollToLatestVisibility]);

  useEffect(() => {
    const container = listRef.current;
    if (!container) return;

    const handleScroll = () => {
      updateScrollToLatestVisibility();
    };

    updateScrollToLatestVisibility();
    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [activeThreadRootId, updateScrollToLatestVisibility]);

  const participantsCount = useMemo(
    () => new Set(messages.map((message) => message.userId)).size,
    [messages]
  );

  const mentionCandidates = useMemo(() => {
    const onlineOthers = onlineUsers.filter((candidate) => candidate.userId !== user?.id);
    const mergedByUserId = new Map<string, MentionableUser>();

    // Prefer users currently online first.
    onlineOthers.forEach((candidate) => {
      mergedByUserId.set(candidate.userId, candidate);
    });

    // Fallback: include known participants from recent room messages.
    const fallbackMap = new Map<string, MentionableUser>();
    messages.forEach((message) => {
      if (message.userId === user?.id) return;
      fallbackMap.set(
        message.userId,
        toMentionableUser({
          userId: message.userId,
          profile: null,
          fallbackDisplayName: message.displayName,
          fallbackHandle: message.handle,
          fallbackAvatarUrl: message.avatarUrl,
          fallbackMemberSince: message.memberSince,
          fallbackIsSeller: message.isSeller,
          fallbackIsBuyer: message.isBuyer,
        })
      );
    });

    fallbackMap.forEach((candidate, userId) => {
      if (!mergedByUserId.has(userId)) {
        mergedByUserId.set(userId, candidate);
      }
    });

    return Array.from(mergedByUserId.values());
  }, [messages, onlineUsers, toMentionableUser, user?.id]);

  const mentionSuggestions = useMemo(() => {
    if (!mentionContext) return [];
    const query = mentionContext.query.toLowerCase();

    return mentionCandidates
      .filter((candidate) => {
        if (!query) return true;
        return (
          candidate.handle.toLowerCase().includes(query) ||
          candidate.displayName.toLowerCase().includes(query)
        );
      })
      .slice(0, 8);
  }, [mentionCandidates, mentionContext]);

  const messagesById = useMemo(() => {
    return new Map(messages.map((message) => [message.id, message]));
  }, [messages]);

  const repliesByParentId = useMemo(() => {
    const grouped = new Map<string, GlobalChatMessage[]>();
    messages.forEach((message) => {
      if (!message.replyToId) return;
      const existing = grouped.get(message.replyToId) || [];
      existing.push(message);
      grouped.set(message.replyToId, existing);
    });

    grouped.forEach((group, key) => {
      grouped.set(
        key,
        [...group].sort(
          (left, right) =>
            new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
        )
      );
    });

    return grouped;
  }, [messages]);

  const topLevelMessages = useMemo(() => {
    return messages.filter((message) => message.replyToId === null);
  }, [messages]);

  const threadReplyCountByRoot = useMemo(() => {
    const countDescendants = (messageId: string): number => {
      const children = repliesByParentId.get(messageId) || [];
      if (children.length === 0) return 0;
      return children.reduce((count, child) => count + 1 + countDescendants(child.id), 0);
    };

    const map = new Map<string, number>();
    topLevelMessages.forEach((message) => {
      map.set(message.id, countDescendants(message.id));
    });
    return map;
  }, [repliesByParentId, topLevelMessages]);

  const resolveThreadRootId = useCallback(
    (messageId: string) => {
      let current = messagesById.get(messageId);
      let depth = 0;

      while (current?.replyToId && depth < 100) {
        const parent = messagesById.get(current.replyToId);
        if (!parent) break;
        current = parent;
        depth += 1;
      }

      return current?.id || messageId;
    },
    [messagesById]
  );

  const threadRootMessage = useMemo(() => {
    if (!activeThreadRootId) return null;
    return messagesById.get(activeThreadRootId) || null;
  }, [activeThreadRootId, messagesById]);

  const threadMessages = useMemo(() => {
    if (!activeThreadRootId) return [] as Array<{ message: GlobalChatMessage; depth: number }>;

    const collected: Array<{ message: GlobalChatMessage; depth: number }> = [];

    const walk = (parentId: string, depth: number) => {
      const children = repliesByParentId.get(parentId) || [];
      children.forEach((child) => {
        collected.push({ message: child, depth });
        walk(child.id, depth + 1);
      });
    };

    walk(activeThreadRootId, 1);

    return collected;
  }, [activeThreadRootId, repliesByParentId]);

  const onlineCount = onlineUsers.length > 0 ? onlineUsers.length : participantsCount;

  const loadThreadMessages = useCallback(
    async (rootId: string) => {
      setIsThreadLoading(true);

      try {
        const { data: rootData, error: rootError } = await supabase
          .from("global_chat_messages")
          .select(MESSAGE_SELECT)
          .eq("room", activeRoom)
          .eq("id", rootId)
          .maybeSingle();

        if (rootError || !rootData) {
          toast.error("Unable to load this thread right now.");
          return;
        }

        const queue = [rootId];
        const seen = new Set<string>([rootId]);
        const collected: GlobalChatRow[] = [rootData as GlobalChatRow];

        while (queue.length > 0) {
          const parentIds = queue.splice(0, 120);
          const parentChunks = chunkArray(parentIds, 25);

          for (const parentChunk of parentChunks) {
            const { data: childrenData, error: childrenError } = await supabase
              .from("global_chat_messages")
              .select(MESSAGE_SELECT)
              .eq("room", activeRoom)
              .in("reply_to_id", parentChunk)
              .order("created_at", { ascending: true })
              .limit(1000);

            if (childrenError || !childrenData || childrenData.length === 0) {
              continue;
            }

            (childrenData as GlobalChatRow[]).forEach((childRow) => {
              if (seen.has(childRow.id)) return;
              seen.add(childRow.id);
              collected.push(childRow);
              queue.push(childRow.id);
            });
          }
        }

        const normalized = collected.map(normalizeMessage);

        setMessages((prev) => {
          const merged = new Map<string, GlobalChatMessage>();
          prev.forEach((message) => merged.set(message.id, message));
          normalized.forEach((message) => merged.set(message.id, message));

          return Array.from(merged.values()).sort(
            (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
          );
        });
      } finally {
        setIsThreadLoading(false);
      }
    },
    [activeRoom, normalizeMessage, supabase]
  );

  const openThreadForMessage = useCallback(
    (message: GlobalChatMessage) => {
      const rootId = resolveThreadRootId(message.id);
      const rootMessage = messagesById.get(rootId) || message;
      setActiveThreadRootId(rootId);
      setReplyTarget(rootMessage);
      setMentionContext(null);
      setActiveMentionIndex(0);
      requestAnimationFrame(() => {
        if (!listRef.current) return;
        listRef.current.scrollTop = 0;
      });
      void loadThreadMessages(rootId);
    },
    [loadThreadMessages, messagesById, resolveThreadRootId]
  );

  const applyMention = useCallback(
    (candidate: MentionableUser) => {
      if (!mentionContext) return;
      const currentContext = mentionContext;
      const mentionToken = `@${candidate.handle}`;
      const nextDraft = `${draft.slice(0, currentContext.start)}${mentionToken} ${draft.slice(currentContext.end)}`;
      const nextCursor = currentContext.start + mentionToken.length + 1;

      setDraft(nextDraft);
      setMentionContext(null);
      setActiveMentionIndex(0);

      requestAnimationFrame(() => {
        if (!inputRef.current) return;
        inputRef.current.focus();
        inputRef.current.setSelectionRange(nextCursor, nextCursor);
      });
    },
    [draft, mentionContext]
  );

  const syncMentionContextFromInput = useCallback((element: HTMLInputElement) => {
    const cursor = element.selectionStart ?? element.value.length;
    setMentionContext(resolveMentionContext(element.value, cursor));
    setActiveMentionIndex(0);
  }, []);

  const handleSend = async () => {
    if (!user) return;

    const message = draft;
    if (!message.trim()) return;

    setIsSending(true);
    const response = await fetch("/api/global-chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        room: activeRoom,
        message,
        replyToId: replyTarget?.id || null,
        mentions: extractMentionHandles(message),
      }),
    }).catch(() => null);

    if (!response) {
      toast.error("Unable to send message.");
      setIsSending(false);
      return;
    }

    const payload = (await response.json().catch(() => null)) as PostChatResponse | null;
    if (!payload || !payload.ok) {
      const fallback = "Unable to send message.";
      const messageText = payload && "message" in payload ? payload.message : fallback;
      toast.error(messageText);
      setIsSending(false);
      return;
    }

    setDraft("");
    if (activeThreadRootId && threadRootMessage) {
      setReplyTarget(threadRootMessage);
    } else {
      setReplyTarget(null);
    }
    setMentionContext(null);
    setActiveMentionIndex(0);
    setIsSending(false);
  };

  const renderMainMessage = (message: GlobalChatMessage) => {
    const repliesCount = threadReplyCountByRoot.get(message.id) || 0;

    return (
      <div
        key={message.id}
        className={cn(
          "rounded-xl border px-3 py-2 text-sm leading-relaxed shadow-sm",
          user?.id === message.userId ? "border-[#2f536b] bg-[#163246]" : "border-white/5 bg-[#102636]"
        )}
      >
        <div className="flex items-start gap-2">
          <Avatar size="sm" className="mt-0.5 shrink-0 border border-white/10">
            <AvatarImage src={message.avatarUrl || undefined} alt={message.displayName} />
            <AvatarFallback className="bg-[#1d3f58] text-[10px] text-[#d7ecff]">
              {getAvatarFallback(message.displayName)}
            </AvatarFallback>
          </Avatar>

            <div className="min-w-0 flex-1">
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] leading-relaxed text-[#e4f3ff]">
                <span className="text-sm font-bold text-[#d8ecff]">{message.displayName}</span>
                <span className="min-w-0 break-words">{renderMessageWithMentions(message.text, currentHandle)}</span>
              </div>

            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs">
              <button
                type="button"
                onClick={() => openThreadForMessage(message)}
                className="inline-flex items-center gap-1 text-zinc-400 transition hover:text-[#bfe2ff]"
              >
                <Reply className="h-3.5 w-3.5" />
                {repliesCount > 0 ? `Open thread (${repliesCount})` : "Open thread"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderThreadReply = (entry: { message: GlobalChatMessage; depth: number }) => {
    const { message, depth } = entry;
    return (
      <div
        key={message.id}
        className="rounded-xl border border-white/5 bg-[#102636] px-3 py-2 shadow-sm"
        style={{ marginLeft: Math.min((depth - 1) * 16, 64) }}
      >
        <div className="flex items-start gap-2">
          <Avatar size="sm" className="mt-0.5 shrink-0 border border-white/10">
            <AvatarImage src={message.avatarUrl || undefined} alt={message.displayName} />
            <AvatarFallback className="bg-[#1d3f58] text-[10px] text-[#d7ecff]">
              {getAvatarFallback(message.displayName)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] leading-relaxed text-[#e4f3ff]">
              <span className="text-sm font-bold text-[#d8ecff]">{message.displayName}</span>
              <span className="text-xs text-zinc-400">{formatRelativeTime(message.createdAt)}</span>
              <span className="min-w-0 break-words">{renderMessageWithMentions(message.text, currentHandle)}</span>
            </div>

            <div className="mt-1 flex items-center gap-3 text-xs">
              <button
                type="button"
                onClick={() => setReplyTarget(message)}
                className="inline-flex items-center gap-1 text-zinc-400 transition hover:text-[#bfe2ff]"
              >
                <Reply className="h-3.5 w-3.5" />
                Reply
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#050d14] text-white">
      <div className="mx-auto flex min-h-screen w-full">
        <div className="relative hidden flex-1 overflow-hidden md:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(45,156,212,0.18),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(22,76,110,0.18),transparent_50%)]" />
        </div>

        <aside
          className={cn(
            "flex h-screen w-full flex-col border-l border-white/10 bg-[#081a27] transition-[width] duration-200",
            isChatExpanded ? "md:w-[520px]" : "md:w-[420px]"
          )}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
            <div className="relative" ref={roomMenuRef}>
              <button
                type="button"
                onClick={() => setIsRoomMenuOpen((prev) => !prev)}
                className="inline-flex h-9 min-w-[136px] items-center justify-between rounded-lg border border-[#2b4557] bg-[#0f2332] px-3 text-left text-sm font-semibold text-white transition hover:border-[#3d6582]"
                aria-haspopup="listbox"
                aria-expanded={isRoomMenuOpen}
              >
                <span>{activeRoomLabel}</span>
                <ChevronDown
                  className={cn(
                    "ml-2 h-4 w-4 text-zinc-300 transition-transform",
                    isRoomMenuOpen ? "rotate-180" : ""
                  )}
                />
              </button>

              {isRoomMenuOpen ? (
                <div className="absolute top-[calc(100%+4px)] left-0 z-40 w-[190px] overflow-hidden rounded-md border border-[#2e5067] bg-[#0b2537] shadow-2xl">
                  <ul role="listbox" aria-label="Chat rooms">
                    {GLOBAL_CHAT_ROOMS.map((room) => {
                      const isActive = room.slug === activeRoom;
                      return (
                        <li key={room.slug}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={isActive}
                            onClick={() => handleRoomChange(room.slug)}
                            className={cn(
                              "block w-full px-4 py-2 text-left transition",
                              isActive
                                ? "bg-[#d4ebff] text-[#0d3550]"
                                : "text-white hover:bg-[#23465c]"
                            )}
                          >
                            <span className="text-base font-semibold">{room.label}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setIsChatExpanded((prev) => !prev)}
              aria-label={isChatExpanded ? "Shrink chat width" : "Stretch chat width"}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#2b4557] bg-[#181848] text-white transition hover:bg-[#22225a]"
            >
              <span className="relative inline-flex h-4 w-4 items-center justify-center">
                <span
                  className={cn(
                    "absolute top-0 h-full w-px bg-white/80",
                    isChatExpanded ? "left-0" : "right-0"
                  )}
                />
                {isChatExpanded ? (
                  <ArrowRight className="h-3.5 w-3.5" />
                ) : (
                  <ArrowLeft className="h-3.5 w-3.5" />
                )}
              </span>
            </button>

          </div>

          <div ref={listRef} className="relative flex-1 space-y-2 overflow-y-auto px-3 py-3">
            {showScrollToLatest ? (
              <div className="sticky top-0 z-20 -mx-3 px-3 pb-2">
                <button
                  type="button"
                  onClick={scrollToLatestMessage}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[#8b5cf6]/30 bg-gradient-to-r from-[#6d38dc] to-[#7c3aed] text-sm font-semibold text-white shadow-lg transition hover:brightness-110"
                >
                  <ArrowDown className="h-4 w-4" />
                  Scroll to last message
                </button>
              </div>
            ) : null}

            {isFetching || isLoading ? (
              <div className="rounded-xl border border-white/10 bg-[#102636] p-3 text-sm text-zinc-300">
                Loading chat...
              </div>
            ) : messages.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-[#102636] p-3 text-sm text-zinc-300">
                No messages yet in this room.
              </div>
            ) : activeThreadRootId && threadRootMessage ? (
              <div className="space-y-3">
                <div className="sticky top-0 z-10 -mx-3 border-b border-white/10 bg-[#081a27]/95 px-3 py-2 backdrop-blur">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveThreadRootId(null);
                      setReplyTarget(null);
                      setIsThreadLoading(false);
                    }}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-[#bfe2ff] hover:text-white"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to chat
                  </button>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#102636] px-3 py-2 shadow-sm">
                  <div className="flex items-start gap-2">
                    <Avatar size="sm" className="mt-0.5 shrink-0 border border-white/10">
                      <AvatarImage
                        src={threadRootMessage.avatarUrl || undefined}
                        alt={threadRootMessage.displayName}
                      />
                      <AvatarFallback className="bg-[#1d3f58] text-[10px] text-[#d7ecff]">
                        {getAvatarFallback(threadRootMessage.displayName)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] leading-relaxed text-[#e4f3ff]">
                        <span className="text-sm font-bold text-[#d8ecff]">
                          {threadRootMessage.displayName}
                        </span>
                        <span className="text-xs text-zinc-400">
                          {formatRelativeTime(threadRootMessage.createdAt)}
                        </span>
                        <span className="min-w-0 break-words">
                          {renderMessageWithMentions(threadRootMessage.text, currentHandle)}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-3 text-xs">
                        <button
                          type="button"
                          onClick={() => setReplyTarget(threadRootMessage)}
                          className="inline-flex items-center gap-1 text-zinc-400 transition hover:text-[#bfe2ff]"
                        >
                          <Reply className="h-3.5 w-3.5" />
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {threadMessages.length === 0 ? (
                  <div className="rounded-xl border border-white/10 bg-[#102636] p-3 text-sm text-zinc-300">
                    {isThreadLoading
                      ? "Loading thread replies..."
                      : "No replies yet. Be the first to reply in this thread."}
                  </div>
                ) : (
                  <div className="space-y-2 border-l border-white/10 pl-2">
                    {threadMessages.map((entry) => renderThreadReply(entry))}
                  </div>
                )}
              </div>
            ) : (
              topLevelMessages.map((message) => renderMainMessage(message))
            )}
          </div>

          <div className="border-t border-white/10 bg-[#091724] p-3">
            {replyTarget ? (
              <div className="mb-2 flex items-center justify-between rounded-lg border border-white/10 bg-[#0d2434] px-3 py-2 text-xs text-[#b7ddff]">
                <div className="min-w-0">
                  <span className="font-semibold">Replying to {replyTarget.displayName}</span>
                  <span className="ml-2 text-zinc-300">{truncateMessage(replyTarget.text, 70)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (activeThreadRootId && threadRootMessage) {
                      setReplyTarget(threadRootMessage);
                    } else {
                      setReplyTarget(null);
                    }
                  }}
                  className="ml-2 rounded p-1 text-zinc-400 transition hover:bg-white/5 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : null}

            <div className="mb-2 flex items-center gap-2">
              <div className="relative flex-1">
                {mentionContext && mentionSuggestions.length > 0 ? (
                  <div className="absolute bottom-[calc(100%+8px)] left-0 right-0 z-20 max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-[#06131d] p-1 shadow-2xl">
                    {mentionSuggestions.map((candidate, index) => (
                      <button
                        key={`${candidate.userId}-${candidate.handle}`}
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          applyMention(candidate);
                        }}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition",
                          index === activeMentionIndex
                            ? "bg-[#1f4460] text-white"
                            : "text-zinc-200 hover:bg-white/5"
                        )}
                      >
                        <Avatar size="sm" className="shrink-0 border border-white/10">
                          <AvatarImage src={candidate.avatarUrl || undefined} alt={candidate.displayName} />
                          <AvatarFallback className="bg-[#1d3f58] text-[10px] text-[#d7ecff]">
                            {getAvatarFallback(candidate.displayName)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="truncate font-semibold">{candidate.displayName}</span>
                            <span className="truncate text-xs text-[#9ed0f7]">@{candidate.handle}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                            {candidate.isSeller ? <span>Seller</span> : null}
                            {candidate.isBuyer ? <span>Buyer</span> : null}
                            <span>Online now</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : null}

                <input
                  ref={inputRef}
                  value={draft}
                  onChange={(event) => {
                    setDraft(event.target.value);
                    syncMentionContextFromInput(event.currentTarget);
                  }}
                  onClick={(event) => {
                    syncMentionContextFromInput(event.currentTarget);
                  }}
                  onKeyUp={(event) => {
                    if (
                      event.key === "ArrowDown" ||
                      event.key === "ArrowUp" ||
                      event.key === "Enter" ||
                      event.key === "Tab"
                    ) {
                      return;
                    }
                    syncMentionContextFromInput(event.currentTarget);
                  }}
                  onBlur={() => {
                    window.setTimeout(() => {
                      setMentionContext(null);
                    }, 120);
                  }}
                  onKeyDown={(event) => {
                    if (mentionContext && mentionSuggestions.length > 0) {
                      if (event.key === "ArrowDown") {
                        event.preventDefault();
                        setActiveMentionIndex((prev) =>
                          prev + 1 >= mentionSuggestions.length ? 0 : prev + 1
                        );
                        return;
                      }

                      if (event.key === "ArrowUp") {
                        event.preventDefault();
                        setActiveMentionIndex((prev) =>
                          prev - 1 < 0 ? mentionSuggestions.length - 1 : prev - 1
                        );
                        return;
                      }

                      if (event.key === "Tab" || event.key === "Enter") {
                        event.preventDefault();
                        const nextCandidate = mentionSuggestions[activeMentionIndex];
                        if (nextCandidate) {
                          applyMention(nextCandidate);
                        }
                        return;
                      }

                      if (event.key === "Escape") {
                        event.preventDefault();
                        setMentionContext(null);
                        return;
                      }
                    }

                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={canWrite ? "Type your message (@ to mention)" : "Login to write in chat"}
                  disabled={!canWrite || isSending}
                  className="h-11 w-full rounded-lg border border-[#2f4a5d] bg-[#06131d] px-3 text-base text-white placeholder:text-zinc-500 focus:border-[#4d7b9b] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <Button
                onClick={handleSend}
                disabled={!canWrite || isSending || !draft.trim()}
                className="h-11 rounded-lg bg-[#2684d9] px-5 text-base font-bold text-white hover:bg-[#1f74be]"
              >
                <Send className="mr-2 h-4 w-4" />
                Send
              </Button>
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-300">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Online: {onlineCount.toLocaleString("en-US")}
              </span>

              {canWrite ? (
                <span className="text-zinc-400">Use @ to tag users online in this room</span>
              ) : (
                <Link
                  href="/login?next=/global-chat"
                  className="inline-flex items-center gap-1 text-[#8ecfff] hover:text-white"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Login to write
                </Link>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
