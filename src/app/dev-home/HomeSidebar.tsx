"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  ChartNoAxesColumn,
  ChevronDown,
  Compass,
  Feather,
  House,
  Mail,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { GlobalCommandSearch } from "@/components/search/GlobalCommandSearch";
import { getCommandSearchThemeVars } from "../dev/command-search-theme";
import {
  DEV_HOME_INTERNAL_SHORTCUT_LETTERS,
  DEV_HOME_RAIL_SHORTCUTS,
  DEV_HOME_SHORTCUT_CHORD_TIMEOUT_MS,
  DEV_HOME_SIDEBAR_TOGGLE_KEY,
  DEV_HOME_SIDEBAR_TOGGLE_LABEL,
  DEV_HOME_SIDEBAR_TOGGLE_TOOLTIP_TEXT,
} from "./shortcuts";

type RailItemId = "home" | "discover" | "compose" | "stats" | "messages";

type RailItem = {
  id: RailItemId;
  icon: LucideIcon;
  label: string;
  shortcut?: string;
};

const RAIL_ITEMS: RailItem[] = [
  {
    id: "home",
    icon: House,
    label: "Home",
    shortcut: DEV_HOME_RAIL_SHORTCUTS.home,
  },
  {
    id: "discover",
    icon: Compass,
    label: "Discover",
    shortcut: DEV_HOME_RAIL_SHORTCUTS.discover,
  },
  {
    id: "compose",
    icon: Feather,
    label: "Compose",
    shortcut: DEV_HOME_RAIL_SHORTCUTS.compose,
  },
  {
    id: "stats",
    icon: ChartNoAxesColumn,
    label: "Stats",
    shortcut: DEV_HOME_RAIL_SHORTCUTS.stats,
  },
  {
    id: "messages",
    icon: Mail,
    label: "Messages",
    shortcut: DEV_HOME_RAIL_SHORTCUTS.messages,
  },
];

const ACCORDION_CONTENT: Record<RailItemId, string[]> = {
  home: ["Overview", "Quick actions", "Recent", "Favorites"],
  discover: ["Trending", "Collections", "Suggestions", "Saved"],
  compose: ["New draft", "Templates", "Scheduled", "History"],
  stats: ["Traffic", "Conversions", "Performance", "Funnels"],
  messages: ["Inbox", "Mentions", "Archived", "Priority"],
};

const RAIL_WIDTH = 92;
const MINI_SIDEBAR_WIDTH = 292;
const NAV_TOP = 250;
const RAIL_SLOT_HEIGHT = 64;
const BUTTON_LEFT = 19;
const LOGO_SLOT_WIDTH = 54;
const OPEN_BUTTON_WIDTH = MINI_SIDEBAR_WIDTH - BUTTON_LEFT * 2;
const CLOSED_BUTTON_WIDTH = 54;
const WORDMARK_REVEAL_WIDTH = 194;
const WORDMARK_OFFSET_FROM_LOGO = -15;
const ACCORDION_ICON_CENTER_X = 26;
const ACCORDION_ITEMS_START_X = 36;
const SEARCH_TRIGGER_HEIGHT = 40;
const SEARCH_TOP = 12;
const LOGO_ROW_HEIGHT = SEARCH_TRIGGER_HEIGHT;
const LOGO_TOP = SEARCH_TOP;
const SEARCH_LEFT_GAP = 24;
const SEARCH_RIGHT_GAP = 24;
const SEARCH_FIXED_LEFT = MINI_SIDEBAR_WIDTH + SEARCH_LEFT_GAP;
const HEADER_ICON_BUTTON_SIZE = 32;
const CLOSE_SIDEBAR_ICON_TOP = SEARCH_TOP + (LOGO_ROW_HEIGHT - HEADER_ICON_BUTTON_SIZE) / 2;

const WIDTH_SPRING = {
  type: "spring",
  stiffness: 220,
  damping: 30,
  mass: 0.95,
  restSpeed: 0.35,
  restDelta: 0.35,
} as const;

const CONTENT_TRANSITION_IN = {
  duration: 0.24,
  ease: [0.22, 1, 0.36, 1] as const,
};

const LOGO_REVEAL_TRANSITION = {
  duration: 0.24,
  ease: [0.22, 1, 0.36, 1] as const,
};

type RailIconMotionState = { x: number; y: number; rotate: number; scale: number };

const RAIL_ICON_MOTION_VARIANTS: Record<
  RailItemId,
  { rest: RailIconMotionState; active: RailIconMotionState; hover: RailIconMotionState }
