"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import * as Flags from "country-flag-icons/react/3x2";
import {
  BriefcaseBusiness,
  Coins,
  Globe2,
  LifeBuoy,
  LogIn,
  ShoppingBag,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase";
import { useUser } from "@/contexts/UserContext";
import {
  DEFAULT_GLOBAL_CHAT_ROOM,
  GLOBAL_CHAT_ROOMS,
  type GlobalChatRoom,
} from "@/lib/chat/global-chat-config";
import {
  chatGlobalBehaviorModify,
  chatGlobalClassModify,
  chatGlobalComponentClassModify,
  getChatGlobalComposerShellStyle,
  getChatGlobalCssVars,
  getChatGlobalErrorCardStyle,
  getChatGlobalInputStyle,
  getChatGlobalMessageCardStyle,
  getChatGlobalPanelStyle,
  getChatGlobalRulesCardStyle,
  getChatGlobalSendButtonStyle,
  getChatGlobalStateCardStyle,
  getChatGlobalUserSheetStyle,
} from "./chatglobal-modify";
import { HomepageChatHeader } from "../(homepage)/components/HomepageChatHeader";

const PROFILE_SELECT = "username,full_name,avatar_url,created_at,role_preference,seller_status";
const MESSAGE_SELECT = `id,user_id,room,message,created_at,is_deleted,profiles!global_chat_messages_user_id_fkey(${PROFILE_SELECT})`;

const LANGUAGE_ROOM_FLAG_BY_SLUG = {
  english: Flags.GB,
  spanish: Flags.ES,
  polish: Flags.PL,
  russian: Flags.RU,
  ukrainian: Flags.UA,
  turkish: Flags.TR,
  romanian: Flags.RO,
  "portuguese-br": Flags.BR,
} as const;

type ChatProfile = {
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string | null;
  role_preference: string | null;
  seller_status: string | null;
};

type ChatMessageRow = {
  id: string;
  user_id: string;
  room: string;
  message: string;
  created_at: string;
  is_deleted?: boolean | null;
  profiles: ChatProfile | ChatProfile[] | null;
};

type ChatMessage = {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
  displayName: string;
  handle: string;
  avatarUrl: string | null;
  memberSince: string | null;
  isSeller: boolean;
  isBuyer: boolean;
  isPending?: boolean;
};

type ChatUserProfileCard = {
  userId: string;
  displayName: string;
  handle: string;
  avatarUrl: string | null;
  memberSince: string | null;
  isSeller: boolean;
  isBuyer: boolean;
  sellerStatus: string | null;
  buyerRanking: string | null;
  totalMessages: number;
  lastMessageAt: string | null;
  purchasesCount: number | null;
};

type NewHomeGlobalChatPanelProps = {
  open: boolean;
  onClose: () => void;
  className?: string;
};

function firstProfile(profile: ChatProfile | ChatProfile[] | null): ChatProfile | null {
  if (!profile) return null;
  return Array.isArray(profile) ? (profile[0] ?? null) : profile;
}

function deriveDisplayName(profile: ChatProfile | null, userId: string) {
  const fullName = String(profile?.full_name || "").trim();
  if (fullName) return fullName;
  const username = String(profile?.username || "").trim();
  if (username) return username;
  return `User ${userId.slice(0, 6)}`;
}

function deriveHandle(profile: ChatProfile | null, userId: string) {
  const username = String(profile?.username || "")
    .trim()
    .replace(/^@+/, "")
    .toLowerCase();
  if (username) return username;
  return userId.slice(0, 8).toLowerCase();
}

function getAvatarFallback(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? "U";
  const second = words[1]?.[0] ?? "";
  return `${first}${second}`.toUpperCase();
}

function resolveRoles(profile: ChatProfile | null) {
  const rolePreference = profile?.role_preference;
  const isSeller =
    rolePreference === "seller" || rolePreference === "both" || profile?.seller_status === "verified";
  const isBuyer = rolePreference === "buyer" || rolePreference === "both" || !isSeller;

  return { isSeller, isBuyer };
}

function getBuyerRanking(totalPurchases: number) {
  if (totalPurchases >= 20) return "Elite Buyer";
  if (totalPurchases >= 5) return "Trusted Buyer";
  if (totalPurchases >= 1) return "Active Buyer";
  return "Rookie Buyer";
}

function formatTime(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "--:--";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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

function formatDateLabel(value: string | null) {
  if (!value) return "Unknown";
  const ts = new Date(value);
  if (Number.isNaN(ts.getTime())) return "Unknown";
  return ts.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function NewHomeGlobalChatPanel({ open, onClose, className }: NewHomeGlobalChatPanelProps) {
  const supabase = useMemo(() => createClient(), []);
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const roomMenuRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [activeRoom, setActiveRoom] = useState<GlobalChatRoom>(DEFAULT_GLOBAL_CHAT_ROOM);
  const [isRoomMenuOpen, setIsRoomMenuOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [hasAcceptedRules, setHasAcceptedRules] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [errorText, setErrorText] = useState<string | null>(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState<ChatMessage | null>(null);
  const [selectedUserProfileData, setSelectedUserProfileData] = useState<ChatUserProfileCard | null>(null);
  const [isSelectedUserProfileLoading, setIsSelectedUserProfileLoading] = useState(false);
  const [realOnlineCount, setRealOnlineCount] = useState(0);
  const [displayOnlineCount, setDisplayOnlineCount] = useState<number>(
    chatGlobalBehaviorModify.onlineDisplayBase
  );

  const canWrite = Boolean(user && hasAcceptedRules);
  const activeRoomLabel =
    GLOBAL_CHAT_ROOMS.find((room) => room.slug === activeRoom)?.label || "English";
  const cssVars = getChatGlobalCssVars();
  const panelStyle = getChatGlobalPanelStyle();
  const stateCardStyle = getChatGlobalStateCardStyle();
  const messageCardStyle = getChatGlobalMessageCardStyle();
  const composerShellStyle = getChatGlobalComposerShellStyle();
  const rulesCardStyle = getChatGlobalRulesCardStyle();
  const errorCardStyle = getChatGlobalErrorCardStyle();
  const inputStyle = getChatGlobalInputStyle(canWrite);
  const sendButtonStyle = getChatGlobalSendButtonStyle();
  const userSheetStyle = getChatGlobalUserSheetStyle();

  const mapRowToMessage = useCallback((row: ChatMessageRow): ChatMessage => {
    const profile = firstProfile(row.profiles);
    const roles = resolveRoles(profile);
    return {
      id: row.id,
      userId: row.user_id,
      text: row.message,
      createdAt: row.created_at,
      displayName: deriveDisplayName(profile, row.user_id),
      handle: deriveHandle(profile, row.user_id),
      avatarUrl: profile?.avatar_url ?? null,
      memberSince: profile?.created_at ?? null,
      isSeller: roles.isSeller,
      isBuyer: roles.isBuyer,
    };
  }, []);

  const loadMessages = useCallback(async (options?: { showLoader?: boolean }) => {
    if (!open) return;
    const showLoader = options?.showLoader === true;
    if (showLoader) {
      setIsLoading(true);
    }

    const { data, error } = await supabase
      .from("global_chat_messages")
      .select(MESSAGE_SELECT)
      .eq("room", activeRoom)
      .order("created_at", { ascending: true })
      .limit(300);

    if (error) {
      setErrorText("Unable to load chat right now.");
      if (showLoader) {
        setIsLoading(false);
      }
      return;
    }

    const normalized = ((data ?? []) as ChatMessageRow[])
      .filter((row) => !row.is_deleted)
      .map(mapRowToMessage);
    setMessages(normalized);
    setErrorText(null);
    if (showLoader) {
      setIsLoading(false);
    }
  }, [activeRoom, mapRowToMessage, open, supabase]);

  useEffect(() => {
    try {
      const accepted = localStorage.getItem("global_chat_rules_accepted") === "1";
      setHasAcceptedRules(accepted);
    } catch {
      setHasAcceptedRules(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void loadMessages({ showLoader: true });
  }, [loadMessages, open]);

  useEffect(() => {
    if (open) return;
    setSelectedUserProfile(null);
    setSelectedUserProfileData(null);
    setIsSelectedUserProfileLoading(false);
  }, [open]);

  useEffect(() => {
    let active = true;
    if (!selectedUserProfile) {
      setSelectedUserProfileData(null);
      setIsSelectedUserProfileLoading(false);
      return;
    }

    const loadSelectedUserProfile = async () => {
      setIsSelectedUserProfileLoading(true);

      const [profileResult, totalCountResult, lastMessageResult, purchasesResult] = await Promise.all([
        supabase.from("profiles").select(PROFILE_SELECT).eq("id", selectedUserProfile.userId).maybeSingle(),
        supabase
          .from("global_chat_messages")
          .select("id", { count: "exact", head: true })
          .eq("user_id", selectedUserProfile.userId)
          .eq("is_deleted", false),
        supabase
          .from("global_chat_messages")
          .select("created_at")
          .eq("user_id", selectedUserProfile.userId)
          .eq("is_deleted", false)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle<{ created_at: string }>(),
        supabase
          .from("deals")
          .select("id", { count: "exact", head: true })
          .eq("buyer_id", selectedUserProfile.userId)
          .eq("status", "completed"),
      ]);

      if (!active) return;

      const profile = (profileResult.data as ChatProfile | null) || null;
      const fallbackRoles = {
        isSeller: selectedUserProfile.isSeller,
        isBuyer: selectedUserProfile.isBuyer,
      };
      const roles = profile ? resolveRoles(profile) : fallbackRoles;

      setSelectedUserProfileData({
        userId: selectedUserProfile.userId,
        displayName: selectedUserProfile.displayName,
        handle: deriveHandle(profile, selectedUserProfile.userId).replace(/^@+/, "") || selectedUserProfile.handle,
        avatarUrl: profile?.avatar_url || selectedUserProfile.avatarUrl || null,
        memberSince: profile?.created_at || selectedUserProfile.memberSince || null,
        isSeller: roles.isSeller,
        isBuyer: roles.isBuyer,
        sellerStatus: profile?.seller_status || null,
        buyerRanking: purchasesResult.error ? null : getBuyerRanking(purchasesResult.count || 0),
        totalMessages: totalCountResult.count || 0,
        lastMessageAt: lastMessageResult.data?.created_at || null,
        purchasesCount: purchasesResult.error ? null : purchasesResult.count || 0,
      });
      setIsSelectedUserProfileLoading(false);
    };

    void loadSelectedUserProfile();

    return () => {
      active = false;
    };
  }, [selectedUserProfile, supabase]);

  useEffect(() => {
    if (!open) return;

    const channel = supabase
      .channel(`new-home-global-chat:${activeRoom}`, {
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
        () => {
          void loadMessages();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "global_chat_messages",
          filter: `room=eq.${activeRoom}`,
        },
        () => {
          void loadMessages();
        }
      )
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<Record<string, unknown>>();
        const count = Object.values(state).reduce((acc, entries) => acc + entries.length, 0);
        setRealOnlineCount(count);
      })
      .subscribe(async (status) => {
        if (status !== "SUBSCRIBED" || !user) return;
        try {
          await channel.track({ userId: user.id });
        } catch {}
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [activeRoom, loadMessages, open, supabase, user]);

  useEffect(() => {
    if (!open) return;

    const minFloor = chatGlobalBehaviorModify.onlineMinFloor;
    const target = Math.max(
      minFloor,
      chatGlobalBehaviorModify.onlineDisplayBase +
        Math.round(realOnlineCount * chatGlobalBehaviorModify.onlineInflateFactor)
    );

    const tick = () => {
      setDisplayOnlineCount((current) => {
        const diff = target - current;
        if (diff === 0) return current;

        const stepBase = Math.max(
          chatGlobalBehaviorModify.onlineStepMin,
          Math.min(
            chatGlobalBehaviorModify.onlineStepMax,
            Math.floor(Math.abs(diff) * chatGlobalBehaviorModify.onlineStepScale)
          )
        );

        const jitter =
          Math.floor(Math.random() * (chatGlobalBehaviorModify.onlineJitterAbs * 2 + 1)) -
          chatGlobalBehaviorModify.onlineJitterAbs;

        const step = (diff > 0 ? 1 : -1) * (stepBase + jitter);
        const next = current + step;
        return Math.max(minFloor, next);
      });
    };

    const interval = window.setInterval(
      tick,
      chatGlobalBehaviorModify.onlineTickBaseMs +
        Math.floor(Math.random() * chatGlobalBehaviorModify.onlineTickJitterMs)
    );

    return () => {
      window.clearInterval(interval);
    };
  }, [open, realOnlineCount]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (!roomMenuRef.current?.contains(target)) {
        setIsRoomMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length, open]);

  const buildOptimisticMessage = useCallback(
    (text: string): ChatMessage | null => {
      if (!user) return null;

      const previousSelfMessage = [...messages].reverse().find((message) => message.userId === user.id);
      const metadata = (user.user_metadata || {}) as {
        full_name?: string;
        name?: string;
        user_name?: string;
        username?: string;
        avatar_url?: string;
      };

      const displayNameFromMetadata =
        (typeof metadata.full_name === "string" && metadata.full_name.trim()) ||
        (typeof metadata.name === "string" && metadata.name.trim()) ||
        (typeof metadata.user_name === "string" && metadata.user_name.trim()) ||
        (typeof metadata.username === "string" && metadata.username.trim()) ||
        `User ${user.id.slice(0, 6)}`;

      const handleFromMetadata =
        (typeof metadata.user_name === "string" && metadata.user_name.trim()) ||
        (typeof metadata.username === "string" && metadata.username.trim()) ||
        user.id.slice(0, 8);

      return {
        id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userId: user.id,
        text,
        createdAt: new Date().toISOString(),
        displayName: previousSelfMessage?.displayName || displayNameFromMetadata,
        handle: (previousSelfMessage?.handle || handleFromMetadata).replace(/^@+/, ""),
        avatarUrl:
          previousSelfMessage?.avatarUrl ||
          (typeof metadata.avatar_url === "string" ? metadata.avatar_url : null),
        memberSince: previousSelfMessage?.memberSince || null,
        isSeller: previousSelfMessage?.isSeller ?? false,
        isBuyer: previousSelfMessage?.isBuyer ?? true,
        isPending: true,
      };
    },
    [messages, user]
  );

  const handleSend = useCallback(async () => {
    if (!canWrite || isSending) return;
    const text = draft.trim();
    if (!text) return;

    const optimisticMessage = buildOptimisticMessage(text);
    const optimisticId = optimisticMessage?.id || null;
    if (optimisticMessage) {
      setMessages((previous) => [...previous, optimisticMessage]);
    }
    setDraft("");
    setIsSending(true);
    setErrorText(null);

    try {
      const response = await fetch("/api/global-chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room: activeRoom,
          message: text,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            message?: string;
            data?: {
              id: string;
              user_id: string;
              room: string;
              message: string;
              created_at: string;
            };
          }
        | null;

      if (!response.ok || !payload?.ok) {
        if (optimisticId) {
          setMessages((previous) => previous.filter((message) => message.id !== optimisticId));
        }
        setDraft(text);
        setErrorText(payload?.message ?? "Unable to send message.");
        return;
      }

      if (optimisticId && payload.data?.id) {
        setMessages((previous) =>
          previous.map((message) =>
            message.id === optimisticId
              ? {
                  ...message,
                  id: payload.data?.id || message.id,
                  text: payload.data?.message || message.text,
                  createdAt: payload.data?.created_at || message.createdAt,
                  isPending: false,
                }
              : message
          )
        );
      } else if (!payload.data?.id) {
        // Fallback only if the server didn't return the inserted row.
        void loadMessages();
      }
    } catch {
      if (optimisticId) {
        setMessages((previous) => previous.filter((message) => message.id !== optimisticId));
      }
      setDraft(text);
      setErrorText("Unable to send message.");
    } finally {
      setIsSending(false);
    }
  }, [activeRoom, buildOptimisticMessage, canWrite, draft, isSending, loadMessages]);

  const handleRoomChange = useCallback((nextRoom: GlobalChatRoom) => {
    setActiveRoom(nextRoom);
    setIsRoomMenuOpen(false);
    setErrorText(null);
    setSelectedUserProfile(null);
  }, []);

  const renderRoomIcon = useCallback((room: GlobalChatRoom, iconClassName = "h-4 w-4") => {
    const normalizedIconClass = iconClassName.includes("h-3.5")
      ? "h-3.5 w-5"
      : iconClassName.includes("h-4")
      ? "h-4 w-6"
      : iconClassName;

    switch (room) {
      case "global":
        return <Globe2 className={normalizedIconClass} aria-hidden="true" />;
      case "buy-services":
        return <ShoppingBag className={normalizedIconClass} aria-hidden="true" />;
      case "sell-services":
        return <BriefcaseBusiness className={normalizedIconClass} aria-hidden="true" />;
      case "crypto-talk":
        return <Coins className={normalizedIconClass} aria-hidden="true" />;
      case "help":
        return <LifeBuoy className={normalizedIconClass} aria-hidden="true" />;
      case "english":
      case "spanish":
      case "polish":
      case "russian":
      case "ukrainian":
      case "turkish":
      case "romanian":
      case "portuguese-br": {
        const Flag = LANGUAGE_ROOM_FLAG_BY_SLUG[room];
        return (
          <Flag
            aria-hidden="true"
            className={cn(
              "rounded-[3px] border-0 bg-transparent",
              iconClassName.includes("h-3.5") ? "h-3.5 w-5" : "h-4 w-6"
            )}
          />
        );
      }
      default:
        return <Globe2 className={normalizedIconClass} aria-hidden="true" />;
    }
  }, []);

  return (
    <aside
      style={{
        ...cssVars,
        ...panelStyle,
      }}
      className={cn(chatGlobalClassModify.panel, className)}
    >
      <div className={chatGlobalComponentClassModify.headerLayer}>
        <HomepageChatHeader
          onOpenMobileSidebar={() => {}}
          roomMenuRef={roomMenuRef}
          isRoomMenuOpen={isRoomMenuOpen}
          onToggleRoomMenu={() => setIsRoomMenuOpen((prev) => !prev)}
          activeRoom={activeRoom}
          activeRoomLabel={activeRoomLabel}
          rooms={GLOBAL_CHAT_ROOMS}
          onRoomChange={handleRoomChange}
          renderRoomIcon={renderRoomIcon}
          onOpenRules={() => setIsRulesOpen((prev) => !prev)}
          onCloseChat={onClose}
        />
      </div>

      <div ref={listRef} className={chatGlobalComponentClassModify.messageList}>
        {isLoading && messages.length === 0 ? (
          <div className={chatGlobalComponentClassModify.stateCard} style={stateCardStyle}>
            Loading chat...
          </div>
        ) : messages.length === 0 ? (
          <div className={chatGlobalComponentClassModify.stateCard} style={stateCardStyle}>
            No messages yet in this room.
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={chatGlobalComponentClassModify.messageCard} style={messageCardStyle}>
              <div className={chatGlobalComponentClassModify.messageRow}>
                <Avatar size="default" className={chatGlobalComponentClassModify.messageAvatar}>
                  <AvatarImage src={message.avatarUrl || undefined} alt={message.displayName} />
                  <AvatarFallback className={chatGlobalComponentClassModify.messageAvatarFallback}>
                    {getAvatarFallback(message.displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className={chatGlobalComponentClassModify.messageBody}>
                  <div className={chatGlobalComponentClassModify.messageHeader}>
                    <button
                      type="button"
                      onClick={() => setSelectedUserProfile(message)}
                      className={cn(
                        chatGlobalComponentClassModify.messageDisplayName,
                        "cursor-pointer text-left transition hover:underline"
                      )}
                    >
                      {message.displayName}
                    </button>
                    <span className={chatGlobalComponentClassModify.messageTime}>{formatTime(message.createdAt)}</span>
                  </div>
                  <p className={chatGlobalComponentClassModify.messageText}>{message.text}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className={chatGlobalComponentClassModify.composerShell} style={composerShellStyle}>
        {isRulesOpen ? (
          <div className={chatGlobalComponentClassModify.rulesCard} style={rulesCardStyle}>
            <div className={chatGlobalComponentClassModify.rulesHeader}>
              <span className={chatGlobalComponentClassModify.rulesTitle}>Chat Rules</span>
              <button
                type="button"
                onClick={() => setIsRulesOpen(false)}
                className={chatGlobalComponentClassModify.rulesCloseButton}
                aria-label="Close rules"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ul className={chatGlobalComponentClassModify.rulesList}>
              <li>No spamming</li>
              <li>No advertising</li>
              <li>Zero tolerance for harassment</li>
              <li>No posting external links</li>
            </ul>
            <div className={chatGlobalComponentClassModify.rulesActionWrap}>
              <Button
                onClick={() => {
                  try {
                    localStorage.setItem("global_chat_rules_accepted", "1");
                    window.dispatchEvent(new Event("global_chat_rules_accepted_change"));
                  } catch {}
                  setHasAcceptedRules(true);
                  setIsRulesOpen(false);
                }}
                className={chatGlobalComponentClassModify.rulesAcceptButton}
              >
                Accept Rules
              </Button>
            </div>
          </div>
        ) : null}

        {errorText ? (
          <div className={chatGlobalComponentClassModify.errorCard} style={errorCardStyle}>
            {errorText}
          </div>
        ) : null}

        <div className={chatGlobalComponentClassModify.inputRow}>
          <div className={chatGlobalComponentClassModify.inputWrap}>
            <input
              ref={inputRef}
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
              }}
              maxLength={chatGlobalBehaviorModify.maxMessageLength}
              onFocus={() => {
                if (!user) return;
                if (!hasAcceptedRules) {
                  setIsRulesOpen(true);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleSend();
                }
              }}
              placeholder={canWrite ? "Type your message..." : "Login to write in chat"}
              readOnly={!canWrite}
              disabled={!canWrite || isSending}
              className={cn(
                chatGlobalComponentClassModify.inputBase,
                canWrite
                  ? chatGlobalComponentClassModify.inputCanWrite
                  : chatGlobalComponentClassModify.inputReadOnly
              )}
              style={inputStyle}
            />

            <AnimatePresence>
              {draft.trim().length > 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: chatGlobalBehaviorModify.sendButtonMotionDuration }}
                  className={chatGlobalComponentClassModify.sendButtonWrap}
                >
                  <Button
                    onClick={() => {
                      void handleSend();
                    }}
                    disabled={!canWrite || isSending}
                    className={chatGlobalComponentClassModify.sendButton}
                    style={sendButtonStyle}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 19V5M12 5L5 12M12 5L19 12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Send
                  </Button>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>

        <div className={chatGlobalComponentClassModify.statusRow}>
          <span className={chatGlobalComponentClassModify.statusOnline}>
            <svg
              width="256px"
              height="256px"
              viewBox="0 0 24.00 24.00"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              stroke="var(--gc-footer-online-dot-stroke)"
              strokeWidth="0.40800000000000003"
              className={chatGlobalComponentClassModify.statusOnlineDotIcon}
            >
              <g strokeWidth="0" />
              <g strokeLinecap="round" strokeLinejoin="round" />
              <g>
                <path
                  d="M12 9.5C13.3807 9.5 14.5 10.6193 14.5 12C14.5 13.3807 13.3807 14.5 12 14.5C10.6193 14.5 9.5 13.3807 9.5 12C9.5 10.6193 10.6193 9.5 12 9.5Z"
                  fill="var(--gc-footer-online-dot)"
                />
              </g>
            </svg>
            {`Online: ${displayOnlineCount.toLocaleString("en-US")}`}
          </span>

          {!user ? (
            <Link
              href={`/auth?next=${encodeURIComponent(pathname || "/")}`}
              className={chatGlobalComponentClassModify.statusSignInLink}
            >
              <LogIn className="h-3.5 w-3.5" />
              Sign in to write
            </Link>
          ) : (
            <span className={chatGlobalComponentClassModify.statusCounter}>
              {draft.length}/{chatGlobalBehaviorModify.maxMessageLength}
            </span>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedUserProfile ? (
          <motion.div
            key="chat-user-sheet"
            initial={{ y: "100%" }}
            animate={{ y: "0%" }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className={chatGlobalComponentClassModify.userSheetPanel}
            style={userSheetStyle}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar size="default" className={chatGlobalComponentClassModify.userSheetAvatar}>
                  <AvatarImage
                    src={selectedUserProfileData?.avatarUrl || selectedUserProfile.avatarUrl || undefined}
                    alt={selectedUserProfile.displayName}
                  />
                  <AvatarFallback className={chatGlobalComponentClassModify.messageAvatarFallback}>
                    {getAvatarFallback(selectedUserProfile.displayName)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => {
                      const targetUserId = selectedUserProfileData?.userId || selectedUserProfile.userId;
                      setSelectedUserProfile(null);
                      router.push(`/profile/${targetUserId}`);
                    }}
                    className={chatGlobalComponentClassModify.userSheetDisplayName}
                  >
                    {selectedUserProfile.displayName}
                  </button>
                  <p className={chatGlobalComponentClassModify.userSheetHandle}>
                    @{selectedUserProfileData?.handle || selectedUserProfile.handle}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedUserProfile(null)}
                className={chatGlobalComponentClassModify.rulesCloseButton}
                aria-label="Close user profile"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {isSelectedUserProfileLoading ? (
              <p className={chatGlobalComponentClassModify.userSheetLoading}>Loading profile...</p>
            ) : (
              <div className={chatGlobalComponentClassModify.userSheetBody}>
                <p>
                  <span className={chatGlobalComponentClassModify.userSheetLabel}>Member since:</span>{" "}
                  {formatDateLabel(selectedUserProfileData?.memberSince || selectedUserProfile.memberSince || null)}
                </p>
                <p>
                  <span className={chatGlobalComponentClassModify.userSheetLabel}>Roles:</span>{" "}
                  {selectedUserProfileData?.isSeller && selectedUserProfileData?.isBuyer
                    ? "Seller, Buyer"
                    : selectedUserProfileData?.isSeller
                    ? "Seller"
                    : "Buyer"}
                </p>
                {selectedUserProfileData?.isSeller ? (
                  <p>
                    <span className={chatGlobalComponentClassModify.userSheetLabel}>Seller status:</span>{" "}
                    {selectedUserProfileData.sellerStatus || "Standard"}
                  </p>
                ) : null}
                <p>
                  <span className={chatGlobalComponentClassModify.userSheetLabel}>Total messages:</span>{" "}
                  {selectedUserProfileData?.totalMessages ?? 0}
                </p>
                {selectedUserProfileData?.isBuyer ? (
                  <p>
                    <span className={chatGlobalComponentClassModify.userSheetLabel}>Purchases:</span>{" "}
                    {selectedUserProfileData?.purchasesCount ?? "Private"}
                  </p>
                ) : null}
                {selectedUserProfileData?.isBuyer ? (
                  <p>
                    <span className={chatGlobalComponentClassModify.userSheetLabel}>Buyer ranking:</span>{" "}
                    {selectedUserProfileData?.buyerRanking ?? "Private"}
                  </p>
                ) : null}
                <p>
                  <span className={chatGlobalComponentClassModify.userSheetLabel}>Last active:</span>{" "}
                  {selectedUserProfileData?.lastMessageAt
                    ? `${formatDateLabel(selectedUserProfileData.lastMessageAt)} (${formatRelativeTime(selectedUserProfileData.lastMessageAt)})`
                    : "Unknown"}
                </p>
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </aside>
  );
}
