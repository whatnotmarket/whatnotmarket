"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  BarChart3,
  Bell,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  CircleUserRound,
  Globe,
  Grid3X3,
  HardDrive,
  Link as LinkIcon,
  Mail,
  Megaphone,
  Moon,
  Search,
  Settings,
  X,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const RAIL_WIDTH = 92;
const OPEN_LEFT_WIDTH = 336;
const OPEN_RIGHT_WIDTH = 366;

const MOTION = {
  ease: [0.22, 1, 0.36, 1] as const,
  easeSoft: [0.4, 0, 0.2, 1] as const,
  open: 0.32,
  close: 0.26,
  contentIn: 0.24,
  contentOut: 0.18,
  contentDelay: 0.04,
  userMenu: 0.22,
};

const WIDTH_SPRING = {
  type: "spring",
  stiffness: 220,
  damping: 30,
  mass: 0.95,
  restSpeed: 0.35,
  restDelta: 0.35,
} as const;

type ItemId =
  | "global"
  | "search"
  | "summary"
  | "website-opt"
  | "efficiency"
  | "indexing"
  | "tools"
  | "display"
  | "links"
  | "services";

type SidebarItem = {
  id: ItemId;
  label: string;
  icon: LucideIcon;
  expandable?: boolean;
  panel: {
    heading: string;
    lines: string[];
    cta: string;
  };
};

const ITEMS: SidebarItem[] = [
  {
    id: "global",
    label: "Global",
    icon: Globe,
    panel: {
      heading: "Latest and most important news",
      lines: ["Snippets and answers", "SERP links"],
      cta: "Site region",
    },
  },
  {
    id: "search",
    label: "Search",
    icon: Search,
    panel: {
      heading: "Discover ranking opportunities",
      lines: ["Top keywords", "Competitor movements"],
      cta: "Open search insights",
    },
  },
  {
    id: "summary",
    label: "Summary",
    icon: Grid3X3,
    panel: {
      heading: "Performance summary",
      lines: ["Traffic trends", "Indexing status"],
      cta: "View summary dashboard",
    },
  },
  {
    id: "website-opt",
    label: "Website optimization",
    icon: Globe,
    expandable: true,
    panel: {
      heading: "Website optimization",
      lines: ["On-page opportunities", "Content signals"],
      cta: "Open optimization",
    },
  },
  {
    id: "efficiency",
    label: "Efficiency",
    icon: BarChart3,
    expandable: true,
    panel: {
      heading: "Efficiency improvements",
      lines: ["Crawl budget", "Technical speed"],
      cta: "Prioritize fixes",
    },
  },
  {
    id: "indexing",
    label: "Indexing",
    icon: Search,
    expandable: true,
    panel: {
      heading: "Indexing checks",
      lines: ["Coverage warnings", "Duplicate URLs"],
      cta: "Inspect index state",
    },
  },
  {
    id: "tools",
    label: "Tools",
    icon: Wrench,
    expandable: true,
    panel: {
      heading: "Toolbox",
      lines: ["Audit utilities", "Export center"],
      cta: "Open toolbox",
    },
  },
  {
    id: "display",
    label: "Display in the search",
    icon: Megaphone,
    expandable: true,
    panel: {
      heading: "Latest and most important news",
      lines: ["Snippets and answers", "SERP links"],
      cta: "Site region",
    },
  },
  {
    id: "links",
    label: "Links",
    icon: LinkIcon,
    expandable: true,
    panel: {
      heading: "Link opportunities",
      lines: ["Internal links", "Backlink profile"],
      cta: "Open links report",
    },
  },
  {
    id: "services",
    label: "Useful services",
    icon: CircleUserRound,
    expandable: true,
    panel: {
      heading: "Useful services",
      lines: ["Domain checks", "Growth utilities"],
      cta: "Explore services",
    },
  },
];