> =
  {
    home: {
      rest: { x: 0, y: 0, rotate: 0, scale: 1 },
      active: { x: 0, y: -1.6, rotate: -2, scale: 1.03 },
      hover: { x: 0, y: -1.4, rotate: -2, scale: 1.03 },
    },
    discover: {
      rest: { x: 0, y: 0, rotate: 0, scale: 1 },
      active: { x: 0, y: -1.2, rotate: 10, scale: 1.04 },
      hover: { x: 0, y: -1.1, rotate: 9, scale: 1.04 },
    },
    compose: {
      rest: { x: 0, y: 0, rotate: 0, scale: 1 },
      active: { x: 0.5, y: -1.1, rotate: -8, scale: 1.04 },
      hover: { x: 0.45, y: -1.05, rotate: -7, scale: 1.04 },
    },
    stats: {
      rest: { x: 0, y: 0, rotate: 0, scale: 1 },
      active: { x: 0, y: -1.2, rotate: -2, scale: 1.04 },
      hover: { x: 0, y: -1.1, rotate: -2, scale: 1.04 },
    },
    messages: {
      rest: { x: 0, y: 0, rotate: 0, scale: 1 },
      active: { x: 0.4, y: -1, rotate: -2, scale: 1.03 },
      hover: { x: 0.35, y: -0.95, rotate: -2, scale: 1.03 },
    },
  };

const RAIL_ICON_MOTION_TRANSITION = {
  duration: 0.28,
  ease: [0.22, 1, 0.36, 1] as const,
};

const IOS_GLASS_HOVER_CLASSNAME =
  "transition-[background-color,color,box-shadow,backdrop-filter] duration-150 ease-out hover:bg-[rgba(57,61,69,0.76)] hover:text-white/95 hover:backdrop-blur-[12px] hover:backdrop-saturate-[125%] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_10px_24px_rgba(0,0,0,0.34)] focus-visible:bg-[rgba(57,61,69,0.76)] focus-visible:text-white/95 focus-visible:backdrop-blur-[12px] focus-visible:backdrop-saturate-[125%] focus-visible:shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_10px_24px_rgba(0,0,0,0.34)]";

const INTERNAL_IOS_GLASS_HOVER_CLASSNAME = IOS_GLASS_HOVER_CLASSNAME;

const TOOLTIP_CLASSNAME =
  "pointer-events-none absolute left-full top-1/2 z-[2147483647] ml-3 -translate-y-1/2 whitespace-nowrap rounded-[14px] [corner-shape:squircle] border border-white/14 bg-[rgba(20,16,16,0.86)] px-3 py-1 text-[13px] font-medium leading-none tracking-[0.01em] text-[#f5f5f7] opacity-0 backdrop-blur-[10px] backdrop-saturate-[120%] shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_8px_18px_rgba(0,0,0,0.32)] transition-opacity duration-150 ease-out group-hover:opacity-100 group-focus-visible:opacity-100";

const INTERNAL_SHORTCUT_TOOLTIP_CLASSNAME =
  "pointer-events-none absolute left-full top-1/2 z-[2147483647] ml-3 -translate-y-1/2 whitespace-nowrap opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100 group-focus-visible:opacity-100";

const CLOSE_SIDEBAR_TOOLTIP_CLASSNAME =
  "pointer-events-none absolute left-full top-1/2 z-[2147483647] ml-3 -translate-y-1/2 whitespace-nowrap rounded-[14px] [corner-shape:squircle] border border-white/14 bg-[rgba(20,16,16,0.86)] px-3 py-1 text-[13px] font-medium leading-none tracking-[0.01em] text-[#f5f5f7] opacity-0 backdrop-blur-[10px] backdrop-saturate-[120%] shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_8px_18px_rgba(0,0,0,0.32)] transition-opacity duration-150 ease-out group-hover:opacity-100 group-focus-within:opacity-100";

const ACTIVE_BUTTON_CLASSNAME =
  "group relative h-[46px] [corner-shape:squircle] rounded-[14px] bg-[#3f67ff] text-white transition-[box-shadow,background-color,color] duration-150 ease-out shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_4px_10px_rgba(0,0,0,0.22),0_8px_14px_rgba(63,103,255,0.2)]";

const IDLE_CLOSED_CLASSNAME =
  `group relative h-[46px] [corner-shape:squircle] rounded-[14px] text-[#73757f] ${IOS_GLASS_HOVER_CLASSNAME}`;

const IDLE_OPEN_CLASSNAME =
  `group relative h-[46px] [corner-shape:squircle] rounded-[14px] bg-transparent text-white ${IOS_GLASS_HOVER_CLASSNAME}`;

