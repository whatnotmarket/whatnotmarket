"use client";

import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Group,
  Panel,
  type GroupImperativeHandle,
  type PanelImperativeHandle,
} from "react-resizable-panels";
import {
  ArrowDown,
  ArrowLeft,
  BarChart3,
  Briefcase,
  ClipboardList,
  Cpu,
  Gem,
  Globe2,
  House,
  LayoutDashboard,
  LifeBuoy,
  LogIn,
  Package,
  Reply,
  Shirt,
  Store,
  TrendingUp,
  Wallet,
  Wrench,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { authToast as toast } from "@/lib/notifications";
import { GLOBAL_CHAT_ROOMS, type GlobalChatRoom } from "@/lib/chat/global-chat-config";
import Image from "next/image";
import { useCrypto, CRYPTO_CURRENCIES } from "@/contexts/CryptoContext";
import EnglishFlag from "@/flag/english.png";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { HomepageMobileSidebar } from "./components/HomepageMobileSidebar";
import { HomepageDesktopSidebar } from "./components/HomepageDesktopSidebar";
import { HomepageCenterPanel } from "./components/HomepageCenterPanel";
import { HomepageChatHeader } from "./components/HomepageChatHeader";
import { HomepagePanelResizeHandle } from "./components/HomepagePanelResizeHandle";
import type {
  GlobalChatMessage,
  GlobalChatRow,
  MentionContext,
  MentionableUser,
  PostChatResponse,
  PresencePayload,
  ProfileRef,
  SidebarMode,
  SellSidebarSection,
  SellSidebarSectionKey,
} from "./types";

const GlobalCommandSearch = dynamic(
  () => import("@/components/search/GlobalCommandSearch").then((mod) => mod.GlobalCommandSearch),
  { ssr: false }
);

const PROFILE_SELECT = "username,full_name,avatar_url,created_at,role_preference,seller_status";
const MESSAGE_SELECT = `id,user_id,room,message,created_at,reply_to_id,mentioned_handles,is_deleted,profiles!global_chat_messages_user_id_fkey(${PROFILE_SELECT})`;
const LEGACY_MESSAGE_SELECT = `id,user_id,room,message,created_at,is_deleted,profiles!global_chat_messages_user_id_fkey(${PROFILE_SELECT})`;

const LEFT_SIDEBAR_CLOSED_STORAGE_KEY = "global_chat_left_sidebar_closed";
const CHAT_EXPANDED_STORAGE_KEY = "global_chat_expanded";
const CHAT_CLOSED_STORAGE_KEY = "global_chat_closed";
const SIDEBAR_MODE_STORAGE_KEY = "global_chat_sidebar_mode";
const HOMEPAGE_LAYOUT_PERSISTENCE_ID = "homepage-layout-panels-v3";
const HOMEPAGE_LAYOUT_DEFAULT = {
  "homepage-left": 20,
  "homepage-center": 60,
  "homepage-right": 20,
} as const;
const PANEL_CLOSE_THRESHOLD_PERCENT = 2;
const PANEL_REOPEN_THRESHOLD_PERCENT = 4;

function sanitizeHomepageLayout(layout: Record<string, unknown> | null | undefined) {
  if (!layout) return null;
  const left = Number(layout["homepage-left"]);
  const center = Number(layout["homepage-center"]);
  const right = Number(layout["homepage-right"]);
  if (!Number.isFinite(left) || !Number.isFinite(center) || !Number.isFinite(right)) return null;
  const sum = left + center + right;
  const isLeftValid = left === 0 || (left >= 16 && left <= 28);
  const isRightValid = right === 0 || (right >= 14 && right <= 50);
  const isValid =
    isLeftValid &&
    center >= 34 &&
    isRightValid &&
    Math.abs(sum - 100) <= 0.5;
  if (!isValid) return null;
  return {
    "homepage-left": left,
    "homepage-center": center,
    "homepage-right": right,
  } as const;
}
const PRIMARY_ROOMS: GlobalChatRoom[] = ["global", "buy-services", "sell-services", "crypto-talk"];
const COMMUNITY_ROOMS: GlobalChatRoom[] = ["help", "english"];
const MARKETPLACE_CATEGORIES = [
  { label: "Electronics", href: "/category/electronics" },
  { label: "Fashion", href: "/category/fashion" },
  { label: "Home & Garden", href: "/category/home-garden" },
  { label: "Collectibles", href: "/category/collectibles" },
  { label: "Services", href: "/category/services" },
] as const;
const SELL_SIDEBAR_SECTIONS = [
  {
    key: "seller-hub",
    label: "Seller Hub",
    tabs: ["Dashboard", "Create Listing", "Drafts", "Templates"],
  },
  {
    key: "inventory",
    label: "Inventory",
    tabs: ["Active Listings", "Scheduled", "Sold", "Archived"],
  },
  {
    key: "orders",
    label: "Orders",
    tabs: ["New Orders", "In Escrow", "In Delivery", "Completed", "Disputes"],
  },
  {
    key: "payouts",
    label: "Payouts",
    tabs: ["Wallets", "Payout Methods", "Fees", "Invoices", "Tax Reports"],
  },
  {
    key: "growth",
    label: "Growth",
    tabs: ["Promotions", "Boost Listing", "Featured", "Affiliates"],
  },
  {
    key: "reputation-compliance",
    label: "Reputation",
    tabs: ["Verification", "Reviews", "Policy Center", "Claims"],
  },
  {
    key: "analytics",
    label: "Analytics",
    tabs: ["Revenue", "Conversion", "Top Listings", "Buyer Insights"],
  },
] as const;

function toSidebarSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function getSellTabId(sectionKey: SellSidebarSectionKey, tabLabel: string) {
  return `${sectionKey}:${toSidebarSlug(tabLabel)}`;
}

const SELL_DEFAULT_ACTIVE_TAB = getSellTabId(
  SELL_SIDEBAR_SECTIONS[0].key,
  SELL_SIDEBAR_SECTIONS[0].tabs[0]
);
const SELL_DEFAULT_OPEN_STATE = SELL_SIDEBAR_SECTIONS.reduce(
  (acc, section, index) => {
    acc[section.key] = index === 0;
    return acc;
  },
  {} as Record<SellSidebarSectionKey, boolean>
);
const SIDEBAR_ROW_GRID_CLASS = "grid-cols-[1.75rem_minmax(0,1fr)_auto]";
const SIDEBAR_ICON_BOX_CLASS = "grid h-7 w-7 shrink-0 place-items-center rounded-xl";
const GUEST_PRIMARY_ROOMS: GlobalChatRoom[] = ["global", "buy-services", "crypto-talk"];
const GUEST_COMMUNITY_ROOMS: GlobalChatRoom[] = ["help", "english"];

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

function SectionChevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 -4.5 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn(
        "h-3 w-3 drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)] transition-transform",
        open ? "" : "rotate-180"
      )}
    >
      <path
        fill="currentColor"
        d="M23.345 10.39L13.615-.4c-.448-.45-1.045-.65-1.631-.61-.586-.04-1.182.16-1.63.61L.624 10.39c-.827.83-.827 2.18 0 3.01.828.83 2.169.83 2.997 0l8.363-9.27 8.365 9.27c.827.83 2.169.83 2.996 0 .827-.83.827-2.18 0-3.01z"
      />
    </svg>
  );
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
    const segments = part.split(
      /(https?:\/\/[^\s)]+|\bwww\.[^\s)]+|\b[a-z0-9.-]+\.(?:market|com)(?:\/[^\s)]*)?)/g
    );
    return segments.map((seg, j) => {
      if (seg.startsWith("http") || seg.startsWith("www.") || /\.[a-z]/i.test(seg)) {
        try {
          const href = seg.startsWith("http")
            ? seg
            : seg.startsWith("www.")
            ? `https://${seg}`
            : `https://${seg}`;
          const url = new URL(href);
          const host = url.hostname.toLowerCase();
          const allowed = new Set<string>([
            "openlymarket.market",
            "www.openlymarket.market",
            "openlymarket.com",
            "www.openlymarket.com",
            "localhost",
            "127.0.0.1",
          ]);
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.AUTH0_BASE_URL || "";
          if (appUrl) {
            const u = new URL(appUrl);
            if (u.hostname) allowed.add(u.hostname.toLowerCase());
          }
          const isAllowed =
            allowed.has(host) ||
            Array.from(allowed).some((root) => host === root || host.endsWith(`.${root}`));
          if (isAllowed) {
            return (
              <a
                key={`link-${index}-${j}`}
                href={href}
                className="underline text-zinc-200 hover:text-white break-words"
              >
                {url.href}
              </a>
            );
          }
        } catch {
          /* noop */
        }
      }
      return <span key={`text-${index}-${j}`}>{seg}</span>;
    });
  });
}