function SidebarToggleHandle({
  expanded,
  onToggle,
}: {
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
      aria-expanded={expanded}
      onClick={onToggle}
      className="absolute left-full -ml-px bottom-[46px] z-50 h-[142px] w-[42px]"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="42"
        height="142"
        viewBox="0 0 42 142"
        fill="none"
        aria-hidden="true"
        style={
          {
            "--wm-redesign-palette-background": "#1f2329",
            "--wm-redesign-palette-hint": "#c1c8d4",
          } as CSSProperties
        }
      >
        <g clipPath="url(#clip0_sidebar_toggle)" style={{ pointerEvents: "all" }}>
          <g filter="url(#filter0_d_sidebar_toggle)">
            <path
              d="M0 106V12C0 36.2173 18 38 18 59.0624C18 80.1248 0 83.2963 0 106Z"
              fill="var(--wm-redesign-palette-background)"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M7 54C7 54.8284 6.3284 55.5 5.5 55.5C4.6716 55.5 4 54.8284 4 54C4 53.1716 4.6716 52.5 5.5 52.5C6.3284 52.5 7 53.1716 7 54ZM5.5 60.5C6.3284 60.5 7 59.8284 7 59C7 58.1716 6.3284 57.5 5.5 57.5C4.6716 57.5 4 58.1716 4 59C4 59.8284 4.6716 60.5 5.5 60.5ZM10.5 60.5C11.3284 60.5 12 59.8284 12 59C12 58.1716 11.3284 57.5 10.5 57.5C9.6716 57.5 9 58.1716 9 59C9 59.8284 9.6716 60.5 10.5 60.5ZM10.5 55.5C11.3284 55.5 12 54.8284 12 54C12 53.1716 11.3284 52.5 10.5 52.5C9.6716 52.5 9 53.1716 9 54C9 54.8284 9.6716 55.5 10.5 55.5ZM7 64C7 64.8284 6.3284 65.5 5.5 65.5C4.6716 65.5 4 64.8284 4 64C4 63.1716 4.6716 62.5 5.5 62.5C6.3284 62.5 7 63.1716 7 64ZM10.5 65.5C11.3284 65.5 12 64.8284 12 64C12 63.1716 11.3284 62.5 10.5 62.5C9.6716 62.5 9 63.1716 9 64C9 64.8284 9.6716 65.5 10.5 65.5Z"
              fill="var(--wm-redesign-palette-hint)"
            />
          </g>
        </g>
        <defs>
          <filter
            id="filter0_d_sidebar_toggle"
            x="-24"
            y="0"
            width="66"
            height="142"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feOffset dy="12" />
            <feGaussianBlur stdDeviation="12" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.4 0" />
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_sidebar_toggle" />
            <feBlend in="SourceGraphic" in2="effect1_dropShadow_sidebar_toggle" result="shape" />
          </filter>
          <clipPath id="clip0_sidebar_toggle">
            <rect width="42" height="142" fill="white" />
          </clipPath>
        </defs>
      </svg>
    </button>
  );
}