export function HomeSidebar() {
  const [activeItemId, setActiveItemId] = useState<RailItemId>("compose");
  const [openAccordionId, setOpenAccordionId] = useState<RailItemId | null>("compose");
  const [isMiniSidebarOpen, setMiniSidebarOpen] = useState(false);
  const [isRailClosing, setRailClosing] = useState(false);
  const asideRef = useRef<HTMLElement | null>(null);
  const internalShortcutButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const shortcutChordCategoryRef = useRef<RailItemId | null>(null);
  const shortcutChordTimeoutRef = useRef<number | null>(null);
  const commandSearchVars = {
    ...getCommandSearchThemeVars(),
    "--cmdk-trigger-bg": "#0D0D0D",
    "--cmdk-trigger-hover-bg": "#0D0D0D",
    "--cmdk-trigger-border-color": "rgba(255, 255, 255, 0.10)",
    "--cmdk-trigger-border-width": "1px",
    "--cmdk-trigger-height": `${SEARCH_TRIGGER_HEIGHT}px`,
    "--cmdk-trigger-radius": "999px",
    "--cmdk-placeholder-color": "rgba(232, 232, 236, 0.82)",
    "--cmdk-placeholder-size": "15px",
    "--cmdk-placeholder-weight": "500",
    "--cmdk-shortcut-bg": "rgba(66, 69, 78, 0.46)",
    "--cmdk-shortcut-color": "rgba(220, 223, 229, 0.78)",
    "--cmdk-popup-bg": "#0D0D0D",
    "--cmdk-popup-border-color": "rgba(255, 255, 255, 0.14)",
    "--cmdk-popup-border-width": "1px",
    "--cmdk-popup-radius": "18px",
    "--cmdk-open-offset": "12px",
  } as CSSProperties;

  const clearShortcutChord = useCallback(() => {
    shortcutChordCategoryRef.current = null;
    if (shortcutChordTimeoutRef.current !== null) {
      window.clearTimeout(shortcutChordTimeoutRef.current);
      shortcutChordTimeoutRef.current = null;
    }
  }, []);

  const startShortcutChord = useCallback((categoryId: RailItemId) => {
    clearShortcutChord();
    shortcutChordCategoryRef.current = categoryId;
    shortcutChordTimeoutRef.current = window.setTimeout(() => {
      shortcutChordCategoryRef.current = null;
      shortcutChordTimeoutRef.current = null;
    }, DEV_HOME_SHORTCUT_CHORD_TIMEOUT_MS);
  }, [clearShortcutChord]);

  const closeMiniSidebar = () => {
    if (!isMiniSidebarOpen) {
      return;
    }

    clearShortcutChord();
    setRailClosing(true);
    setMiniSidebarOpen(false);
  };

  useEffect(() => {
    if (!isMiniSidebarOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const asideElement = asideRef.current;
      const targetNode = event.target as Node | null;

      if (!asideElement || !targetNode) {
        return;
      }

      if (!asideElement.contains(targetNode)) {
        clearShortcutChord();
        setRailClosing(true);
        setMiniSidebarOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [clearShortcutChord, isMiniSidebarOpen]);

  useEffect(() => {
    const isTypingTarget = (target: EventTarget | null) => {
      const element = target as HTMLElement | null;
      if (!element) {
        return false;
      }
      const tagName = element.tagName;
      return (
        element.isContentEditable ||
        tagName === "INPUT" ||
        tagName === "TEXTAREA" ||
        tagName === "SELECT"
      );
    };

    const findCategoryByShortcut = (shortcutKey: string) =>
      RAIL_ITEMS.find((item) => item.shortcut?.toUpperCase() === shortcutKey)?.id ?? null;

    const handleGlobalShortcuts = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) {
        return;
      }

      const key = event.key.length === 1 ? event.key.toUpperCase() : event.key.toUpperCase();

      if (!event.metaKey && !event.altKey && !event.shiftKey && event.ctrlKey) {
        if (event.repeat || key !== DEV_HOME_SIDEBAR_TOGGLE_KEY.toUpperCase()) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        clearShortcutChord();

        if (isMiniSidebarOpen) {
          setRailClosing(true);
          setMiniSidebarOpen(false);
          return;
        }

        setRailClosing(false);
        setOpenAccordionId(null);
        setMiniSidebarOpen(true);
        return;
      }

      if (!event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey && !event.repeat) {
        const matchedCategoryId = findCategoryByShortcut(key);
        if (!matchedCategoryId) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        setActiveItemId(matchedCategoryId);

        if (isMiniSidebarOpen) {
          setOpenAccordionId((previous) => (previous === matchedCategoryId ? null : matchedCategoryId));
          return;
        }

        setRailClosing(false);
        setOpenAccordionId(null);
        setMiniSidebarOpen(true);
        return;
      }

      if (!event.ctrlKey && !event.metaKey && event.altKey && !event.shiftKey && !event.repeat) {
        const matchedCategoryId = findCategoryByShortcut(key);
        if (matchedCategoryId) {
          event.preventDefault();
          event.stopPropagation();
          setActiveItemId(matchedCategoryId);
          setRailClosing(false);
          setMiniSidebarOpen(true);
          setOpenAccordionId(matchedCategoryId);
          startShortcutChord(matchedCategoryId);
          return;
        }

        const internalShortcutIndex = DEV_HOME_INTERNAL_SHORTCUT_LETTERS.findIndex(
          (shortcutLetter) => shortcutLetter === key
        );
        if (internalShortcutIndex === -1) {
          return;
        }

        const chordCategoryId = shortcutChordCategoryRef.current;
        if (!chordCategoryId) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        clearShortcutChord();
        setActiveItemId(chordCategoryId);
        setRailClosing(false);
        setMiniSidebarOpen(true);
        setOpenAccordionId(chordCategoryId);

        const buttonKey = `${chordCategoryId}:${internalShortcutIndex}`;
        const clickInternalShortcutButton = () => {
          const button = internalShortcutButtonRefs.current[buttonKey];
          if (!button) {
            return;
          }
          button.focus();
          button.click();
        };

        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(clickInternalShortcutButton);
        });
      }
    };

    window.addEventListener("keydown", handleGlobalShortcuts);
    return () => {
      window.removeEventListener("keydown", handleGlobalShortcuts);
    };
  }, [clearShortcutChord, isMiniSidebarOpen, startShortcutChord]);

  useEffect(() => {
    return () => {
      if (shortcutChordTimeoutRef.current !== null) {
        window.clearTimeout(shortcutChordTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const appRootShell = document.getElementById("app-root-shell");
    const desktopMediaQuery = window.matchMedia("(min-width: 768px)");

    const previousStyles = {
      htmlOverflowX: html.style.overflowX,
      htmlOverflowY: html.style.overflowY,
      htmlHeight: html.style.height,
      bodyOverflowX: body.style.overflowX,
      bodyOverflowY: body.style.overflowY,
      bodyHeight: body.style.height,
      bodyOverscrollBehavior: body.style.overscrollBehavior,
      appRootShellOverflow: appRootShell?.style.overflow ?? "",
      appRootShellHeight: appRootShell?.style.height ?? "",
    };

    const applyDesktopScrollLock = () => {
      html.style.overflowX = "hidden";
      body.style.overflowX = "hidden";

      if (desktopMediaQuery.matches) {
        html.style.overflowY = "hidden";
        body.style.overflowY = "hidden";
        html.style.height = "100vh";
        body.style.height = "100vh";
        body.style.overscrollBehavior = "none";
        if (appRootShell) {
          appRootShell.style.overflow = "hidden";
          appRootShell.style.height = "100vh";
        }
        return;
      }

      html.style.overflowY = previousStyles.htmlOverflowY;
      body.style.overflowY = previousStyles.bodyOverflowY;
      html.style.height = previousStyles.htmlHeight;
      body.style.height = previousStyles.bodyHeight;
      body.style.overscrollBehavior = previousStyles.bodyOverscrollBehavior;
      if (appRootShell) {
        appRootShell.style.overflow = previousStyles.appRootShellOverflow;
        appRootShell.style.height = previousStyles.appRootShellHeight;
      }
    };

    applyDesktopScrollLock();

    const onDesktopMediaQueryChange = () => {
      applyDesktopScrollLock();
    };

    if (typeof desktopMediaQuery.addEventListener === "function") {
      desktopMediaQuery.addEventListener("change", onDesktopMediaQueryChange);
    } else {
      desktopMediaQuery.addListener(onDesktopMediaQueryChange);
    }

    return () => {
      if (typeof desktopMediaQuery.removeEventListener === "function") {
        desktopMediaQuery.removeEventListener("change", onDesktopMediaQueryChange);
      } else {
        desktopMediaQuery.removeListener(onDesktopMediaQueryChange);
      }

      html.style.overflowX = previousStyles.htmlOverflowX;
      html.style.overflowY = previousStyles.htmlOverflowY;
      html.style.height = previousStyles.htmlHeight;
      body.style.overflowX = previousStyles.bodyOverflowX;
      body.style.overflowY = previousStyles.bodyOverflowY;
      body.style.height = previousStyles.bodyHeight;
      body.style.overscrollBehavior = previousStyles.bodyOverscrollBehavior;

      if (appRootShell) {
        appRootShell.style.overflow = previousStyles.appRootShellOverflow;
        appRootShell.style.height = previousStyles.appRootShellHeight;
      }
    };
  }, []);

  const handleItemClick = (id: RailItemId) => {
    setActiveItemId(id);

    if (isMiniSidebarOpen) {
      setOpenAccordionId((previous) => (previous === id ? null : id));
      return;
    }

    setRailClosing(false);
    setOpenAccordionId(null);
    setMiniSidebarOpen(true);
  };

  const railMenuItems = RAIL_ITEMS.map(({ id, icon: Icon, label, shortcut }) => {
    const isActive = activeItemId === id;
    const isAccordionOpen = openAccordionId === id;
    const rowWidth = isMiniSidebarOpen ? OPEN_BUTTON_WIDTH : CLOSED_BUTTON_WIDTH;

    const rowClassName = isActive
      ? ACTIVE_BUTTON_CLASSNAME
      : isMiniSidebarOpen
        ? IDLE_OPEN_CLASSNAME
        : IDLE_CLOSED_CLASSNAME;

    const railRow = (
      <>
        <div
          className="flex w-full items-center"
          style={{
            height: `${RAIL_SLOT_HEIGHT}px`,
            justifyContent: isMiniSidebarOpen ? "flex-start" : "center",
            paddingLeft: isMiniSidebarOpen ? `${BUTTON_LEFT}px` : "0px",
          }}
        >
          <motion.button
            type="button"
            aria-label={label}
            initial={false}
            animate={isActive ? "active" : "rest"}
            whileHover="hover"
            whileFocus="hover"
            onClick={() => handleItemClick(id)}
            className={`${rowClassName} ${isMiniSidebarOpen ? "" : "grid place-items-center"}`}
            style={{
              width: `${rowWidth}px`,
              maxWidth: "100%",
            }}
          >
            <div
              className="pointer-events-none h-[20px] w-[20px] shrink-0"
              style={
                isMiniSidebarOpen
                  ? {
                      position: "absolute",
                      left: "16px",
                      top: "50%",
                      transform: "translateY(-50%)",
                    }
                  : { position: "relative" }
              }
            >
              <motion.div
                variants={RAIL_ICON_MOTION_VARIANTS[id]}
                transition={RAIL_ICON_MOTION_TRANSITION}
                className="h-full w-full"
                style={{ willChange: "transform", overflow: "visible" }}
              >
                <Icon className="h-[20px] w-[20px]" strokeWidth={2.15} />

                {id === "stats" ? (
                  <motion.svg
                    className="pointer-events-none absolute inset-0 h-[20px] w-[20px]"
                    viewBox="0 0 20 20"
                    fill="none"
                    aria-hidden="true"
                  >
                    <motion.path
                      d="M2.6 13.8L5.7 11L9.2 10.8L12.8 7.9L16.8 6.9"
                      stroke="currentColor"
                      strokeWidth="1.35"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      variants={{
                        rest: { pathLength: 0.72, opacity: 0.56 },
                        active: { pathLength: 1, opacity: 0.88 },
                        hover: { pathLength: [0.7, 1, 0.96], opacity: [0.56, 0.96, 0.82] },
                      }}
                      transition={{ duration: 0.56, ease: [0.22, 1, 0.36, 1] }}
                    />

                    <motion.circle
                      r="1.05"
                      fill="currentColor"
                      variants={{
                        rest: { cx: 16.8, cy: 6.9, opacity: 0.58, scale: 0.92 },
                        active: { cx: 16.8, cy: 6.9, opacity: 0.9, scale: 1 },
                        hover: {
                          cx: [5.7, 9.2, 12.8, 16.8],
                          cy: [11, 10.8, 7.9, 6.9],
                          opacity: [0.5, 1, 1, 0.95],
                          scale: [0.82, 1.08, 1.02, 1],
                        },
                      }}
                      transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
                    />
                    <motion.rect
                      x="4.15"
                      width="1.55"
                      rx="0.55"
                      fill="currentColor"
                      variants={{
                        rest: { y: 9.8, height: 4.5, opacity: 0.52 },
                        active: { y: 8.9, height: 5.4, opacity: 0.74 },
                        hover: { y: [9.8, 8.4, 9.2], height: [4.2, 6.1, 5], opacity: [0.52, 0.9, 0.72] },
                      }}
                      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                    />
                    <motion.rect
                      x="8.85"
                      width="1.55"
                      rx="0.55"
                      fill="currentColor"
                      variants={{
                        rest: { y: 8.2, height: 5.2, opacity: 0.6 },
                        active: { y: 7.2, height: 6.2, opacity: 0.86 },
                        hover: { y: [8.2, 7, 7.6], height: [5, 6.9, 5.9], opacity: [0.6, 0.96, 0.82] },
                      }}
                      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1], delay: 0.03 }}
                    />
                    <motion.rect
                      x="13.55"
                      width="1.55"
                      rx="0.55"
                      fill="currentColor"
                      variants={{
                        rest: { y: 7.5, height: 4.5, opacity: 0.56 },
                        active: { y: 6.6, height: 5.4, opacity: 0.78 },
                        hover: { y: [7.5, 6.2, 6.9], height: [4.4, 6, 5.2], opacity: [0.56, 0.9, 0.74] },
                      }}
                      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1], delay: 0.06 }}
                    />
                  </motion.svg>
                ) : null}

                {id === "messages" ? (
                  <motion.svg
                    className="pointer-events-none absolute inset-0 h-[20px] w-[20px]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.15"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <motion.path
                      d="M3.75 8.35L12 13.25L20.25 8.35"
                      variants={{
                        rest: { y: -1.2, opacity: 0 },
                        active: { y: 0.2, opacity: 0.72 },
                        hover: { y: [-1.2, 1.1, 0.2], opacity: [0, 1, 0.8] },
                      }}
                      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </motion.svg>
                ) : null}
              </motion.div>
            </div>

            {isMiniSidebarOpen ? (
              <span className="flex h-full w-full items-center justify-between pl-12 pr-4">
                <span className="truncate text-[14px] font-semibold leading-[1.2] text-white">{label}</span>
                <motion.span
                  initial={false}
                  animate={{
                    rotate: isAccordionOpen ? 0 : -90,
                  }}
                  transition={RAIL_ICON_MOTION_TRANSITION}
                  className="text-white/90 transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                >
                  <ChevronDown className="h-4 w-4" />
                </motion.span>
              </span>
            ) : isRailClosing ? null : (
              <span className={TOOLTIP_CLASSNAME} role="tooltip">
                <span className="inline-flex items-center gap-2">
                  <span>{label}</span>
                  {shortcut ? (
                    <span className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full border border-white/25 bg-[linear-gradient(170deg,rgba(255,255,255,0.16),rgba(255,255,255,0.08))] px-1 text-[11px] font-semibold leading-none text-[#f8fbff] shadow-[inset_0_1px_0_rgba(255,255,255,0.24),0_4px_10px_rgba(0,0,0,0.24)]">
                      {shortcut}
                    </span>
                  ) : null}
                </span>
              </span>
            )}
          </motion.button>
        </div>

        <AnimatePresence initial={false}>
          {isMiniSidebarOpen && isAccordionOpen ? (
            <motion.div
              key={`${id}-accordion`}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-visible"
            >
              <div
                className="mb-2"
                style={{ paddingLeft: `${BUTTON_LEFT}px`, paddingRight: `${BUTTON_LEFT}px` }}
              >
                <div className="relative">
                  <div
                    className="pointer-events-none absolute bottom-1 top-1 rounded-full"
                    style={{
                      left: `${ACCORDION_ICON_CENTER_X}px`,
                      transform: "translateX(-50%)",
                      width: "1px",
                      background: "#73757f",
                    }}
                  />

                  <div
                    className="flex w-full flex-col gap-2"
                    style={{ paddingLeft: `${ACCORDION_ITEMS_START_X}px` }}
                  >
                    {ACCORDION_CONTENT[id].map((entry, entryIndex) => {
                      const categoryShortcut = shortcut ?? label.slice(0, 1).toUpperCase();
                      const internalShortcut =
                        DEV_HOME_INTERNAL_SHORTCUT_LETTERS[entryIndex] ??
                        String.fromCharCode(65 + (entryIndex % 26));
                      return (
                        <button
                          key={`${id}-${entry}`}
                          type="button"
                          aria-label={entry}
                          onClick={() => {
                            setActiveItemId(id);
                            setOpenAccordionId(id);
                          }}
                          ref={(element) => {
                            internalShortcutButtonRefs.current[`${id}:${entryIndex}`] = element;
                          }}
                          className={`group relative flex h-[46px] w-full items-center rounded-[14px] bg-transparent px-4 text-left text-[14px] font-semibold text-white ${INTERNAL_IOS_GLASS_HOVER_CLASSNAME}`}
                        >
                          {entry}
                          <span className={INTERNAL_SHORTCUT_TOOLTIP_CLASSNAME} role="tooltip">
                            <span className="inline-flex h-[22px] items-center justify-center rounded-full border border-white/25 bg-[linear-gradient(170deg,rgba(255,255,255,0.16),rgba(255,255,255,0.08))] px-2 text-[11px] font-semibold leading-none text-[#f8fbff] shadow-[inset_0_1px_0_rgba(255,255,255,0.24),0_4px_10px_rgba(0,0,0,0.24)]">
                              {`ALT + ${categoryShortcut} + ${internalShortcut}`}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </>
    );

    if (isMiniSidebarOpen) {
      return (
        <SidebarMenuItem key={id} className="w-full list-none">
          {railRow}
        </SidebarMenuItem>
      );
    }

    return (
      <div key={id} className="w-full">
        {railRow}
      </div>
    );
  });

  return (
    <main className="relative z-[120] h-screen w-full overflow-hidden bg-[#131111]">
      <div className="absolute left-0 right-0 top-0 h-px bg-white/14" />
      <div
        className="pointer-events-none fixed z-[215] flex items-center"
        style={{
          top: `${SEARCH_TOP}px`,
          left: `${SEARCH_FIXED_LEFT}px`,
          right: `${SEARCH_RIGHT_GAP}px`,
          transition: "none",
        }}
      >
        <div
          className="pointer-events-auto w-full"
          style={{ ...commandSearchVars, maxWidth: "240px" } as CSSProperties}
        >
          <GlobalCommandSearch
            variant="polymarket"
            triggerStyle="liquid-glass"
            triggerPlaceholder="Search..."
            rightHint="Ctrl K"
            className="w-[240px] max-w-[240px] [&>button]:[corner-shape:squircle] [&_[cmdk-root]]:[corner-shape:squircle] [&_[cmdk-item]]:[corner-shape:squircle]"
          />
        </div>
      </div>

      <motion.aside
        ref={asideRef}
        initial={false}
        animate={{ width: isMiniSidebarOpen ? MINI_SIDEBAR_WIDTH : RAIL_WIDTH }}
        transition={WIDTH_SPRING}
        onAnimationComplete={() => {
          if (!isMiniSidebarOpen) {
            setRailClosing(false);
          }
        }}
        className="fixed left-0 top-0 z-[220] h-full overflow-visible [will-change:width]"
      >
        <AnimatePresence initial={false}>
          {isMiniSidebarOpen ? (
            <motion.div
              key="dev-home-shell"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-none absolute bottom-3 left-3 right-3 top-3 overflow-hidden rounded-[22px] [corner-shape:squircle] border-t border-white/14 bg-[#0D0D0D] backdrop-blur-[10px] backdrop-saturate-[120%]"
            />
          ) : null}
        </AnimatePresence>

        <div
          className="absolute inset-y-0 left-0 z-20 flex flex-col overflow-visible"
          style={{ width: `${isMiniSidebarOpen ? MINI_SIDEBAR_WIDTH : RAIL_WIDTH}px` }}
        >
          <Link
            href="/"
            aria-label="Logo"
            className={`absolute z-30 flex h-10 items-center overflow-visible rounded-xl text-white/95 transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] [transform-origin:left_center] ${
              isMiniSidebarOpen ? "" : "hover:scale-105"
            }`}
            style={{ left: BUTTON_LEFT, top: LOGO_TOP }}
          >
            <span
              className="flex h-full items-center justify-center"
              style={{ width: `${LOGO_SLOT_WIDTH}px` }}
            >
              <Image
                src="/images/svg/openlymarket-logo-homepage.svg"
                alt="OpenlyMarket logo icon"
                width={30}
                height={35}
                priority
                className="block h-6 w-auto shrink-0"
              />
            </span>
            <motion.span
              initial={false}
              animate={{
                width: isMiniSidebarOpen ? WORDMARK_REVEAL_WIDTH : 0,
                opacity: isMiniSidebarOpen ? 1 : 0,
                marginLeft: WORDMARK_OFFSET_FROM_LOGO,
              }}
              transition={LOGO_REVEAL_TRANSITION}
              className="flex h-full items-center overflow-hidden leading-none"
            >
              <Image
                src="/images/svg/Wordmark%20(White).svg"
                alt="OpenlyMarket wordmark"
                width={152}
                height={32}
                priority
                className="block h-6 w-auto max-w-none shrink-0"
              />
            </motion.span>
          </Link>

          {isMiniSidebarOpen ? (
            <SidebarProvider
              defaultOpen
              className="h-full min-h-0 w-full bg-transparent"
              style={{ "--sidebar-width": `${MINI_SIDEBAR_WIDTH}px` } as CSSProperties}
            >
              <Sidebar collapsible="none" className="h-full w-full bg-transparent text-white">
                <SidebarContent className="overflow-visible bg-transparent p-0">
                  <SidebarGroup className="w-full p-0">
                    <SidebarGroupContent className="overflow-visible">
                      <SidebarMenu
                        className="w-full overflow-visible"
                        style={{
                          marginTop: `${NAV_TOP}px`,
                          paddingRight: "0px",
                          paddingBottom: "14px",
                        }}
                      >
                        {railMenuItems}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </SidebarContent>
              </Sidebar>
            </SidebarProvider>
          ) : (
            <nav
              className="flex w-full flex-col overflow-visible"
              style={{
                marginTop: `${NAV_TOP}px`,
                paddingRight: "0px",
                paddingBottom: "0px",
              }}
            >
              {railMenuItems}
            </nav>
          )}
        </div>

        <AnimatePresence initial={false}>
          {isMiniSidebarOpen ? (
            <motion.div
              key="dev-home-header"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={CONTENT_TRANSITION_IN}
              className="pointer-events-none absolute z-40 flex items-center justify-end"
              style={{ left: 98, right: 24, top: CLOSE_SIDEBAR_ICON_TOP }}
            >
              <div className="group relative pointer-events-auto">
                <motion.button
                  type="button"
                  aria-label="Collapse mini sidebar"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    closeMiniSidebar();
                  }}
                  className="grid h-8 w-8 place-items-center rounded-xl text-white/70 transition-colors duration-150 hover:bg-white/10 hover:text-white"
                  whileHover={{ scale: 1.06, rotate: -3, y: -1 }}
                  whileTap={{ scale: 0.95, rotate: 0, y: 0 }}
                  transition={RAIL_ICON_MOTION_TRANSITION}
                >
                  <motion.svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                    initial={false}
                    animate={{ rotate: isMiniSidebarOpen ? 0 : 90 }}
                    transition={RAIL_ICON_MOTION_TRANSITION}
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M9.67272 0.522827C10.8339 0.522827 11.76 0.522701 12.4963 0.60248C13.2453 0.683644 13.8789 0.854235 14.4264 1.25196C14.7504 1.48738 15.0355 1.77246 15.2709 2.09648C15.6686 2.64392 15.8392 3.27756 15.9204 4.02653C16.0002 4.76289 16 5.68894 16 6.85013V9.14985C16 10.311 16.0002 11.2371 15.9204 11.9734C15.8392 12.7224 15.6686 13.3561 15.2709 13.9035C15.0355 14.2275 14.7504 14.5126 14.4264 14.748C13.8789 15.1457 13.2453 15.3163 12.4963 15.3975C11.76 15.4773 10.8339 15.4772 9.67272 15.4772H6.3273C5.16611 15.4772 4.24006 15.4773 3.50371 15.3975C2.75474 15.3163 2.1211 15.1457 1.57366 14.748C1.24963 14.5126 0.964549 14.2275 0.729131 13.9035C0.331407 13.3561 0.160817 12.7224 0.0796529 11.9734C-0.000126137 11.2371 1.25338e-09 10.311 1.25338e-09 9.14985V6.85013C1.25329e-09 5.68894 -0.000126137 4.76289 0.0796529 4.02653C0.160817 3.27756 0.331407 2.64392 0.729131 2.09648C0.964549 1.77246 1.24963 1.48738 1.57366 1.25196C2.1211 0.854235 2.75474 0.683644 3.50371 0.60248C4.24006 0.522701 5.16611 0.522827 6.3273 0.522827H9.67272ZM5.54303 1.88714V14.1118C5.78636 14.1128 6.04709 14.1169 6.3273 14.1169H9.67272C10.8639 14.1169 11.7032 14.1164 12.3493 14.0465C12.9824 13.9779 13.3497 13.8494 13.6268 13.6482C13.8354 13.4966 14.0195 13.3125 14.1711 13.1039C14.3723 12.8268 14.5007 12.4595 14.5693 11.8264C14.6393 11.1803 14.6398 10.341 14.6398 9.14985V6.85013C14.6398 5.65895 14.6393 4.81965 14.5693 4.17359C14.5007 3.54047 14.3723 3.17317 14.1711 2.89608C14.0195 2.68746 13.8354 2.50335 13.6268 2.35178C13.3497 2.15059 12.9824 2.02211 12.3493 1.95352C11.7032 1.88356 10.8639 1.88305 9.67272 1.88305H6.3273C6.04709 1.88305 5.78636 1.88618 5.54303 1.88714ZM4.1828 1.91165C3.99125 1.92158 3.8148 1.93575 3.65076 1.95352C3.01764 2.02211 2.65034 2.15059 2.37325 2.35178C2.16463 2.50335 1.98052 2.68746 1.82895 2.89608C1.62776 3.17317 1.49928 3.54047 1.43069 4.17359C1.36074 4.81965 1.36023 5.65895 1.36023 6.85013V9.14985C1.36023 10.341 1.36074 11.1803 1.43069 11.8264C1.49928 12.4595 1.62776 12.8268 1.82895 13.1039C1.98052 13.3125 2.16463 13.4966 2.37325 13.6482C2.65034 13.8494 3.01764 13.9779 3.65076 14.0465C3.81478 14.0642 3.99127 14.0774 4.1828 14.0873V1.91165Z"
                      fill="currentColor"
                    />
                  </motion.svg>
                </motion.button>
                <span className={CLOSE_SIDEBAR_TOOLTIP_CLASSNAME} role="tooltip">
                  <span className="inline-flex items-center gap-2">
                    <span>{DEV_HOME_SIDEBAR_TOGGLE_TOOLTIP_TEXT}</span>
                    <span className="inline-flex h-[22px] items-center justify-center rounded-full border border-white/25 bg-[linear-gradient(170deg,rgba(255,255,255,0.16),rgba(255,255,255,0.08))] px-2 text-[11px] font-semibold leading-none text-[#f8fbff] shadow-[inset_0_1px_0_rgba(255,255,255,0.24),0_4px_10px_rgba(0,0,0,0.24)]">
                      {DEV_HOME_SIDEBAR_TOGGLE_LABEL}
                    </span>
                  </span>
                </span>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.aside>
    </main>
  );
}