export function HomepageClient() {
  const isMobile = useIsMobile();
  const supabase = useMemo(() => createClient(), []);
  const { user, isLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const [stablePathname, setStablePathname] = useState("/");

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
  const [isLeftSidebarClosed, setIsLeftSidebarClosed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>("buy");
  const [isMarketplaceSectionOpen, setIsMarketplaceSectionOpen] = useState(true);
  const [isRoomsSectionOpen, setIsRoomsSectionOpen] = useState(true);
  const [isCommunitySectionOpen, setIsCommunitySectionOpen] = useState(false);
  const [openSellSections, setOpenSellSections] = useState<Record<SellSidebarSectionKey, boolean>>(
    () => ({ ...SELL_DEFAULT_OPEN_STATE })
  );
  const [activeSellTabId, setActiveSellTabId] = useState(SELL_DEFAULT_ACTIVE_TAB);
  const [isChatClosed, setIsChatClosed] = useState(false);
  const [slowModeMinutes, setSlowModeMinutes] = useState<number>(0);
  const [isModerator, setIsModerator] = useState<boolean>(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [hasAcceptedRules, setHasAcceptedRules] = useState(false);
  const [mutedUntilTs, setMutedUntilTs] = useState<number>(0);
  const [isBanned, setIsBanned] = useState<boolean>(false);
  const [roomSlowSeconds, setRoomSlowSeconds] = useState<number>(0);
  const [slowRemainingSeconds, setSlowRemainingSeconds] = useState<number>(0);
  const [closedUntilTs, setClosedUntilTs] = useState<number>(0);
  const [closedRemainingSeconds, setClosedRemainingSeconds] = useState<number>(0);

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const roomMenuRef = useRef<HTMLDivElement | null>(null);
  const panelGroupRef = useRef<GroupImperativeHandle | null>(null);
  const leftPanelRef = useRef<PanelImperativeHandle | null>(null);
  const rightPanelRef = useRef<PanelImperativeHandle | null>(null);
  const layoutPersistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rightPanelPercentRafRef = useRef<number | null>(null);
  const rightPanelOpenAnimRafRef = useRef<number | null>(null);
  const pendingRightPanelPercentRef = useRef<number | null>(null);
  const isRestoringLayoutRef = useRef(true);
  const [isDesktopLayoutReady, setIsDesktopLayoutReady] = useState(false);
  const [rightPanelPercent, setRightPanelPercent] = useState<number>(HOMEPAGE_LAYOUT_DEFAULT["homepage-right"]);
  const isLeftSidebarClosedRef = useRef(false);
  const isChatClosedRef = useRef(false);
  const rightPanelPercentRef = useRef<number>(HOMEPAGE_LAYOUT_DEFAULT["homepage-right"]);
  const isLoggedIn = Boolean(user);
  const canWrite = useMemo(() => {
    if (!user) return false;
    if (isBanned) return false;
    if (mutedUntilTs && mutedUntilTs > Date.now()) return false;
    if (slowRemainingSeconds > 0) return false;
    if (closedUntilTs && closedUntilTs > Date.now()) return false;
    const { isSeller, isBuyer } = resolveRoles(currentProfile);
    const isThreadReply = Boolean(replyTarget);
    if (activeRoom === "sell-services") {
      return isThreadReply ? isSeller || isBuyer : isSeller;
    }
    if (activeRoom === "buy-services") {
      return isThreadReply ? isSeller || isBuyer : isBuyer;
    }
    if (activeRoom === "help") {
      if (isThreadReply) {
        return isModerator;
      }
      return slowModeMinutes <= 0;
    }
    return true;
  }, [activeRoom, currentProfile, replyTarget, slowModeMinutes, user, isModerator, isBanned, mutedUntilTs, slowRemainingSeconds, closedUntilTs]);

  const activeRoomLabel =
    GLOBAL_CHAT_ROOMS.find((room) => room.slug === activeRoom)?.label || "English";

  const expandedRightPanelPercent = useMemo(() => (isChatExpanded ? 30 : 20), [isChatExpanded]);
  const isChatCompact = useMemo(
    () => !isMobile && !isChatClosed && rightPanelPercent <= 19,
    [isChatClosed, isMobile, rightPanelPercent]
  );

  const animateRightPanelTo = useCallback((targetPercent: number, durationMs = 240) => {
    if (typeof window === "undefined") return;
    if (rightPanelOpenAnimRafRef.current !== null) {
      window.cancelAnimationFrame(rightPanelOpenAnimRafRef.current);
      rightPanelOpenAnimRafRef.current = null;
    }
    const startPercent = Math.max(0, rightPanelPercentRef.current);
    const delta = targetPercent - startPercent;
    if (Math.abs(delta) < 0.2) {
      rightPanelRef.current?.resize(targetPercent);
      rightPanelPercentRef.current = targetPercent;
      setRightPanelPercent(targetPercent);
      return;
    }
    const startTime = performance.now();
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const step = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / durationMs);
      const eased = easeOutCubic(t);
      const next = startPercent + delta * eased;
      rightPanelRef.current?.resize(next);
      rightPanelPercentRef.current = next;
      setRightPanelPercent(next);
      if (t < 1) {
        rightPanelOpenAnimRafRef.current = window.requestAnimationFrame(step);
        return;
      }
      rightPanelOpenAnimRafRef.current = null;
    };

    rightPanelOpenAnimRafRef.current = window.requestAnimationFrame(step);
  }, []);

  useEffect(() => {
    isLeftSidebarClosedRef.current = isLeftSidebarClosed;
  }, [isLeftSidebarClosed]);

  useEffect(() => {
    isChatClosedRef.current = isChatClosed;
  }, [isChatClosed]);

  const handlePanelLayoutChanged = useCallback(
    (layout: Record<string, number>) => {
      if (typeof window === "undefined") return;
      if (!isMobile && isRestoringLayoutRef.current) return;

      if (!isMobile) {
        const leftSize = Number(layout["homepage-left"]);
        if (Number.isFinite(leftSize)) {
          const shouldCloseLeft = leftSize <= PANEL_CLOSE_THRESHOLD_PERCENT;
          const shouldReopenLeft = leftSize >= PANEL_REOPEN_THRESHOLD_PERCENT;
          if (!isLeftSidebarClosedRef.current && shouldCloseLeft) {
            isLeftSidebarClosedRef.current = true;
            setIsLeftSidebarClosed(true);
          } else if (isLeftSidebarClosedRef.current && shouldReopenLeft) {
            isLeftSidebarClosedRef.current = false;
            setIsLeftSidebarClosed(false);
          }
        }

        const rightSize = Number(layout["homepage-right"]);
        if (Number.isFinite(rightSize)) {
          if (Math.abs(rightSize - rightPanelPercentRef.current) >= 0.35) {
            rightPanelPercentRef.current = rightSize;
            pendingRightPanelPercentRef.current = rightSize;
            if (rightPanelPercentRafRef.current === null) {
              rightPanelPercentRafRef.current = window.requestAnimationFrame(() => {
                rightPanelPercentRafRef.current = null;
                if (pendingRightPanelPercentRef.current !== null) {
                  setRightPanelPercent(pendingRightPanelPercentRef.current);
                  pendingRightPanelPercentRef.current = null;
                }
              });
            }
          }

          const shouldCloseRight = rightSize <= PANEL_CLOSE_THRESHOLD_PERCENT;
          const shouldReopenRight = rightSize >= PANEL_REOPEN_THRESHOLD_PERCENT;
          if (!isChatClosedRef.current && shouldCloseRight) {
            isChatClosedRef.current = true;
            setIsChatClosed(true);
          } else if (isChatClosedRef.current && shouldReopenRight) {
            isChatClosedRef.current = false;
            setIsChatClosed(false);
          }
        }
      }

      const sanitized = sanitizeHomepageLayout(layout);
      if (!sanitized) return;
      if (layoutPersistTimerRef.current) clearTimeout(layoutPersistTimerRef.current);
      layoutPersistTimerRef.current = setTimeout(() => {
        try {
          window.localStorage.setItem(HOMEPAGE_LAYOUT_PERSISTENCE_ID, JSON.stringify(sanitized));
        } catch {}
        layoutPersistTimerRef.current = null;
      }, 120);
    },
    [isMobile]
  );

  const collapseLeftSidebar = useCallback(() => {
    isLeftSidebarClosedRef.current = true;
    setIsLeftSidebarClosed(true);
    if (!isMobile) {
      leftPanelRef.current?.collapse();
    }
  }, [isMobile]);

  const expandLeftSidebar = useCallback(() => {
    isLeftSidebarClosedRef.current = false;
    setIsLeftSidebarClosed(false);
    if (!isMobile) {
      leftPanelRef.current?.expand();
      leftPanelRef.current?.resize("20%");
    }
  }, [isMobile]);

  const closeChatPanel = useCallback(() => {
    isChatClosedRef.current = true;
    setIsChatClosed(true);
    if (!isMobile) {
      const layout = panelGroupRef.current?.getLayout();
      if (layout) {
        const left = Number(layout["homepage-left"]);
        const center = Number(layout["homepage-center"]);
        if (Number.isFinite(left) && Number.isFinite(center)) {
          panelGroupRef.current?.setLayout({
            "homepage-left": left,
            "homepage-center": Math.max(34, center + Number(layout["homepage-right"] || 0)),
            "homepage-right": 0,
          });
        }
      }
      rightPanelRef.current?.collapse();
    }
  }, [isMobile]);

  const reopenChatPanel = useCallback(() => {
    isChatClosedRef.current = false;
    setIsChatClosed(false);
    if (!isMobile) {
      const current = panelGroupRef.current?.getLayout();
      const currentLeft = Number(current?.["homepage-left"]);
      const safeLeft = Number.isFinite(currentLeft) ? Math.min(28, Math.max(0, currentLeft)) : 20;
      const targetRight = expandedRightPanelPercent;
      const nextCenter = Math.max(34, 100 - safeLeft - targetRight);
      const nextRight = Math.max(14, 100 - safeLeft - nextCenter);

      panelGroupRef.current?.setLayout({
        "homepage-left": safeLeft,
        "homepage-center": nextCenter,
        "homepage-right": nextRight,
      });
      rightPanelRef.current?.expand();
      rightPanelRef.current?.resize(nextRight);
      rightPanelPercentRef.current = nextRight;
      setRightPanelPercent(nextRight);
      window.requestAnimationFrame(() => {
        animateRightPanelTo(nextRight, 220);
      });
      return;
    }
  }, [animateRightPanelTo, expandedRightPanelPercent, isMobile]);

  const toggleChatExpanded = useCallback(() => {
    setIsChatExpanded((prev) => !prev);
  }, []);

  useEffect(() => {
    setStablePathname(pathname || "/");
  }, [pathname]);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const previousRootBackground = root.style.backgroundColor;
    const previousBodyBackground = body.style.backgroundColor;

    root.style.backgroundColor = "#101219";
    body.style.backgroundColor = "#101219";

    return () => {
      root.style.backgroundColor = previousRootBackground;
      body.style.backgroundColor = previousBodyBackground;
    };
  }, []);

  useEffect(() => {
    try {
      const flag = localStorage.getItem("global_chat_rules_accepted") === "1";
      setHasAcceptedRules(Boolean(flag));
    } catch {}
  }, []);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    isRestoringLayoutRef.current = true;
    setIsDesktopLayoutReady(false);

    let nextLeftClosed = false;
    let nextChatClosed = false;
    let nextChatExpanded = false;
    let nextSidebarMode: SidebarMode = "buy";

    try {
      nextLeftClosed = localStorage.getItem(LEFT_SIDEBAR_CLOSED_STORAGE_KEY) === "1";
      nextChatClosed = localStorage.getItem(CHAT_CLOSED_STORAGE_KEY) === "1";
      nextChatExpanded = localStorage.getItem(CHAT_EXPANDED_STORAGE_KEY) === "1";
      const storedSidebarMode = localStorage.getItem(SIDEBAR_MODE_STORAGE_KEY);
      if (storedSidebarMode === "buy" || storedSidebarMode === "sell") {
        nextSidebarMode = storedSidebarMode;
      }
    } catch {}

    if (!isMobile) {
      try {
        const raw = window.localStorage.getItem(HOMEPAGE_LAYOUT_PERSISTENCE_ID);
        if (raw) {
          const parsed = JSON.parse(raw) as Record<string, unknown>;
          const sanitized = sanitizeHomepageLayout(parsed);
          if (sanitized) {
            panelGroupRef.current?.setLayout(sanitized);
            if (sanitized["homepage-left"] <= PANEL_CLOSE_THRESHOLD_PERCENT) {
              nextLeftClosed = true;
            }
            if (sanitized["homepage-right"] <= PANEL_CLOSE_THRESHOLD_PERCENT) {
              nextChatClosed = true;
            }
            rightPanelPercentRef.current = sanitized["homepage-right"];
            setRightPanelPercent(sanitized["homepage-right"]);
          }
        }
      } catch {}
    }

    isLeftSidebarClosedRef.current = nextLeftClosed;
    isChatClosedRef.current = nextChatClosed;
    setIsLeftSidebarClosed(nextLeftClosed);
    setIsChatClosed(nextChatClosed);
    setIsChatExpanded(nextChatExpanded);
    setSidebarMode(nextSidebarMode);

    if (!isMobile) {
      const rafId = window.requestAnimationFrame(() => {
        if (nextLeftClosed) leftPanelRef.current?.collapse();
        if (nextChatClosed) rightPanelRef.current?.collapse();
        window.requestAnimationFrame(() => {
          isRestoringLayoutRef.current = false;
          setIsDesktopLayoutReady(true);
        });
      });
      return () => {
        window.cancelAnimationFrame(rafId);
      };
    }

    isRestoringLayoutRef.current = false;
    setIsDesktopLayoutReady(true);
  }, [isMobile]);

  useEffect(() => {
    if (isRestoringLayoutRef.current) return;
    try {
      localStorage.setItem(LEFT_SIDEBAR_CLOSED_STORAGE_KEY, isLeftSidebarClosed ? "1" : "0");
    } catch {}
  }, [isLeftSidebarClosed]);

  useEffect(() => {
    if (isRestoringLayoutRef.current) return;
    try {
      localStorage.setItem(CHAT_CLOSED_STORAGE_KEY, isChatClosed ? "1" : "0");
    } catch {}
  }, [isChatClosed]);

  useEffect(() => {
    if (isRestoringLayoutRef.current) return;
    try {
      localStorage.setItem(CHAT_EXPANDED_STORAGE_KEY, isChatExpanded ? "1" : "0");
    } catch {}
  }, [isChatExpanded]);

  useEffect(() => {
    if (isRestoringLayoutRef.current) return;
    try {
      localStorage.setItem(SIDEBAR_MODE_STORAGE_KEY, sidebarMode);
    } catch {}
  }, [sidebarMode]);

  useEffect(() => {
    if (isMobile || isChatClosed) return;
    animateRightPanelTo(expandedRightPanelPercent, 220);
  }, [animateRightPanelTo, expandedRightPanelPercent, isChatClosed, isMobile]);

  useEffect(() => {
    return () => {
      if (layoutPersistTimerRef.current) clearTimeout(layoutPersistTimerRef.current);
      if (rightPanelPercentRafRef.current !== null) {
        window.cancelAnimationFrame(rightPanelPercentRafRef.current);
      }
      if (rightPanelOpenAnimRafRef.current !== null) {
        window.cancelAnimationFrame(rightPanelOpenAnimRafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isMobileSidebarOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileSidebarOpen]);

  const requiredRoleText = useMemo(() => {
    const isThreadReply = Boolean(replyTarget);
    if (activeRoom === "sell-services" && !isThreadReply) return "a seller";
    if (activeRoom === "buy-services" && !isThreadReply) return "a buyer";
    if (activeRoom === "help" && isThreadReply) return "a moderator";
    return null;
  }, [activeRoom, replyTarget]);

  const cryptoContext = useCrypto?.();
  const selectedCrypto = cryptoContext?.selectedCrypto ?? "BTC";
  const selectedCryptoData = useMemo(
    () => CRYPTO_CURRENCIES.find((c) => c.code === selectedCrypto) || CRYPTO_CURRENCIES[0],
    [selectedCrypto]
  );

  const handleRoomChange = useCallback((nextRoom: GlobalChatRoom) => {
    setActiveRoom(nextRoom);
    setActiveThreadRootId(null);
    setIsThreadLoading(false);
    setReplyTarget(null);
    setMentionContext(null);
    setActiveMentionIndex(0);
    setIsRoomMenuOpen(false);
    setRoomSlowSeconds(0);
  }, []);

  const primaryRooms = useMemo(() => {
    const allowed = isLoggedIn ? PRIMARY_ROOMS : GUEST_PRIMARY_ROOMS;
    return GLOBAL_CHAT_ROOMS.filter((room) => allowed.includes(room.slug));
  }, [isLoggedIn]);
  const communityRooms = useMemo(() => {
    const allowed = isLoggedIn ? COMMUNITY_ROOMS : GUEST_COMMUNITY_ROOMS;
    return GLOBAL_CHAT_ROOMS.filter((room) => allowed.includes(room.slug));
  }, [isLoggedIn]);
  const visibleBuyRoomsWhenCollapsed = useMemo(
    () => [...primaryRooms, ...communityRooms],
    [communityRooms, primaryRooms]
  );
  const visibleBuyRoomSlugs = useMemo(
    () => new Set(visibleBuyRoomsWhenCollapsed.map((room) => room.slug)),
    [visibleBuyRoomsWhenCollapsed]
  );

  useEffect(() => {
    if (sidebarMode !== "buy") return;
    if (visibleBuyRoomSlugs.has(activeRoom)) return;
    setActiveRoom("global");
  }, [activeRoom, sidebarMode, visibleBuyRoomSlugs]);

  const handleSidebarRoomSelect = useCallback(
    (room: GlobalChatRoom) => {
      handleRoomChange(room);
      setIsMobileSidebarOpen(false);
    },
    [handleRoomChange]
  );

  const renderRoomIcon = useCallback(
    (room: GlobalChatRoom, iconClassName = "h-4 w-4") => {
      switch (room) {
        case "global":
          return (
            <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className={iconClassName} aria-hidden="true">
              <path fill="currentColor" d="M32,0C14.328,0,0,14.328,0,32s14.328,32,32,32s32-14.328,32-32S49.672,0,32,0z M52.812,20.078 c-2.293,1.973-4.105,3.762-7.457,3.887c-2.562,0.094-4.445,0.105-6.359-1.598c-2.727-2.477-0.859-5.777-0.758-9.504 C38.273,11.43,38.512,10.18,38.824,9C44.789,10.766,49.773,14.789,52.812,20.078z M9.867,41.289c2.09-2.031,5.508-3.109,7.949-5.816 c2.492-2.785,2.41-7.836,6.129-7.375c3.039,0.422,2.5,4.23,4.906,6.125c2.836,2.266,6.328,0.824,8.59,3.676 c2.969,3.77,2.277,8.066,0,12.293c-1.676,3.055-3.836,4.137-6.723,5.742C21.316,55.438,13.34,49.555,9.867,41.289z"/>
            </svg>
          );
        case "buy-services":
          return (
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={iconClassName} aria-hidden="true">
              <path d="M4.46785 10.2658C4.47574 10.3372 4.48376 10.4094 4.49187 10.4823L4.61751 11.6131C4.7057 12.4072 4.78218 13.0959 4.91562 13.6455C5.05917 14.2367 5.29582 14.7937 5.78931 15.2354C6.28281 15.6771 6.86251 15.8508 7.46598 15.9281C8.02694 16.0001 8.71985 16 9.51887 16H14.8723C15.4201 16 15.9036 16 16.3073 15.959C16.7448 15.9146 17.1698 15.8162 17.5785 15.5701C17.9872 15.324 18.2731 14.9944 18.5171 14.6286C18.7422 14.291 18.9684 13.8637 19.2246 13.3797L21.7141 8.67734C22.5974 7.00887 21.3879 4.99998 19.5 4.99998L9.39884 4.99998C8.41604 4.99993 7.57525 4.99988 6.90973 5.09287C6.5729 5.13994 6.24284 5.21529 5.93326 5.34375L5.78941 4.04912C5.65979 2.88255 4.67375 2 3.5 2H3C2.44772 2 2 2.44771 2 3C2 3.55228 2.44772 4 3 4H3.5C3.65465 4 3.78456 4.11628 3.80164 4.26998L4.46785 10.2658Z" fill="currentColor"></path>
              <path fillRule="evenodd" clipRule="evenodd" d="M14 19.5C14 18.1193 15.1193 17 16.5 17C17.8807 17 19 18.1193 19 19.5C19 20.8807 17.8807 22 16.5 22C15.1193 22 14 20.8807 14 19.5Z" fill="currentColor"></path>
              <path fillRule="evenodd" clipRule="evenodd" d="M5 19.5C5 18.1193 6.11929 17 7.5 17C8.88071 17 10 18.1193 10 19.5C10 20.8807 8.88071 22 7.5 22C6.11929 22 5 20.8807 5 19.5Z" fill="currentColor"></path>
            </svg>
          );
        case "sell-services":
          return (
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={iconClassName} aria-hidden="true">
              <path fillRule="evenodd" clipRule="evenodd" d="M12.052 1.25H11.948C11.0495 1.24997 10.3003 1.24995 9.70552 1.32991C9.07773 1.41432 8.51093 1.59999 8.05546 2.05546C7.59999 2.51093 7.41432 3.07773 7.32991 3.70552C7.27259 4.13189 7.25637 5.15147 7.25179 6.02566C5.22954 6.09171 4.01536 6.32778 3.17157 7.17157C2 8.34315 2 10.2288 2 14C2 17.7712 2 19.6569 3.17157 20.8284C4.34314 22 6.22876 22 9.99998 22H14C17.7712 22 19.6569 22 20.8284 20.8284C22 19.6569 22 17.7712 22 14C22 10.2288 22 8.34315 20.8284 7.17157C19.9846 6.32778 18.7705 6.09171 16.7482 6.02566C16.7436 5.15147 16.7274 4.13189 16.6701 3.70552C16.5857 3.07773 16.4 2.51093 15.9445 2.05546C15.4891 1.59999 14.9223 1.41432 14.2945 1.32991C13.6997 1.24995 12.9505 1.24997 12.052 1.25ZM15.2479 6.00188C15.2434 5.15523 15.229 4.24407 15.1835 3.9054C15.1214 3.44393 15.0142 3.24644 14.8839 3.11612C14.7536 2.9858 14.5561 2.87858 14.0946 2.81654C13.6116 2.7516 12.964 2.75 12 2.75C11.036 2.75 10.3884 2.7516 9.90539 2.81654C9.44393 2.87858 9.24644 2.9858 9.11612 3.11612C8.9858 3.24644 8.87858 3.44393 8.81654 3.9054C8.771 4.24407 8.75661 5.15523 8.75208 6.00188C9.1435 6 9.55885 6 10 6H14C14.4412 6 14.8565 6 15.2479 6.00188ZM12 9.25C12.4142 9.25 12.75 9.58579 12.75 10V10.0102C13.8388 10.2845 14.75 11.143 14.75 12.3333C14.75 12.7475 14.4142 13.0833 14 13.0833C13.5858 13.0833 13.25 12.7475 13.25 12.3333C13.25 11.9493 12.8242 11.4167 12 11.4167C11.1758 11.4167 10.75 11.9493 10.75 12.3333C10.75 12.7174 11.1758 13.25 12 13.25C13.3849 13.25 14.75 14.2098 14.75 15.6667C14.75 16.857 13.8388 17.7155 12.75 17.9898V18C12.75 18.4142 12.4142 18.75 12 18.75C11.5858 18.75 11.25 18.4142 11.25 18V17.9898C10.1612 17.7155 9.25 16.857 9.25 15.6667C9.25 15.2525 9.58579 14.9167 10 14.9167C10.4142 14.9167 10.75 15.2525 10.75 15.6667C10.75 16.0507 11.1758 16.5833 12 16.5833C12.8242 16.5833 13.25 16.0507 13.25 15.6667C13.25 15.2826 12.8242 14.75 12 14.75C10.6151 14.75 9.25 13.7903 9.25 12.3333C9.25 11.143 10.1612 10.2845 11.25 10.0102V10C11.25 9.58579 11.5858 9.25 12 9.25Z" fill="currentColor"></path>
            </svg>
          );
        case "crypto-talk":
          return (
            <Image
              src={selectedCryptoData.Icon}
              alt={selectedCryptoData.code}
              width={20}
              height={20}
              className={cn(iconClassName, "rounded-full")}
            />
          );
        case "help":
          return (
            <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" className={iconClassName} aria-hidden="true">
              <path fill="currentColor" d="M12 1C6.49 1 2 5.34 2 10.67v4.61a1 1 0 0 0 .69.95l3.89 1.26c1.25.27 2.42-.68 2.42-1.96v-4.05c0-1.27-1.17-2.22-2.42-1.96l-2.55.55C4.35 6.12 7.8 3.01 12 3.01s7.65 3.12 7.97 7.06l-2.55-.55c-1.25-.27-2.42.68-2.42 1.96v4.05c0 1.27 1.17 2.22 2.42 1.96l2.58-.55v1.07c0 1.1-.9 2-2 2h-4v-.5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v1.5c0 .55.45 1 1 1h6c2.21 0 4-1.79 4-4v-7.33c0-5.33-4.49-9.67-10-9.67z"></path>
            </svg>
          );
        case "english":
          return (
            <Image
              src={EnglishFlag}
              alt="English"
              width={20}
              height={20}
              className={cn(iconClassName, "rounded-md")}
            />
          );
        default:
          return <Globe2 className={iconClassName} aria-hidden="true" />;
      }
    },
    [selectedCryptoData.Icon, selectedCryptoData.code]
  );

  const roomBadgeBySlug = useMemo(() => {
    return {
      "crypto-talk": selectedCryptoData.code,
      help: roomSlowSeconds > 0 ? "SLOW" : null,
      english: "LANG",
    } as const;
  }, [roomSlowSeconds, selectedCryptoData.code]);

  const renderMarketplaceIcon = useCallback(
    (href: (typeof MARKETPLACE_CATEGORIES)[number]["href"]) => {
      switch (href) {
        case "/category/electronics":
          return <Cpu className="h-3.5 w-3.5" aria-hidden="true" />;
        case "/category/fashion":
          return <Shirt className="h-3.5 w-3.5" aria-hidden="true" />;
        case "/category/home-garden":
          return <House className="h-3.5 w-3.5" aria-hidden="true" />;
        case "/category/collectibles":
          return <Gem className="h-3.5 w-3.5" aria-hidden="true" />;
        case "/category/services":
          return <Wrench className="h-3.5 w-3.5" aria-hidden="true" />;
        default:
          return <Store className="h-3.5 w-3.5" aria-hidden="true" />;
      }
    },
    []
  );

  const renderRoomNavItem = useCallback(
    (room: (typeof GLOBAL_CHAT_ROOMS)[number], iconOnly = false) => {
      const isActive = room.slug === activeRoom;
      const badge = roomBadgeBySlug[room.slug as keyof typeof roomBadgeBySlug];
      const isCryptoBadge = room.slug === "crypto-talk";
      const button = (
        <button
          type="button"
          onClick={() => handleSidebarRoomSelect(room.slug)}
          aria-current={isActive ? "page" : undefined}
          aria-label={iconOnly ? room.label : undefined}
          className={cn(
            "group rounded-2xl border text-left transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E3547] focus-visible:ring-offset-2 focus-visible:ring-offset-[#161923]",
            iconOnly
              ? "mx-auto flex h-10 w-10 items-center justify-center rounded-xl border p-0"
              : cn("grid h-10 items-center gap-2.5 border-transparent px-3", SIDEBAR_ROW_GRID_CLASS),
            iconOnly
              ? isActive
                ? "border-[#2E3547] bg-[#212533] text-white"
                : "border-[#2E3547] bg-[#161923] text-white hover:bg-[#2E3547] hover:text-white"
              : isActive
                ? "w-full border-[#2E3547] bg-[#212533] text-white"
                : "w-full text-white hover:border-[#2E3547] hover:bg-[#2E3547] hover:text-white"
          )}
        >
          <span
            className={cn(
              "text-white",
              iconOnly ? "grid h-4 w-4 shrink-0 place-items-center" : "grid h-7 w-7 shrink-0 place-items-center",
              iconOnly
                ? isActive
                  ? "text-white"
                  : "text-white group-hover:text-white"
                : isActive
                  ? "text-white"
                  : "group-hover:text-white"
            )}
          >
            {renderRoomIcon(room.slug)}
          </span>

          {!iconOnly ? (
            <>
              <span className="truncate text-sm font-semibold">{room.label}</span>
              {badge ? (
                <span
                  className={cn(
                    "ml-auto rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide",
                    isCryptoBadge ? "" : "border-[#2E3547] bg-[#161923] text-white"
                  )}
                  style={
                    isCryptoBadge
                      ? {
                          borderColor: selectedCryptoData.color,
                          backgroundColor: `${selectedCryptoData.color}1A`,
                          color: selectedCryptoData.color,
                        }
                      : undefined
                  }
                >
                  {badge}
                </span>
              ) : (
                <span className="h-4 w-4" aria-hidden="true" />
              )}
            </>
          ) : null}
        </button>
      );

      if (!iconOnly) {
        return <div key={room.slug}>{button}</div>;
      }

      return (
        <Tooltip key={room.slug}>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent
            side="right"
            sideOffset={8}
            className="border-[#101010] bg-[#000000] px-2 py-1 text-[10px] font-semibold text-white"
          >
            {room.label}
          </TooltipContent>
        </Tooltip>
      );
    },
    [activeRoom, handleSidebarRoomSelect, renderRoomIcon, roomBadgeBySlug, selectedCryptoData.color]
  );

  const renderMarketplaceNavItem = useCallback(
    (category: (typeof MARKETPLACE_CATEGORIES)[number], closeMobileOnClick = false) => {
      const isActive = stablePathname === category.href;

      return (
        <Link
          key={category.href}
          href={category.href}
          onClick={closeMobileOnClick ? () => setIsMobileSidebarOpen(false) : undefined}
          aria-current={isActive ? "page" : undefined}
          className={cn(
            "group grid h-10 w-full items-center gap-2.5 rounded-2xl border px-3 text-left transition-all duration-200",
            SIDEBAR_ROW_GRID_CLASS,
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E3547] focus-visible:ring-offset-2 focus-visible:ring-offset-[#161923]",
            isActive
              ? "border-[#2E3547] bg-[#161923] text-white"
              : "border-transparent bg-[#161923] text-white hover:border-[#2E3547] hover:bg-[#2E3547] hover:text-white"
          )}
        >
          <span
            className={cn(
              SIDEBAR_ICON_BOX_CLASS,
              "text-white",
              isActive
                ? "bg-[#161923] text-white"
                : "bg-[#161923] group-hover:bg-[#2E3547] group-hover:text-white"
            )}
          >
            {renderMarketplaceIcon(category.href)}
          </span>
          <span className="truncate text-sm font-semibold">{category.label}</span>
          <span className="h-4 w-4" aria-hidden="true" />
        </Link>
      );
    },
    [renderMarketplaceIcon, stablePathname]
  );

  const renderSellSectionIcon = useCallback(
    (key: SellSidebarSectionKey) => {
      switch (key) {
        case "seller-hub":
          return <LayoutDashboard className="h-3.5 w-3.5" aria-hidden="true" />;
        case "inventory":
          return <Package className="h-3.5 w-3.5" aria-hidden="true" />;
        case "orders":
          return <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />;
        case "payouts":
          return <Wallet className="h-3.5 w-3.5" aria-hidden="true" />;
        case "growth":
          return <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />;
        case "reputation-compliance":
          return <Briefcase className="h-3.5 w-3.5" aria-hidden="true" />;
        case "analytics":
          return <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />;
        default:
          return <Store className="h-3.5 w-3.5" aria-hidden="true" />;
      }
    },
    []
  );

  const toggleSellSection = useCallback((key: SellSidebarSectionKey) => {
    setOpenSellSections((prev) => {
      const shouldOpen = !prev[key];
      const next = SELL_SIDEBAR_SECTIONS.reduce(
        (acc, section) => {
          acc[section.key] = false;
          return acc;
        },
        {} as Record<SellSidebarSectionKey, boolean>
      );

      if (shouldOpen) {
        next[key] = true;
      }

      return next;
    });
  }, []);

  const renderSellTabItem = useCallback(
    (section: SellSidebarSection, tabLabel: string, closeMobileOnClick = false) => {
      const tabId = getSellTabId(section.key, tabLabel);
      const isActive = activeSellTabId === tabId;
      const isLocked = !isLoggedIn && !(section.key === "seller-hub" && tabLabel === "Dashboard");
      const lockTooltip =
        tabLabel === "Dashboard"
          ? "Sign in to access Seller Hub"
          : `Sign in to access ${tabLabel}`;

      return (
        <button
          type="button"
          onClick={() => {
            if (isLocked) {
              router.push("/auth");
              return;
            }
            setActiveSellTabId(tabId);
            if (closeMobileOnClick) {
              setIsMobileSidebarOpen(false);
            }
          }}
          aria-current={isActive ? "page" : undefined}
          className={cn(
            "group relative grid h-10 w-full items-center gap-2.5 rounded-2xl border px-3 text-left transition-all duration-200",
            SIDEBAR_ROW_GRID_CLASS,
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E3547] focus-visible:ring-offset-2 focus-visible:ring-offset-[#161923]",
            isActive
              ? "border-[#2E3547] bg-[#212533] text-white"
              : "border-transparent text-white hover:border-[#2E3547] hover:bg-[#2E3547] hover:text-white"
          )}
        >
          <span className="h-7 w-7" aria-hidden="true" />
          <span className="truncate text-sm font-semibold">{tabLabel}</span>
          <span className="h-4 w-4" aria-hidden="true" />
          {isLocked ? (
            <span
              role="tooltip"
              className="pointer-events-none invisible absolute right-2 top-[-1.9rem] z-20 rounded-lg border border-[#101010] bg-[#000000] px-2 py-1 text-[10px] font-semibold text-white shadow-[0_8px_18px_rgba(0,0,0,0.55)] group-hover:visible group-focus-visible:visible"
            >
              {lockTooltip}
            </span>
          ) : null}
        </button>
      );
    },
    [activeSellTabId, isLoggedIn, renderSellSectionIcon, router]
  );

  const renderSellCollapsedNavItem = useCallback(
    (section: SellSidebarSection) => {
      const isSectionActive = activeSellTabId.startsWith(`${section.key}:`);
      const button = (
        <button
          type="button"
          aria-label={section.label}
          onClick={() => {
            setIsLeftSidebarClosed(false);
            setOpenSellSections(
              SELL_SIDEBAR_SECTIONS.reduce(
                (acc, currentSection) => {
                  acc[currentSection.key] = currentSection.key === section.key;
                  return acc;
                },
                {} as Record<SellSidebarSectionKey, boolean>
              )
            );
            setActiveSellTabId(getSellTabId(section.key, section.tabs[0]));
          }}
          className={cn(
            "group mx-auto flex h-10 w-10 items-center justify-center rounded-xl border p-0 transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E3547] focus-visible:ring-offset-2 focus-visible:ring-offset-[#161923]",
            isSectionActive
              ? "border-[#2E3547] bg-[#212533] text-white"
              : "border-[#2E3547] bg-[#161923] text-white hover:bg-[#2E3547] hover:text-white"
          )}
        >
          <span
            className={cn(
              "grid h-4 w-4 shrink-0 place-items-center",
              isSectionActive ? "text-white" : "text-white group-hover:text-white"
            )}
          >
            {renderSellSectionIcon(section.key)}
          </span>
        </button>
      );

      return (
        <Tooltip key={section.key}>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent
            side="right"
            sideOffset={8}
            className="border-[#101010] bg-[#000000] px-2 py-1 text-[10px] font-semibold text-white"
          >
            {section.label}
          </TooltipContent>
        </Tooltip>
      );
    },
    [activeSellTabId, renderSellSectionIcon]
  );

  const renderSellSections = useCallback(
    (closeMobileOnClick = false) => {
      return (
        <div className="space-y-2.5">
          {SELL_SIDEBAR_SECTIONS.map((section) => {
            const isOpen = openSellSections[section.key];
            return (
              <div
                key={section.key}
                className={cn(isOpen ? "rounded-[22px] overflow-hidden border border-[#2E3547] bg-[#161923]" : "")}
              >
                <button
                  type="button"
                  className={cn(
                    "grid h-10 w-full items-center gap-2.5 overflow-hidden rounded-[22px] px-3 text-left text-sm font-extrabold text-white transition hover:bg-[#2E3547] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E3547]",
                    SIDEBAR_ROW_GRID_CLASS,
                    "bg-[#161923]",
                    !isOpen ? "border border-[#2E3547]" : ""
                  )}
                  onClick={() => toggleSellSection(section.key)}
                  aria-expanded={isOpen}
                >
                  <span className="grid h-7 w-7 place-items-center text-white">
                    {renderSellSectionIcon(section.key)}
                  </span>
                  <span className="min-w-0 truncate">{section.label}</span>
                  <span className="grid h-7 w-7 place-items-center rounded-xl bg-[#2E3547] text-white">
                    <SectionChevron open={isOpen} />
                  </span>
                </button>
                {isOpen ? (
                  <div className="mt-1 space-y-1 px-1.5 pb-1.5">
                    {section.tabs.map((tabLabel) => (
                      <Fragment key={getSellTabId(section.key, tabLabel)}>
                        {renderSellTabItem(section, tabLabel, closeMobileOnClick)}
                      </Fragment>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      );
    },
    [openSellSections, renderSellSectionIcon, renderSellTabItem, toggleSellSection]
  );

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
      .eq("is_deleted", false)
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
          .eq("is_deleted", false)
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
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "global_chat_messages",
          filter: `room=eq.${activeRoom}`,
        },
        async (payload) => {
          const updated = payload.new as { id?: string | null; is_deleted?: boolean };
          if (!updated.id) return;
          if (updated.is_deleted) {
            setMessages((prev) => prev.filter((item) => item.id !== updated.id));
            return;
          }
          const nextMessage = await fetchMessageById(updated.id);
          if (!nextMessage) return;
          setMessages((prev) => prev.map((item) => (item.id === nextMessage.id ? nextMessage : item)));
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

  useEffect(() => {
    const ctrlChannel = supabase
      .channel(`global-chat:controls:${user?.id || "anon"}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "global_chat_user_controls",
          filter: `user_id=eq.${user?.id || ""}`,
        },
        (payload) => {
          const row = payload.new as {
            is_banned?: boolean;
            banned_until?: string | null;
            is_muted?: boolean;
            muted_until?: string | null;
          };
          const bannedUntil = row?.banned_until ? new Date(row.banned_until).getTime() : 0;
          setIsBanned(Boolean(row?.is_banned) || Boolean(bannedUntil && bannedUntil > Date.now()));
          const mUntil = row?.muted_until ? new Date(row.muted_until).getTime() : 0;
          setMutedUntilTs(Boolean(row?.is_muted) ? mUntil || Date.now() + 60_000 : mUntil);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "global_chat_user_controls",
          filter: `user_id=eq.${user?.id || ""}`,
        },
        (payload) => {
          const row = payload.new as {
            is_banned?: boolean;
            banned_until?: string | null;
            is_muted?: boolean;
            muted_until?: string | null;
          };
          const bannedUntil = row?.banned_until ? new Date(row.banned_until).getTime() : 0;
          setIsBanned(Boolean(row?.is_banned) || Boolean(bannedUntil && bannedUntil > Date.now()));
          const mUntil = row?.muted_until ? new Date(row.muted_until).getTime() : 0;
          setMutedUntilTs(Boolean(row?.is_muted) ? mUntil || Date.now() + 60_000 : mUntil);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ctrlChannel);
    };
  }, [supabase, user?.id]);

  useEffect(() => {
    let active = true;
    const fetchRoomState = async () => {
      const { data } = await supabase
        .from("global_chat_room_state")
        .select("slow_mode_seconds,closed_until")
        .eq("room_slug", activeRoom)
        .maybeSingle<{ slow_mode_seconds: number; closed_until: string | null }>();
      if (!active) return;
      setRoomSlowSeconds(Number(data?.slow_mode_seconds || 0));
      const closedTs = data?.closed_until ? new Date(data.closed_until).getTime() : 0;
      setClosedUntilTs(closedTs);
    };
    fetchRoomState();
    const channel = supabase
      .channel(`global-chat:room-state:${activeRoom}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "global_chat_room_state", filter: `room_slug=eq.${activeRoom}` },
        (payload) => {
          const row = payload.new as { slow_mode_seconds?: number; closed_until?: string | null };
          setRoomSlowSeconds(Number(row?.slow_mode_seconds || 0));
          const closedTs = row?.closed_until ? new Date(row.closed_until).getTime() : 0;
          setClosedUntilTs(closedTs);
        }
      )
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [activeRoom, supabase]);

  useEffect(() => {
    if (!user) {
      setSlowRemainingSeconds(0);
      return;
    }
    let active = true;
    const compute = async () => {
      if (!roomSlowSeconds || roomSlowSeconds <= 0) {
        setSlowRemainingSeconds(0);
        return;
      }
      const { data: recent } = await supabase
        .from("global_chat_messages")
        .select("created_at")
        .eq("user_id", user.id)
        .eq("room", activeRoom)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle<{ created_at: string }>();
      const ts = recent?.created_at ? new Date(recent.created_at).getTime() : 0;
      const diff = Date.now() - ts;
      const remain = Math.max(0, Math.ceil((roomSlowSeconds * 1000 - diff) / 1000));
      if (active) setSlowRemainingSeconds(remain);
    };
    compute();
    const intervalId = window.setInterval(() => {
      setSlowRemainingSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [activeRoom, roomSlowSeconds, supabase, user, messages.length]);

  useEffect(() => {
    const tick = () => {
      if (!closedUntilTs) {
        setClosedRemainingSeconds(0);
        return;
      }
      const remain = Math.max(0, Math.ceil((closedUntilTs - Date.now()) / 1000));
      setClosedRemainingSeconds(remain);
    };
    tick();
    const intervalId = window.setInterval(tick, 1000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [closedUntilTs]);

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
  const [displayOnlineCount, setDisplayOnlineCount] = useState<number>(478);
  const compactOnlineCount = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(displayOnlineCount),
    [displayOnlineCount]
  );

  useEffect(() => {
    const minFloor = 283;
    const inflateFactor = 4; // amplify real signal
    const target = Math.max(minFloor, 478 + Math.round(onlineCount * inflateFactor));

    const tick = () => {
      setDisplayOnlineCount((current) => {
        const diff = target - current;
        if (diff === 0) return current;
        const stepBase = Math.max(1, Math.min(20, Math.floor(Math.abs(diff) * 0.15)));
        const jitter = Math.floor(Math.random() * 5) - 2; // [-2, +2]
        const step = (diff > 0 ? 1 : -1) * (stepBase + jitter);
        const next = current + step;
        return Math.max(minFloor, next);
      });
    };

    const interval = window.setInterval(tick, 4000 + Math.floor(Math.random() * 3000));
    return () => window.clearInterval(interval);
  }, [onlineCount]);

  useEffect(() => {
    let timer: number | null = null;
    const fetchSlowMode = async () => {
      if (!user || activeRoom !== "help") {
        setSlowModeMinutes(0);
        return;
      }
      const { data } = await supabase
        .from("global_chat_messages")
        .select("created_at")
        .eq("user_id", user.id)
        .eq("room", "help")
        .is("reply_to_id", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle<{ created_at: string }>();
      if (data?.created_at) {
        const lastTs = new Date(data.created_at).getTime();
        const diffMs = Date.now() - lastTs;
        const remainingMs = Math.max(0, 3_600_000 - diffMs);
        const remainingMin = Math.ceil(remainingMs / 60_000);
        setSlowModeMinutes(remainingMin);
      } else {
        setSlowModeMinutes(0);
      }
    };
    fetchSlowMode();
    timer = window.setInterval(fetchSlowMode, 60_000);
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [activeRoom, supabase, user]);

  useEffect(() => {
    let active = true;
    const loadModerator = async () => {
      if (!user) {
        setIsModerator(false);
        setIsBanned(false);
        setMutedUntilTs(0);
        return;
      }
      const { data } = await supabase
        .from("global_chat_user_controls")
        .select("is_moderator,moderator_override,is_banned,banned_until,is_muted,muted_until")
        .eq("user_id", user.id)
        .maybeSingle<{ is_moderator: boolean; moderator_override: boolean; is_banned: boolean; banned_until: string | null; is_muted: boolean; muted_until: string | null }>();
      if (!active) return;
      const flag = Boolean(data?.is_moderator) || Boolean(data?.moderator_override);
      setIsModerator(flag);
      const bannedUntil = data?.banned_until ? new Date(data.banned_until).getTime() : 0;
      setIsBanned(Boolean(data?.is_banned) || Boolean(bannedUntil && bannedUntil > Date.now()));
      const mutedUntil = data?.muted_until ? new Date(data.muted_until).getTime() : 0;
      setMutedUntilTs(Boolean(data?.is_muted) ? mutedUntil || Date.now() + 60_000 : mutedUntil);
    };
    loadModerator();
    return () => {
      active = false;
    };
  }, [supabase, user]);
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
      const errorCode = payload && "code" in payload ? String(payload.code) : "";
      if (errorCode === "BAN_ACTIVE" || errorCode === "MUTE_ACTIVE" || errorCode === "SLOW_MODE" || errorCode === "ROLE_NOT_ALLOWED" || errorCode === "ROOM_CLOSED") {
        // Refresh user controls to reflect latest mute/ban state without showing global toast
        try {
          const { data } = await supabase
            .from("global_chat_user_controls")
            .select("is_banned,banned_until,is_muted,muted_until")
            .eq("user_id", user.id)
            .maybeSingle<{ is_banned: boolean; banned_until: string | null; is_muted: boolean; muted_until: string | null }>();
          const bannedUntil = data?.banned_until ? new Date(data.banned_until).getTime() : 0;
          setIsBanned(Boolean(data?.is_banned) || Boolean(bannedUntil && bannedUntil > Date.now()));
          const mutedUntil = data?.muted_until ? new Date(data.muted_until).getTime() : 0;
          setMutedUntilTs(Boolean(data?.is_muted) ? mutedUntil || Date.now() + 60_000 : mutedUntil);
        } catch {}
        // No toast for these cases; UI shows inline placeholders
      } else {
        const messageText = payload && "message" in payload ? payload.message : fallback;
        toast.error(messageText);
      }
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
          "rounded-2xl border border-[#2E3547] px-3 py-2 text-sm leading-relaxed shadow-sm",
          user?.id === message.userId ? "bg-[#2A3042]" : "bg-[#212533]"
        )}
      >
        <div className="flex items-start gap-2">
          <Avatar size="default" className="shrink-0 border border-[#2E3547]">
            <AvatarImage src={message.avatarUrl || undefined} alt={message.displayName} />
            <AvatarFallback className="bg-[#151515] text-[10px] text-zinc-300">
              {getAvatarFallback(message.displayName)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-x-2 gap-y-1 text-[15px] leading-relaxed text-zinc-200">
                  <span className="break-words text-sm font-bold leading-tight text-white">{message.displayName}</span>
                </div>
                <div className={cn("min-w-0 break-words text-zinc-200", isChatCompact ? "text-[14px] leading-6" : "text-[15px] leading-relaxed")}>
                  {renderMessageWithMentions(message.text, currentHandle)}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1 text-xs">
                {repliesCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => openThreadForMessage(message)}
                    aria-label={`Show thread (${repliesCount})`}
                    className="inline-flex items-center gap-1 rounded-xl border border-[#2E3547] bg-[#212533] px-2 py-1 text-zinc-400 transition hover:bg-[#2E3547] hover:text-white"
                  >
                    <Reply className="h-3.5 w-3.5" />
                    {isChatCompact ? <span className="font-semibold">{repliesCount}</span> : `Show thread (${repliesCount})`}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setReplyTarget(message)}
                    aria-label="Reply"
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg px-1.5 py-1 text-xs text-zinc-400 transition hover:bg-[#2E3547] hover:text-white"
                  >
                    <Reply className="h-3.5 w-3.5" />
                    {isChatCompact ? null : "Reply"}
                  </button>
                )}
              </div>
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
        className={cn(
          "rounded-2xl border border-[#2E3547] px-3 py-2 shadow-sm",
          user?.id === message.userId ? "bg-[#2A3042]" : "bg-[#212533]"
        )}
        style={{ marginLeft: Math.min((depth - 1) * 16, 64) }}
      >
        <div className="flex items-start gap-2">
          <Avatar size="default" className="shrink-0 border border-[#2E3547]">
            <AvatarImage src={message.avatarUrl || undefined} alt={message.displayName} />
            <AvatarFallback className="bg-[#151515] text:[10px] text-zinc-300">
              {getAvatarFallback(message.displayName)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-x-2 gap-y-1 text-[15px] leading-relaxed text-zinc-200">
                  <span className="break-words text-sm font-bold leading-tight text-white">{message.displayName}</span>
                </div>
                <div className={cn("min-w-0 break-words text-zinc-200", isChatCompact ? "text-[14px] leading-6" : "text-[15px] leading-relaxed")}>
                  {renderMessageWithMentions(message.text, currentHandle)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReplyTarget(message)}
                aria-label="Reply"
                className="inline-flex shrink-0 items-center gap-1 rounded-lg px-1.5 py-1 text-xs text-zinc-400 transition hover:bg-[#2E3547] hover:text-white"
              >
                <Reply className="h-3.5 w-3.5" />
                {isChatCompact ? null : "Reply"}
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  };

  return (
    <TooltipProvider delayDuration={120}>
      <div className="min-h-screen bg-[#101219] text-[var(--global-chat-text-primary)]">
      <AnimatePresence>
        {isMobileSidebarOpen ? (
          <HomepageMobileSidebar
            isOpen={isMobileSidebarOpen}
            onClose={() => setIsMobileSidebarOpen(false)}
            activeRoomLabel={activeRoomLabel}
            sidebarMode={sidebarMode}
            onSidebarModeChange={setSidebarMode}
            isMarketplaceSectionOpen={isMarketplaceSectionOpen}
            onToggleMarketplaceSection={() => setIsMarketplaceSectionOpen((prev) => !prev)}
            isRoomsSectionOpen={isRoomsSectionOpen}
            onToggleRoomsSection={() =>
              setIsRoomsSectionOpen((prev) => {
                const next = !prev;
                if (next) setIsCommunitySectionOpen(false);
                return next;
              })
            }
            primaryRooms={primaryRooms}
            marketplaceCategories={MARKETPLACE_CATEGORIES}
            renderMarketplaceNavItem={renderMarketplaceNavItem}
            renderRoomNavItem={renderRoomNavItem}
            renderSellSections={renderSellSections}
            displayOnlineCount={displayOnlineCount}
            threadCount={topLevelMessages.length}
            sidebarRowGridClass={SIDEBAR_ROW_GRID_CLASS}
          />
        ) : null}
      </AnimatePresence>

      <div
        className={cn(
          "relative mx-auto flex min-h-screen w-full min-w-0 items-stretch gap-3 px-3 py-4 transition-opacity duration-150 md:gap-3 md:px-4 md:py-6",
          !isMobile && !isDesktopLayoutReady && "pointer-events-none opacity-0"
        )}
      >
        <Group
          groupRef={panelGroupRef}
          orientation="horizontal"
          defaultLayout={HOMEPAGE_LAYOUT_DEFAULT}
          onLayoutChanged={handlePanelLayoutChanged}
          className="flex w-full min-w-0 items-stretch gap-0"
        >
          {!isMobile ? (
            <Panel
              defaultSize="20%"
              minSize="16%"
              maxSize="28%"
              collapsible
              collapsedSize={0}
              id="homepage-left"
              panelRef={leftPanelRef}
              className="min-w-0"
            >
              <HomepageDesktopSidebar
                isLeftSidebarClosed={isLeftSidebarClosed}
                onCollapse={collapseLeftSidebar}
                sidebarMode={sidebarMode}
                onSidebarModeChange={setSidebarMode}
                isMarketplaceSectionOpen={isMarketplaceSectionOpen}
                onToggleMarketplaceSection={() => setIsMarketplaceSectionOpen((prev) => !prev)}
                isRoomsSectionOpen={isRoomsSectionOpen}
                onToggleRoomsSection={() => setIsRoomsSectionOpen((prev) => !prev)}
                primaryRooms={primaryRooms}
                marketplaceCategories={MARKETPLACE_CATEGORIES}
                renderMarketplaceNavItem={renderMarketplaceNavItem}
                renderRoomNavItem={renderRoomNavItem}
                renderSellSections={renderSellSections}
                displayOnlineCount={displayOnlineCount}
                threadCount={topLevelMessages.length}
                sidebarRowGridClass={SIDEBAR_ROW_GRID_CLASS}
              />
            </Panel>
          ) : null}

          {!isMobile ? <HomepagePanelResizeHandle /> : null}

          {!isMobile ? (
            <Panel id="homepage-center" minSize="34%" className="min-w-0">
              <HomepageCenterPanel
                isLeftSidebarClosed={isLeftSidebarClosed}
                isChatClosed={isChatClosed}
                onExpandSidebar={expandLeftSidebar}
                onExpandChat={reopenChatPanel}
                commandSearchSlot={<GlobalCommandSearch className="w-full max-w-none" />}
              />
            </Panel>
          ) : null}

          {!isMobile ? <HomepagePanelResizeHandle /> : null}

          <Panel
            id="homepage-right"
            panelRef={rightPanelRef}
            defaultSize={isMobile ? "100%" : "20%"}
            minSize={isMobile ? "100%" : "14%"}
            maxSize={isMobile ? "100%" : "50%"}
            collapsible={!isMobile}
            collapsedSize={0}
            className="min-w-0"
          >
            <AnimatePresence initial={false} mode="sync">
              {isChatClosed ? (
                <motion.div
                  key="chat-closed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="h-[calc(100vh-3rem)]"
                />
              ) : (
                <motion.aside
                  key="chat-open"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                  style={{ transform: "none" }}
                  className="flex h-[calc(100vh-3rem)] w-full min-w-0 flex-col rounded-3xl border border-[#2E3547] bg-[#161923] shadow-[0_20px_45px_rgba(0,0,0,0.45)]"
                >
          <HomepageChatHeader
            onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
            roomMenuRef={roomMenuRef}
            isRoomMenuOpen={isRoomMenuOpen}
            onToggleRoomMenu={() => setIsRoomMenuOpen((prev) => !prev)}
            activeRoom={activeRoom}
            activeRoomLabel={activeRoomLabel}
            rooms={GLOBAL_CHAT_ROOMS}
            onRoomChange={handleRoomChange}
            renderRoomIcon={renderRoomIcon}
            isChatExpanded={isChatExpanded}
            onToggleChatExpanded={toggleChatExpanded}
            onOpenRules={() => setIsRulesOpen(true)}
            onCloseChat={closeChatPanel}
          />

          <div ref={listRef} className="relative flex-1 space-y-2 overflow-y-auto no-scrollbar px-3 py-3">
            {showScrollToLatest ? (
              <div className="sticky top-0 z-20 -mx-3 px-3 pb-2">
                <button
                  type="button"
                  onClick={scrollToLatestMessage}
                  className="flex h-9 w-full items-center justify-center gap-2 rounded-2xl bg-white text-black text-sm font-semibold transition hover:bg-zinc-200"
                >
                  <ArrowDown className="h-4 w-4" />
                  Scroll to last message
                </button>
              </div>
            ) : null}

            {isFetching || isLoading ? (
              <div className="rounded-2xl border border-[#2E3547] bg-[#161923] p-3 text-sm text-zinc-300 shadow-sm">
                Loading chat...
              </div>
            ) : messages.length === 0 ? (
              <div className="rounded-2xl border border-[#2E3547] bg-[#161923] p-3 text-sm text-zinc-300 shadow-sm">
                No messages yet in this room.
              </div>
            ) : activeThreadRootId && threadRootMessage ? (
              <div className="space-y-3">
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveThreadRootId(null);
                      setReplyTarget(null);
                      setIsThreadLoading(false);
                    }}
                    className="inline-flex h-9 items-center gap-1 rounded-xl border border-[#2E3547] bg-[#212533] px-3 text-sm font-semibold text-zinc-300 transition hover:bg-[#2E3547] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E3547]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to chat
                  </button>
                </div>
                <div
                  className={cn(
                    "rounded-2xl border border-[#2E3547] px-3 py-2 shadow-sm",
                    user?.id === threadRootMessage.userId ? "bg-[#2A3042]" : "bg-[#212533]"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Avatar size="default" className="shrink-0 border border-[#2E3547]">
                      <AvatarImage
                        src={threadRootMessage.avatarUrl || undefined}
                        alt={threadRootMessage.displayName}
                      />
                      <AvatarFallback className="bg-[#151515] text-[10px] text-zinc-300">
                        {getAvatarFallback(threadRootMessage.displayName)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] leading-relaxed text-zinc-200">
                          <span className="text-sm font-bold text-white">
                            {threadRootMessage.displayName}
                          </span>
                          <span className="min-w-0 break-words">
                            {renderMessageWithMentions(threadRootMessage.text, currentHandle)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setReplyTarget(threadRootMessage)}
                          className="inline-flex shrink-0 items-center gap-1 rounded-lg px-1.5 py-1 text-xs text-zinc-400 transition hover:bg-[#2E3547] hover:text-white"
                        >
                          <Reply className="h-3.5 w-3.5" />
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {threadMessages.length === 0 ? (
                    <div className="rounded-2xl border border-[#2E3547] bg-[#161923] p-3 text-sm text-zinc-300 shadow-sm">
                    {isThreadLoading
                      ? "Loading thread replies..."
                      : "No replies yet. Be the first to reply in this thread."}
                  </div>
                ) : (
                    <div className="space-y-2 border-l border-[#2E3547] pl-2">
                    {threadMessages.map((entry) => renderThreadReply(entry))}
                  </div>
                )}
              </div>
            ) : (
              topLevelMessages.map((message) => renderMainMessage(message))
            )}
          </div>

          <div className="mx-3 mb-3 mt-2 rounded-[24px] border border-[#2E3547] bg-[#212533] p-3 shadow-[0_0_0_1px_rgba(46,53,71,0.05)] transition-shadow duration-200 focus-within:shadow-[0_0_0_1px_rgba(46,53,71,0.72),0_0_0_5px_rgba(46,53,71,0.12)]">
            {replyTarget ? (
              <div className="mb-2 flex items-center justify-between rounded-xl border border-[#2E3547] bg-[#161923] px-3 py-2 text-xs text-zinc-300">
                <div className="min-w-0">
                  <span className="font-semibold text-white">Replying to {replyTarget.displayName}</span>
                  <span className="ml-2 text-zinc-300">{truncateMessage(replyTarget.text, 70)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setReplyTarget(null);
                  }}
                  className="ml-2 inline-flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-[#2E3547] hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : null}
            {isRulesOpen ? (
              <div className="mb-2 rounded-2xl border border-[#2E3547] bg-[#161923] px-3 py-3 text-sm text-zinc-300">
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold">Chat Rules</span>
                  <button
                    type="button"
                    onClick={() => setIsRulesOpen(false)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-[#2E3547] hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  <li>No spamming</li>
                  <li>No advertising</li>
                  <li>Zero tolerance for harassment</li>
                  <li>No slandering website, staff, or other players</li>
                  <li>No sharing of socials or personal info</li>
                  <li>No posting external links</li>
                </ul>
                <div className="mt-3">
                  <Button
                    onClick={() => {
                      try {
                        localStorage.setItem("global_chat_rules_accepted", "1");
                      } catch {}
                      setHasAcceptedRules(true);
                      setIsRulesOpen(false);
                    }}
                    className="w-full py-3 px-4 rounded-2xl bg-white text-black hover:bg-zinc-200"
                  >
                    Accept Rules
                  </Button>
                </div>
              </div>
            ) : null}
            {isBanned ? (
              <div className="mb-2 inline-flex items-center gap-2 text-sm text-[#ff0000]">
                <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                  <path fillRule="evenodd" clipRule="evenodd" d="M16 8C16 12.4183 12.4183 16 8 16C3.58172 16 0 12.4183 0 8C0 3.58172 3.58172 0 8 0C12.4183 0 16 3.58172 16 8ZM10.3128 12.4341C9.62116 12.7956 8.83445 13 8 13C5.23858 13 3 10.7614 3 8C3 7.16555 3.20441 6.37884 3.5659 5.68722L10.3128 12.4341ZM12.4341 10.3128L5.68722 3.5659C6.37884 3.20441 7.16555 3 8 3C10.7614 3 13 5.23858 13 8C13 8.83445 12.7956 9.62116 12.4341 10.3128Z" fill="#ff0000"></path>
                </svg>
                <span className="font-semibold">You are banned to write here</span>
              </div>
            ) : mutedUntilTs && mutedUntilTs > Date.now() ? (
              <div className="mb-2 inline-flex items-center gap-2 text-sm text-white">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                  <path d="M5 5L19 19" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                  <path fillRule="evenodd" clipRule="evenodd" d="M9.68219 5.56134C10.0533 4.64576 10.9513 4 12 4C13.3807 4 14.5 5.11929 14.5 6.5V10.3792L9.68219 5.56134ZM12.7605 12.8822L9.5 9.62179V10.5C9.5 11.8807 10.6193 13 12 13C12.2651 13 12.5207 12.9587 12.7605 12.8822Z" fill="#ffffff"></path>
                  <path d="M9.68219 5.56134L8.97509 6.26845L8.50647 5.79984L8.75544 5.18566L9.68219 5.56134ZM14.5 10.3792H15.5V12.7934L13.7929 11.0863L14.5 10.3792ZM12.7605 12.8822L13.4676 12.1751L14.6285 13.3361L13.0643 13.835L12.7605 12.8822ZM9.5 9.62179H8.5V7.20758L10.2071 8.91469L9.5 9.62179ZM8.75544 5.18566C9.27431 3.90569 10.5302 3 12 3V5C11.3723 5 10.8324 5.38583 10.6089 5.93702L8.75544 5.18566ZM12 3C13.933 3 15.5 4.567 15.5 6.5H13.5C13.5 5.67157 12.8284 5 12 5V3ZM15.5 6.5V10.3792H13.5V6.5H15.5ZM10.3893 4.85424L15.2071 9.67204L13.7929 11.0863L8.97509 6.26845L10.3893 4.85424ZM12.0533 13.5893L8.79289 10.3289L10.2071 8.91469L13.4676 12.1751L12.0533 13.5893ZM8.5 10.5V9.62179H10.5V10.5H8.5ZM12 14C10.067 14 8.5 12.433 8.5 10.5H10.5C10.5 11.3284 11.1716 12 12 12V14ZM13.0643 13.835C12.7274 13.9424 12.3695 14 12 14V12C12.1608 12 12.3139 11.975 12.4566 11.9295L13.0643 13.835Z" fill="#ffffff"></path>
                  <path fillRule="evenodd" clipRule="evenodd" d="M8.46291 13.7293C8.31338 13.1976 7.76117 12.8878 7.22951 13.0373C6.69785 13.1869 6.38808 13.7391 6.5376 14.2707C7.17394 16.5333 8.82364 18.063 11.0003 18.42V21C11.0003 21.5523 11.448 22 12.0003 22C12.5525 22 13.0003 21.5523 13.0003 21V18.42C13.7841 18.2914 14.4996 18.0108 15.124 17.5986L13.6608 16.1355C13.1713 16.3753 12.6119 16.5 12.0003 16.5C10.2727 16.5 8.9625 15.5056 8.46291 13.7293ZM15.7806 13.3054C16.0279 13.0495 16.4044 12.9342 16.771 13.0373C17.3027 13.1869 17.6124 13.7391 17.4629 14.2707C17.4108 14.456 17.3519 14.6363 17.2865 14.8114L15.7806 13.3054Z" fill="#ffffff"></path>
                </svg>
                <span className="font-semibold">You are muted to write here</span>
              </div>
            ) : closedUntilTs && closedUntilTs > Date.now() ? (
              <div className="mb-2 inline-flex items-center gap-2 text-sm text-white">
                <span className="font-semibold">
                  {closedUntilTs > Date.now() + 365 * 24 * 60 * 60 * 1000
                    ? "This chat is closed"
                    : `This chat is closed for ${closedRemainingSeconds}s`}
                </span>
              </div>
            ) : slowRemainingSeconds > 0 ? (
              <div className="mb-2 flex items-center gap-2 text-sm text-white">
                <svg viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-zinc-300">
                  <path fillRule="evenodd" clipRule="evenodd" d="M8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16ZM7 3V8.41421L10.2929 11.7071L11.7071 10.2929L9 7.58579V3H7Z"></path>
                </svg>
                <span className="font-semibold">Slow mode attivo</span>
                <span className="text-zinc-400">({slowRemainingSeconds}s)</span>
              </div>
            ) : null}

            {mentionContext ? (
              <div className="mb-2 max-h-60 overflow-y-auto rounded-2xl border border-[#2E3547] bg-[#161923] px-3 py-3 text-sm text-zinc-300 shadow-sm">
                {mentionSuggestions.length > 0 ? (
                  mentionSuggestions.map((candidate, index) => (
                    <button
                      key={`${candidate.userId}-${candidate.handle}`}
                      type="button"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        applyMention(candidate);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left transition",
                        index === activeMentionIndex
                          ? "bg-[#2E3547] text-white"
                          : "text-zinc-200 hover:bg-[#2E3547]"
                      )}
                    >
                      <Avatar size="default" className="shrink-0 border border-[#2E3547]">
                        <AvatarImage src={candidate.avatarUrl || undefined} alt={candidate.displayName} />
                        <AvatarFallback className="bg-[#151515] text-[10px] text-zinc-300">
                          {getAvatarFallback(candidate.displayName)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="truncate font-semibold">{candidate.displayName}</span>
                          <span className="truncate text-xs text-zinc-400">@{candidate.handle}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                          {candidate.isSeller ? <span>Seller</span> : null}
                          {candidate.isBuyer ? <span>Buyer</span> : null}
                          <span>Online now</span>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="rounded-xl px-1 py-1 text-sm text-zinc-400">
                    No people found to mention.
                  </div>
                )}
              </div>
            ) : null}

            <div className="mb-2 flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  value={draft}
                  onChange={(event) => {
                    setDraft(event.target.value);
                    syncMentionContextFromInput(event.currentTarget);
                  }}
                  maxLength={180}
                  onFocus={() => {
                    if (!hasAcceptedRules) {
                      setIsRulesOpen(true);
                    }
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
                  placeholder={
                    canWrite
                      ? "Type your message..."
                      : !user
                      ? "Login to write in chat"
                      : isBanned
                      ? "You are banned from global chat."
                      : mutedUntilTs && mutedUntilTs > Date.now()
                      ? `You are muted for ${Math.ceil((mutedUntilTs - Date.now()) / 1000)} seconds.`
                      : closedUntilTs && closedUntilTs > Date.now()
                      ? `This chat is closed`
                      : slowRemainingSeconds > 0
                      ? `Slow mode active`
                      : `You are not ${requiredRoleText || "allowed"} to write here.`
                  }
                  disabled={!canWrite || isSending || isBanned || !!(mutedUntilTs && mutedUntilTs > Date.now()) || !!slowRemainingSeconds || !!(closedUntilTs && closedUntilTs > Date.now())}
                  className="h-11 w-full rounded-2xl border border-[#2E3547] bg-[#161923] px-3 pr-28 text-base text-white shadow-[0_0_0_1px_rgba(46,53,71,0.06)] placeholder:text-zinc-500 focus:border-[#2E3547] focus:outline-none focus:shadow-[0_0_0_1px_rgba(46,53,71,0.76),0_0_0_4px_rgba(46,53,71,0.12)] disabled:cursor-not-allowed disabled:opacity-40"
                />
                <AnimatePresence>
                  {draft.trim().length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.15 }}
                      className="absolute inset-y-1 right-1 flex items-center"
                    >
                      <Button
                        onClick={handleSend}
                        disabled={!canWrite || isSending}
                        className="h-full px-4 rounded-2xl bg-white text-black hover:bg-zinc-200 flex items-center gap-2 font-medium text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 19V5M12 5L5 12M12 5L19 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Send
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>

	            <div className="flex items-center justify-between gap-2 text-xs text-zinc-300">
              <span className="inline-flex items-center gap-2">
                <svg width="256px" height="256px" viewBox="0 0 24.00 24.00" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#b8ffc0" strokeWidth="0.40800000000000003" className="h-6 w-6">
                  <g strokeWidth="0"></g>
                  <g strokeLinecap="round" strokeLinejoin="round"></g>
                  <g>
                    <path d="M12 9.5C13.3807 9.5 14.5 10.6193 14.5 12C14.5 13.3807 13.3807 14.5 12 14.5C10.6193 14.5 9.5 13.3807 9.5 12C9.5 10.6193 10.6193 9.5 12 9.5Z" fill="#04dc3a"></path>
                  </g>
                </svg>
                {isChatCompact ? displayOnlineCount.toLocaleString("en-US") : `Online: ${displayOnlineCount.toLocaleString("en-US")}`}
              </span>

              {mutedUntilTs && mutedUntilTs > Date.now() ? (
                <span className="text-zinc-400">Muted: {Math.ceil((mutedUntilTs - Date.now()) / 1000)}s</span>
              ) : activeRoom === "help" && slowModeMinutes > 0 ? (
                <span className="text-zinc-400">Slow mode: {slowModeMinutes} min</span>
              ) : !user ? (
                <Link
                  href={`/auth?next=${encodeURIComponent(stablePathname || "/")}`}
                  className="inline-flex items-center gap-1 text-zinc-300 hover:text-white"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  {isChatCompact ? "Sign in" : "Sign in to write"}
                </Link>
              ) : !canWrite ? (
                <span className="text-zinc-400">{isBanned ? "You are banned from global chat." : `You are not ${requiredRoleText || "allowed"} to write here.`}</span>
              ) : (
                <span className="text-zinc-400">{draft.length}/180</span>
              )}
	            </div>
	          </div>
                </motion.aside>
              )}
            </AnimatePresence>
          </Panel>
        </Group>
      </div>
      </div>
    </TooltipProvider>
  );
}