function UserMenu({
  open,
}: {
  open: boolean;
}) {
  return (
    <AnimatePresence initial={false}>
      {open ? (
        <motion.div
          role="menu"
          initial={{ opacity: 0, y: 8, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.99 }}
          transition={{ duration: MOTION.userMenu, ease: MOTION.ease }}
          style={{ willChange: "transform, opacity" }}
          className="absolute bottom-[66px] left-[10px] z-40 w-[188px] rounded-2xl border border-white/12 bg-[#26282d] p-2 shadow-[0_18px_34px_rgba(0,0,0,0.35)]"
        >
          {["Profile", "Account settings", "Log out"].map((entry) => (
            <button
              key={entry}
              type="button"
              role="menuitem"
              className="flex h-9 w-full items-center rounded-xl px-3 text-sm text-white/88 transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white/9 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/35"
            >
              {entry}
            </button>
          ))}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function ProfileSlideSheet({
  open,
  onClose,
  mode,
}: {
  open: boolean;
  onClose: () => void;
  mode: "left" | "full";
}) {
  const wrapperClass =
    mode === "full"
      ? "absolute left-2 right-2 top-2 bottom-[86px] z-[70] overflow-y-auto rounded-3xl p-2.5"
      : "absolute left-0 right-0 top-[150px] bottom-[86px] z-[70] overflow-y-auto rounded-3xl p-2.5";

  return (
    <AnimatePresence initial={false}>
      {open ? (
        <motion.div
          key="sidebar-profile-sheet"
          initial={{ y: "100%" }}
          animate={{ y: "0%" }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.24, ease: MOTION.ease }}
          className={wrapperClass}
          style={{
            opacity: 1,
            backgroundColor: "#dc2626",
            backgroundImage: "none",
            mixBlendMode: "normal",
            backdropFilter: "none",
            WebkitBackdropFilter: "none",
            willChange: "transform, opacity",
          }}
        >
          <div
            className="h-full rounded-2xl p-3"
            style={{
              opacity: 1,
              backgroundColor: "#dc2626",
              backgroundImage: "none",
              mixBlendMode: "normal",
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-[#ff4d2e] text-xs font-bold text-white">
                  Y
                </span>
                <span className="grid h-6 w-6 place-items-center rounded-full bg-white/14 text-[11px] font-semibold text-white/95">
                  ID
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close profile"
                className="grid h-8 w-8 place-items-center rounded-xl text-white/80 transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 flex flex-col items-center text-center">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-[#f4e8d2] text-3xl">🦊</div>
              <p className="mt-2 text-[20px] font-semibold leading-tight text-white/95">Mattia Vizzi</p>
              <p className="mt-1 text-[12px] text-white/58">mattiavizzimail@gmail.com</p>
            </div>

            <div className="space-y-1">
              <button
                type="button"
                className="flex h-10 w-full items-center gap-3 rounded-xl px-1.5 text-[15px] text-white/95 transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white/8"
              >
                <Mail className="h-[18px] w-[18px] text-white/88" />
                <span>Email</span>
              </button>
              <button
                type="button"
                className="flex h-10 w-full items-center gap-3 rounded-xl px-1.5 text-[15px] text-white/95 transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white/8"
              >
                <HardDrive className="h-[18px] w-[18px] text-white/88" />
                <span>Disk</span>
              </button>
            </div>

            <div className="my-2 h-px w-full bg-white/10" />

            <button
              type="button"
              className="flex h-10 w-full items-center gap-3 rounded-xl px-1.5 text-[15px] text-white/95 transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white/8"
            >
              <Moon className="h-[18px] w-[18px] text-white/88" />
              <span>Appearance</span>
            </button>

            <div className="my-2 h-px w-full bg-white/10" />

            <button
              type="button"
              className="flex h-10 w-full items-center gap-3 rounded-xl px-1.5 text-[15px] text-white/95 transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white/8"
            >
              <ArrowLeftRight className="h-[18px] w-[18px] text-white/88" />
              <span>Change account</span>
            </button>

            <div className="my-2 h-px w-full bg-white/10" />

            <div className="space-y-1">
              <button
                type="button"
                className="flex h-10 w-full items-center gap-3 rounded-xl px-1.5 text-[15px] text-white/95 transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white/8"
              >
                <Settings className="h-[18px] w-[18px] text-white/88" />
                <span>Settings</span>
              </button>
              <button
                type="button"
                className="flex h-10 w-full items-center gap-3 rounded-xl px-1.5 text-[15px] text-white/95 transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white/8"
              >
                <CircleUserRound className="h-[18px] w-[18px] text-white/88" />
                <span>Account management</span>
              </button>
              <button
                type="button"
                className="flex h-10 w-full items-center gap-3 rounded-xl px-1.5 text-[15px] text-white/95 transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white/8"
              >
                <CircleHelp className="h-[18px] w-[18px] text-white/88" />
                <span>Help</span>
              </button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

type SidebarTestClientProps = {
  embedded?: boolean;
  className?: string;
};

export function SidebarTestClient({ embedded = false, className }: SidebarTestClientProps = {}) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeItemId, setActiveItemId] = useState<ItemId>("display");
  const [openPanelItemId, setOpenPanelItemId] = useState<ItemId | null>(null);
  const [hoveredItemId, setHoveredItemId] = useState<ItemId | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const openMenuIds: ItemId[] = [
    "search",
    "summary",
    "website-opt",
    "efficiency",
    "indexing",
    "tools",
    "display",
    "links",
    "services",
  ];

  const activeItem = ITEMS.find((entry) => entry.id === activeItemId) ?? ITEMS[0];
  const panelItem = ITEMS.find((entry) => entry.id === openPanelItemId) ?? activeItem;
  const goHome = () => router.push("/");

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!shellRef.current) return;
      if (!shellRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
        setIsProfileSheetOpen(false);
        if (isExpanded) {
          setIsExpanded(false);
          setOpenPanelItemId(null);
        }
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [isExpanded]);

  useEffect(() => {
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setUserMenuOpen(false);
        setIsProfileSheetOpen(false);
        if (isExpanded) {
          setIsExpanded(false);
          setOpenPanelItemId(null);
        }
      }
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [isExpanded]);

  const sidebarNode = (
    <motion.aside
      ref={shellRef}
      initial={false}
      onPointerDownCapture={(event) => {
        if (!isProfileSheetOpen) return;
        const target = event.target as HTMLElement;
        if (target.closest("[data-profile-toggle='true']")) return;
        setIsProfileSheetOpen(false);
      }}
      animate={{
        width: isExpanded ? OPEN_LEFT_WIDTH + (openPanelItemId ? OPEN_RIGHT_WIDTH : 0) : RAIL_WIDTH,
      }}
      transition={WIDTH_SPRING}
      className={cn(
        "relative h-full shrink-0 [will-change:width] [transform:translateZ(0)]",
        embedded && "hidden md:block",
        className
      )}
    >
      {!isExpanded ? (
        <div className="absolute inset-0 overflow-hidden rounded-[28px] border border-white/16 bg-[#25272c] shadow-[0_20px_50px_rgba(0,0,0,0.32)]">
          <div className="absolute left-0 top-0 z-20 flex h-full w-[92px] flex-col px-2 py-3">
            <button
              type="button"
              aria-label="Logo"
              onClick={goHome}
              className="mx-auto mt-1 grid h-11 w-11 place-items-center rounded-[14px] border border-white/70 text-base font-semibold text-white/95"
            >
              Y
            </button>

            <nav className="mt-4 flex flex-col items-center gap-1.5">
              {ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeItemId === item.id;
                return (
                  <motion.button
                    key={item.id}
                    type="button"
                    aria-label={item.label}
                    whileTap={{ scale: 0.98 }}
                    onMouseEnter={() => setHoveredItemId(item.id)}
                    onMouseLeave={() => setHoveredItemId(null)}
                    onClick={() => {
                      setActiveItemId(item.id);
                      setIsExpanded(true);
                      setOpenPanelItemId(null);
                      setUserMenuOpen(false);
                      setIsProfileSheetOpen(false);
                    }}
                    className={cn(
                      "relative grid h-11 w-11 place-items-center rounded-2xl text-[#d4d8de] transition-[background-color,color,transform,box-shadow] duration-220 ease-[cubic-bezier(0.22,1,0.36,1)]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/35 focus-visible:ring-offset-0",
                      hoveredItemId === item.id && !isActive && "bg-white/10 text-white",
                      isActive && "bg-white/18 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </motion.button>
                );
              })}
            </nav>

            <div className="relative z-[130] mt-auto flex flex-col items-center gap-1.5 pb-1">
              <motion.button
                type="button"
                aria-label="Open profile panel"
                aria-expanded={isProfileSheetOpen}
                data-profile-toggle="true"
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setIsExpanded(true);
                  setOpenPanelItemId(null);
                  setIsProfileSheetOpen(true);
                  setUserMenuOpen(false);
                }}
                className="grid h-9 w-9 place-items-center rounded-xl bg-[#ffe9d6] text-base leading-none text-[#1f2329] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                <CircleUserRound className="h-[16px] w-[16px]" />
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                aria-label="Notifications"
                className="grid h-10 w-10 place-items-center rounded-2xl text-[#d4d8de] transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/35"
              >
                <Bell className="h-[18px] w-[18px]" />
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                aria-label="Help"
                className="grid h-10 w-10 place-items-center rounded-2xl text-[#d4d8de] transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/35"
              >
                <CircleHelp className="h-[18px] w-[18px]" />
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                aria-label="Settings"
                className="grid h-10 w-10 place-items-center rounded-2xl text-[#d4d8de] transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/35"
              >
                <Settings className="h-[18px] w-[18px]" />
              </motion.button>
            </div>

            <UserMenu open={userMenuOpen} />
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 overflow-hidden rounded-[28px] border border-white/16 bg-[#25272c] shadow-[0_20px_50px_rgba(0,0,0,0.32)]">
          <div
            className={cn("grid h-full p-4", openPanelItemId ? "gap-0" : "grid-cols-1")}
            style={
              openPanelItemId
                ? { gridTemplateColumns: `${OPEN_LEFT_WIDTH - 32}px minmax(0,1fr)` }
                : undefined
            }
          >
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{
                opacity: 1,
                x: 0,
                transition: {
                  duration: MOTION.contentIn,
                  delay: MOTION.contentDelay,
                  ease: MOTION.ease,
                },
              }}
              exit={{
                opacity: 0,
                x: 5,
                transition: {
                  duration: MOTION.contentOut,
                  ease: MOTION.easeSoft,
                },
              }}
              style={{ willChange: "transform, opacity" }}
              className={cn(
                "relative flex h-full flex-col",
                openPanelItemId ? "border-r border-white/14 pr-4" : "pr-1"
              )}
            >
              <div className="flex items-center gap-2 px-1">
                <button
                  type="button"
                  aria-label="Go to homepage"
                  onClick={goHome}
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/75 text-xl font-semibold text-white/95"
                >
                  Y
                </button>
                <p className="text-[39px] font-semibold leading-none tracking-tight text-white/92">
                  Webmaster
                </p>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  className="flex h-10 flex-1 items-center justify-between rounded-full bg-white/16 px-4 text-[15px] font-medium text-white/90"
                >
                  <span className="inline-flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    openlymarket.xyz
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-80" />
                </button>
                <button
                  type="button"
                  aria-label="Add"
                  className="grid h-10 w-10 place-items-center rounded-full bg-white/16 text-white/88"
                >
                  <span className="text-xl leading-none">+</span>
                </button>
              </div>

              <nav className="mt-6 space-y-1.5">
                {openMenuIds.map((id) => {
                  const item = ITEMS.find((entry) => entry.id === id);
                  if (!item) return null;
                  const Icon = item.icon;
                  const isCurrent = activeItemId === item.id;
                  const isPanelOpen = openPanelItemId === item.id;
                  return (
                    <button
                      key={`expanded-${item.id}`}
                      type="button"
                      onClick={() => {
                        setActiveItemId(item.id);
                        setOpenPanelItemId(item.id);
                        setIsProfileSheetOpen(false);
                      }}
                      className={cn(
                        "flex h-10 w-full items-center gap-3 rounded-full px-3 text-[15px] leading-none text-white/88 transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
                        isCurrent ? "bg-white/18 text-white" : "hover:bg-white/9 hover:text-white"
                      )}
                    >
                      <Icon className="h-[17px] w-[17px] shrink-0" />
                      <span className="truncate">{item.label}</span>
                      {item.expandable ? (
                        isPanelOpen ? (
                          <ChevronRight className="ml-auto h-4 w-4 opacity-80" />
                        ) : (
                          <ChevronDown className="ml-auto h-4 w-4 opacity-75" />
                        )
                      ) : null}
                    </button>
                  );
                })}
              </nav>

              <div className="relative z-[130] mt-auto flex items-center justify-between px-2 pb-1">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  aria-label="Profile"
                  data-profile-toggle="true"
                  onClick={() => setIsProfileSheetOpen((prev) => !prev)}
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-xl text-[#1f2329] transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    isProfileSheetOpen ? "bg-[#f3dcc7]" : "bg-[#ffe9d6]"
                  )}
                >
                  <CircleUserRound className="h-[16px] w-[16px]" />
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  aria-label="Notifications"
                  className="grid h-9 w-9 place-items-center rounded-xl text-[#d4d8de] transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white/10 hover:text-white"
                >
                  <Bell className="h-[18px] w-[18px]" />
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  aria-label="Help"
                  className="grid h-9 w-9 place-items-center rounded-xl text-[#d4d8de] transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white/10 hover:text-white"
                >
                  <CircleHelp className="h-[18px] w-[18px]" />
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  aria-label="Settings"
                  className="grid h-9 w-9 place-items-center rounded-xl text-[#d4d8de] transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white/10 hover:text-white"
                >
                  <Settings className="h-[18px] w-[18px]" />
                </motion.button>
              </div>

              <ProfileSlideSheet
                open={isProfileSheetOpen && !openPanelItemId}
                mode="left"
                onClose={() => setIsProfileSheetOpen(false)}
              />
            </motion.div>

            {openPanelItemId ? (
              <motion.div
                key={`panel-${openPanelItemId}`}
                initial={{ opacity: 0, x: 8 }}
                animate={{
                  opacity: 1,
                  x: 0,
                  transition: { duration: MOTION.contentIn, ease: MOTION.ease, delay: 0.04 },
                }}
                style={{ willChange: "transform, opacity" }}
                className="min-w-0 pl-6 pt-5 pr-3"
              >
                <p className="text-[15px] font-semibold leading-tight text-white/92">
                  {panelItem.panel.heading}
                </p>
                <div className="mt-4 space-y-3">
                  {panelItem.panel.lines.map((line) => (
                    <p
                      key={`${panelItem.id}-${line}`}
                      className="text-[15px] font-medium leading-tight text-white/86"
                    >
                      {line}
                    </p>
                  ))}
                </div>
                <button
                  type="button"
                  className="mt-4 flex h-10 w-full items-center rounded-full bg-white/16 px-4 text-[15px] font-medium text-white/90"
                >
                  {panelItem.panel.cta}
                </button>
              </motion.div>
            ) : null}
          </div>

          <ProfileSlideSheet
            open={isProfileSheetOpen && Boolean(openPanelItemId)}
            mode="full"
            onClose={() => setIsProfileSheetOpen(false)}
          />

          {isProfileSheetOpen ? (
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              aria-label="Profile duplicate toggle"
              data-profile-toggle="true"
              onClick={() => setIsProfileSheetOpen((prev) => !prev)}
              className="absolute bottom-4 left-6 z-[180] grid h-9 w-9 place-items-center rounded-xl bg-[#ffe9d6] text-[#1f2329] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <CircleUserRound className="h-[16px] w-[16px]" />
            </motion.button>
          ) : null}
        </div>
      )}

      <SidebarToggleHandle
        expanded={isExpanded}
        onToggle={() => {
          setUserMenuOpen(false);
          setIsProfileSheetOpen(false);
          if (!isExpanded) {
            setIsExpanded(true);
            return;
          }
          if (openPanelItemId) {
            setOpenPanelItemId(null);
            return;
          }
          setIsExpanded(false);
        }}
      />
    </motion.aside>
  );

  if (embedded) {
    return <div className="relative h-full min-h-0 min-w-0 overflow-visible">{sidebarNode}</div>;
  }

  return (
    <div className="h-screen w-full overflow-hidden bg-[#0b0d10] text-white">
      <h1 className="sr-only">Sidebar test</h1>
      <main className="mx-auto flex h-full w-full max-w-[1600px] px-2 py-2 md:px-3 md:py-3">
        {sidebarNode}
        <section className="flex-1" />
      </main>
    </div>
  );
}

export default SidebarTestClient;
