"use client";

import { type CSSProperties, type MouseEvent as ReactMouseEvent, useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
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
import { SIDEBAR_TOOLTIPS } from "./sidebar-tooltips";
import { useUser } from "@/contexts/UserContext";
import { createClient } from "@/lib/infra/supabase/supabase";
import { cn } from "@/lib/core/utils/utils";

const RAIL_WIDTH = 92;
const OPEN_LEFT_WIDTH = 336;
const OPEN_RIGHT_WIDTH = 366;
const SITE_LOGO_SRC = "/images/ico/faviconbianco.ico";
const LOGO_SVG_VIEWBOX = "90 450 220 230";
const LOGO_SVG_PATH_D =
  "M292.23,507.82c-3.6-11.05-8.54-20.23-14.84-27.56c-6.33-7.31-13.64-12.75-21.96-16.35  c-8.34-3.6-17.52-5.38-27.56-5.38c-9.76,0-18.89,1.79-27.34,5.38c-8.48,3.6-15.96,9.04-22.4,16.35  c-6.47,7.34-11.49,16.52-15.06,27.56c-1.76,5.35-3.06,11.17-3.95,17.44c-0.56,3.91-3.08,7.21-6.64,8.91  c-23.66,11.23-40.01,35.36-40.01,63.29c0,36.45,31.35,68.85,67.78,69.99c13.53,0.42,26.27-2.99,37.14-9.25  c9.06-5.22,16.85-12.42,22.77-21.01c1.5-2.17,3.74-3.74,6.3-4.41c3.1-0.81,6.1-1.84,8.99-3.09c8.31-3.57,15.62-9.04,21.96-16.35  c6.3-7.31,11.24-16.52,14.84-27.56c3.6-11.05,5.38-24.05,5.38-38.97C297.61,531.87,295.83,518.89,292.23,507.82z M252.5,597.45  c-1.79,23.71-11.05,34.98-23.15,37.58c-6.64,1.48-14.17,0.31-21.79-2.85c-15.51-6.36-31.44-20.87-41.43-38.19  c-8.54-14.87-12.72-31.8-8.45-47.45c4.16-10.32,10.71-16.29,18.52-18.8c10.91-3.57,24.19-0.47,36.63,6.58  c0.11,0.03,0.25,0.11,0.36,0.2c7,3.4,13.36,7.98,18.8,13.42c4.71,4.71,8.76,10.1,11.97,15.99c0.06,0.06,0.08,0.11,0.08,0.17  C250.77,574.83,254.32,586.55,252.5,597.45z";
const LOGO_CONTEXT_MENU_MEDIA_KIT_URL = "/about";

function CollapsedSidebarLogoIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={LOGO_SVG_VIEWBOX}
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d={LOGO_SVG_PATH_D} />
    </svg>
  );
}

function SidebarProfileFallbackIcon({ className }: { className?: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M15 8.5C15 10.433 13.433 12 11.5 12C9.567 12 8 10.433 8 8.5C8 6.567 9.567 5 11.5 5C13.433 5 15 6.567 15 8.5Z"
        fill="currentColor"
      />
      <path
        d="M17.6305 20H5.94623C5.54449 20 5.31716 19.559 5.56788 19.2451C6.68379 17.8479 9.29072 15 12 15C14.7275 15 17.0627 17.8864 18.0272 19.2731C18.2474 19.5897 18.0161 20 17.6305 20Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SidebarProfileTriggerIcon({
  isLoggedIn,
  avatarUrl,
}: {
  isLoggedIn: boolean;
  avatarUrl: string | null;
}) {
  if (isLoggedIn && avatarUrl) {
    return (
      <span className="h-9 w-9 overflow-hidden rounded-xl">
        <img
          src={avatarUrl}
          alt="Profile"
          className="h-full w-full rounded-xl object-cover"
          referrerPolicy="no-referrer"
        />
      </span>
    );
  }

  return <SidebarProfileFallbackIcon className="h-[18px] w-[18px] text-white" />;
}

function SidebarWordmarkIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="318 412 650 260"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <g>
        <path d="M322.66,475.1h35.71c2.2,0,3.99,1.79,3.99,3.99v4.07c0,2.12,2.62,3.21,4.05,1.64c4.18-4.56,8.76-8,13.75-10.34   c6.65-3.11,13.84-4.67,21.59-4.67c8.42,0,16.33,1.73,23.74,5.18c7.41,3.45,13.84,8.33,19.32,14.65c5.47,6.31,9.8,13.89,13,22.73   c3.19,8.84,4.8,18.65,4.8,29.42c0,10.78-1.6,20.58-4.8,29.42c-3.2,8.84-7.54,16.41-13,22.72c-5.47,6.31-11.91,11.2-19.32,14.65   c-7.41,3.45-15.32,5.17-23.74,5.17c-7.74,0-14.94-1.56-21.59-4.67c-4.99-2.33-9.57-5.78-13.75-10.34   c-1.43-1.56-4.05-0.48-4.05,1.64v63.67c0,2.2-1.79,3.99-3.99,3.99h-35.71c-2.2,0-3.99-1.79-3.99-3.99V479.09   C318.68,476.89,320.46,475.1,322.66,475.1z M364.38,555.28c1.35,3.96,3.28,7.32,5.81,10.1c2.52,2.78,5.6,4.92,9.22,6.44   c3.62,1.51,7.53,2.27,11.74,2.27c4.38,0,8.29-0.76,11.74-2.27c3.45-1.51,6.44-3.66,8.97-6.44c2.52-2.78,4.46-6.14,5.81-10.1   c1.35-3.95,2.02-8.46,2.02-13.51c0-5.05-0.67-9.55-2.02-13.51c-1.35-3.95-3.28-7.32-5.81-10.1c-2.53-2.78-5.52-4.92-8.97-6.44   c-3.45-1.51-7.37-2.27-11.74-2.27c-4.21,0-8.12,0.76-11.74,2.27c-3.62,1.52-6.69,3.66-9.22,6.44s-4.46,6.15-5.81,10.1   c-1.35,3.96-2.02,8.46-2.02,13.51C362.36,546.82,363.03,551.32,364.38,555.28z" />
        <path d="M558.57,570.05c3.33-2.22,5.74-5.12,7.24-8.71c0.62-1.47,2.09-2.4,3.68-2.4H606c2.66,0,4.62,2.53,3.94,5.1   c-1.62,6.11-4.01,11.77-7.18,16.99c-4.04,6.65-9.01,12.46-14.9,17.42c-5.89,4.97-12.59,8.75-20.07,11.36   c-7.49,2.61-15.53,3.91-24.12,3.91c-10.27,0-19.61-1.73-28.03-5.17c-8.42-3.45-15.57-8.34-21.47-14.65   c-5.89-6.31-10.48-13.89-13.76-22.72c-3.28-8.84-4.92-18.64-4.92-29.42c0-10.77,1.64-20.58,4.92-29.42   c3.28-8.84,7.87-16.41,13.76-22.73c5.89-6.31,13.04-11.19,21.47-14.65c8.42-3.45,17.76-5.18,28.03-5.18   c10.27,0,19.53,1.48,27.78,4.42c8.25,2.95,15.36,7.49,21.34,13.64c5.97,6.15,10.61,13.97,13.89,23.48   c2.96,8.56,4.58,18.46,4.88,29.68c0.05,2.07-1.65,3.78-3.72,3.78h-78.69c-5.68,0-9.82,5.39-8.35,10.88l0.03,0.1   c0.92,3.45,2.35,6.53,4.29,9.22c1.93,2.69,4.42,4.88,7.45,6.57c3.03,1.68,6.65,2.52,10.86,2.52   C549.48,574.09,554.53,572.74,558.57,570.05z M562.96,525.1c1.68,0,2.88-1.64,2.38-3.24c-1.26-4.04-3.39-7.64-6.4-10.78   c-3.79-3.95-9.14-5.93-16.04-5.93c-6.06,0-11.03,1.77-14.9,5.3c-3.14,2.87-5.57,6.63-7.27,11.27c-0.6,1.63,0.59,3.38,2.33,3.38   H562.96z" />
        <path d="M630.24,475.1h34.68c2.49,0,4.51,2.02,4.51,4.51v4.84c0,4.06,4.9,5.92,7.73,3c0.03-0.03,0.07-0.07,0.1-0.1   c3.36-3.45,7.2-6.48,11.49-9.09c4.29-2.61,8.92-4.67,13.89-6.19c4.96-1.52,9.98-2.27,15.02-2.27c5.05,0,10.52,0.72,16.41,2.15   c5.89,1.43,11.32,4.04,16.29,7.83c4.96,3.79,9.09,8.76,12.37,14.9c3.28,6.15,4.92,13.93,4.92,23.36v87.41   c0,2.49-2.02,4.51-4.51,4.51h-34.68c-2.49,0-4.51-2.02-4.51-4.51v-72.01c0-5.56-0.8-10.14-2.4-13.76c-1.6-3.62-3.62-6.48-6.06-8.59   c-2.44-2.1-5.18-3.58-8.21-4.42c-3.03-0.84-5.89-1.26-8.59-1.26c-3.53,0-7.07,0.63-10.6,1.89c-3.54,1.26-6.69,3.07-9.47,5.43   c-2.78,2.36-5.01,5.39-6.69,9.09c-1.68,3.71-2.52,8-2.52,12.88v70.75c0,2.49-2.02,4.51-4.51,4.51h-34.68   c-2.49,0-4.51-2.02-4.51-4.51V479.61C625.73,477.12,627.75,475.1,630.24,475.1z" />
        <path d="M783.05,605.44V416.48c0-2.49,2.02-4.51,4.51-4.51h34.68c2.49,0,4.51,2.02,4.51,4.51v188.96   c0,2.49-2.02,4.51-4.51,4.51h-34.68C785.07,609.95,783.05,607.93,783.05,605.44z" />
        <path d="M844.41,630.91c4.2,0,8.33-0.25,12.37-0.76c4.04-0.5,7.74-1.39,11.11-2.65c3.36-1.27,6.35-3.16,8.96-5.68   c0.04-0.04,0.08-0.08,0.13-0.12c4.47-4.42,5.75-11.16,3.78-17.13l-40.72-123.54c-0.96-2.91,1.21-5.92,4.28-5.92h34.2   c1.94,0,3.67,1.25,4.28,3.1l17.05,51.73c1.37,4.16,7.28,4.11,8.58-0.07l16.05-51.58c0.59-1.88,2.33-3.17,4.3-3.17h34.24   c3.04,0,5.2,2.94,4.3,5.84l-42.37,136.07c-2.36,7.41-4.72,14.22-7.07,20.45c-2.36,6.23-5.39,11.62-9.09,16.16   c-3.71,4.54-8.42,8.08-14.14,10.6c-5.73,2.53-13.13,3.79-22.22,3.79h-34.38c-2.49,0-4.51-2.02-4.51-4.51v-28.11   c0-2.49,2.02-4.51,4.51-4.51H844.41z" />
      </g>
    </svg>
  );
}

export type SidebarTestTheme = {
  shellBackground: string;
  shellBorderColor: string;
  shellBorderWidth: string;
  shellRadius: string;
  shellRadiusBottom: string;
  shellShadow: string;
  focusRingColor: string;
  hoverBackground: string;
  hoverTextColor: string;
  iconMutedColor: string;
  primaryTextColor: string;
  secondaryTextColor: string;
  tertiaryTextColor: string;
  dividerColor: string;
  leftPanelDividerColor: string;
  secondaryButtonBackground: string;
  secondaryButtonTextColor: string;
  railTextColor: string;
  railActiveBackground: string;
  railHoverBackground: string;
  logoBorderColor: string;
  logoTextColor: string;
  profileTriggerBackground: string;
  profileTriggerActiveBackground: string;
  profileTriggerTextColor: string;
  profileTriggerDuplicateBackground: string;
  profileTriggerDuplicateTextColor: string;
  userMenuBackground: string;
  userMenuBorderColor: string;
  userMenuItemTextColor: string;
  userMenuItemHoverBackground: string;
  userMenuItemHoverTextColor: string;
  profileSheetBackground: string;
  profileSheetInnerBackground: string;
  profileBadgePrimaryBackground: string;
  profileBadgeSecondaryBackground: string;
  profileBadgeSecondaryTextColor: string;
  profileAvatarBackground: string;
  profileAvatarTextColor: string;
  profileNameColor: string;
  profileEmailColor: string;
  profileItemTextColor: string;
  profileItemIconColor: string;
  profileItemHoverBackground: string;
  profileCloseColor: string;
  profileCloseHoverBackground: string;
  profileCloseHoverColor: string;
  panelCtaBackground: string;
  panelCtaTextColor: string;
  toggleBackground: string;
  toggleHint: string;
};

export type SidebarProfileSheetLayout = {
  leftTop: string;
  leftBottom: string;
  leftLeft: string;
  leftRight: string;
  fullTop: string;
  fullBottom: string;
  fullLeft: string;
  fullRight: string;
  zIndex: number;
  duplicateToggleLeft: string;
  duplicateToggleBottom: string;
  duplicateToggleZIndex: number;
};

const DEFAULT_SIDEBAR_TEST_THEME: SidebarTestTheme = {
  shellBackground: "#25272c",
  shellBorderColor: "rgba(255,255,255,0.16)",
  shellBorderWidth: "1px",
  shellRadius: "28px",
  shellRadiusBottom: "28px",
  shellShadow: "0 20px 50px rgba(0,0,0,0.32)",
  focusRingColor: "rgba(255,255,255,0.35)",
  hoverBackground: "rgba(255,255,255,0.10)",
  hoverTextColor: "#ffffff",
  iconMutedColor: "#d4d8de",
  primaryTextColor: "rgba(255,255,255,0.95)",
  secondaryTextColor: "rgba(255,255,255,0.90)",
  tertiaryTextColor: "rgba(255,255,255,0.86)",
  dividerColor: "rgba(255,255,255,0.10)",
  leftPanelDividerColor: "rgba(255,255,255,0.14)",
  secondaryButtonBackground: "rgba(255,255,255,0.16)",
  secondaryButtonTextColor: "rgba(255,255,255,0.88)",
  railTextColor: "#d4d8de",
  railActiveBackground: "rgba(255,255,255,0.18)",
  railHoverBackground: "rgba(255,255,255,0.10)",
  logoBorderColor: "rgba(255,255,255,0.70)",
  logoTextColor: "rgba(255,255,255,0.95)",
  profileTriggerBackground: "#ffe9d6",
  profileTriggerActiveBackground: "#f3dcc7",
  profileTriggerTextColor: "#1f2329",
  profileTriggerDuplicateBackground: "#ffe9d6",
  profileTriggerDuplicateTextColor: "#1f2329",
  userMenuBackground: "#26282d",
  userMenuBorderColor: "rgba(255,255,255,0.12)",
  userMenuItemTextColor: "rgba(255,255,255,0.88)",
  userMenuItemHoverBackground: "rgba(255,255,255,0.09)",
  userMenuItemHoverTextColor: "#ffffff",
  profileSheetBackground: "#dc2626",
  profileSheetInnerBackground: "#dc2626",
  profileBadgePrimaryBackground: "#ff4d2e",
  profileBadgeSecondaryBackground: "rgba(255,255,255,0.14)",
  profileBadgeSecondaryTextColor: "rgba(255,255,255,0.95)",
  profileAvatarBackground: "#f4e8d2",
  profileAvatarTextColor: "#111111",
  profileNameColor: "rgba(255,255,255,0.95)",
  profileEmailColor: "rgba(255,255,255,0.58)",
  profileItemTextColor: "rgba(255,255,255,0.95)",
  profileItemIconColor: "rgba(255,255,255,0.88)",
  profileItemHoverBackground: "rgba(255,255,255,0.08)",
  profileCloseColor: "rgba(255,255,255,0.80)",
  profileCloseHoverBackground: "rgba(255,255,255,0.10)",
  profileCloseHoverColor: "#ffffff",
  panelCtaBackground: "rgba(255,255,255,0.16)",
  panelCtaTextColor: "rgba(255,255,255,0.90)",
  toggleBackground: "#1f2329",
  toggleHint: "#c1c8d4",
};

const DEFAULT_PROFILE_SHEET_LAYOUT: SidebarProfileSheetLayout = {
  leftTop: "150px",
  leftBottom: "86px",
  leftLeft: "0px",
  leftRight: "0px",
  fullTop: "8px",
  fullBottom: "86px",
  fullLeft: "8px",
  fullRight: "8px",
  zIndex: 220,
  duplicateToggleLeft: "24px",
  duplicateToggleBottom: "16px",
  duplicateToggleZIndex: 240,
};

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

type SidebarProfileSnapshot = {
  avatarUrl: string | null;
  fullName: string | null;
  username: string | null;
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
  theme,
}: {
  expanded: boolean;
  onToggle: () => void;
  theme: SidebarTestTheme;
}) {
  const sidebarTooltipRightClassName =
    "pointer-events-none absolute left-full top-[59px] z-[2147483647] ml-0 -translate-y-1/2 whitespace-nowrap rounded-md bg-[#11161a] px-2 py-1 text-[11px] font-medium text-white/95 opacity-0 shadow-[0_8px_20px_rgba(0,0,0,0.35)] transition-opacity duration-150 group-hover:opacity-100";
  const sidebarToggleTooltipClassName = sidebarTooltipRightClassName;

  return (
    <button
      type="button"
      aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
      aria-expanded={expanded}
      onClick={onToggle}
      className="group absolute left-full -ml-[4px] bottom-[46px] z-10 h-[142px] w-[42px]"
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
            "--wm-redesign-palette-background": theme.toggleBackground,
            "--wm-redesign-palette-hint": theme.toggleHint,
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
      <span className={sidebarToggleTooltipClassName}>
        {expanded ? SIDEBAR_TOOLTIPS.handle.expanded : SIDEBAR_TOOLTIPS.handle.collapsed}
      </span>
    </button>
  );
}

function UserMenu({
  open,
  theme,
}: {
  open: boolean;
  theme: SidebarTestTheme;
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
          style={{
            willChange: "transform, opacity",
            borderColor: theme.userMenuBorderColor,
            backgroundColor: theme.userMenuBackground,
          }}
          className="absolute bottom-[66px] left-[10px] z-40 w-[188px] rounded-2xl border p-2 shadow-[0_18px_34px_rgba(0,0,0,0.35)]"
        >
          {["Profile", "Account settings", "Log out"].map((entry) => (
            <button
              key={entry}
              type="button"
              role="menuitem"
              className="flex h-9 w-full items-center rounded-xl px-3 text-sm transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sidebar-focus-ring)]"
              style={
                {
                  color: theme.userMenuItemTextColor,
                  ["--sidebar-user-menu-hover-bg" as string]: theme.userMenuItemHoverBackground,
                  ["--sidebar-user-menu-hover-text" as string]: theme.userMenuItemHoverTextColor,
                } as CSSProperties
              }
              onMouseEnter={(event) => {
                event.currentTarget.style.backgroundColor = theme.userMenuItemHoverBackground;
                event.currentTarget.style.color = theme.userMenuItemHoverTextColor;
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.backgroundColor = "transparent";
                event.currentTarget.style.color = theme.userMenuItemTextColor;
              }}
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
  theme,
  layout,
  profileDisplayName,
  profileUsername,
  profileAvatarUrl,
}: {
  open: boolean;
  onClose: () => void;
  mode: "left" | "full";
  theme: SidebarTestTheme;
  layout: SidebarProfileSheetLayout;
  profileDisplayName: string;
  profileUsername: string;
  profileAvatarUrl: string | null;
}) {
  const profileInitials = profileDisplayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "U";

  const wrapperStyle =
    mode === "full"
      ? {
          top: layout.fullTop,
          bottom: layout.fullBottom,
          left: layout.fullLeft,
          right: layout.fullRight,
          zIndex: layout.zIndex,
        }
      : {
          top: layout.leftTop,
          bottom: layout.leftBottom,
          left: layout.leftLeft,
          right: layout.leftRight,
          zIndex: layout.zIndex,
        };

  return (
    <AnimatePresence initial={false}>
      {open ? (
        <motion.div
          key="sidebar-profile-sheet"
          initial={{ y: "100%" }}
          animate={{ y: "0%" }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.24, ease: MOTION.ease }}
          className="absolute overflow-y-auto rounded-3xl p-2.5"
          style={{
            ...wrapperStyle,
            opacity: 1,
            backgroundColor: theme.profileSheetBackground,
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
              backgroundColor: theme.profileSheetInnerBackground,
              backgroundImage: "none",
              mixBlendMode: "normal",
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-white/8">
                  <Image src={SITE_LOGO_SRC} alt="OpenlyMarket" width={16} height={16} className="h-4 w-4 object-contain" />
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close profile"
                className="grid h-8 w-8 place-items-center rounded-xl transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{ color: theme.profileCloseColor }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.backgroundColor = theme.profileCloseHoverBackground;
                  event.currentTarget.style.color = theme.profileCloseHoverColor;
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.backgroundColor = "transparent";
                  event.currentTarget.style.color = theme.profileCloseColor;
                }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 flex flex-col items-center text-center">
              {profileAvatarUrl ? (
                <span className="h-14 w-14 overflow-hidden rounded-2xl">
                  <img
                    src={profileAvatarUrl}
                    alt={profileDisplayName}
                    className="h-full w-full rounded-2xl object-cover"
                    referrerPolicy="no-referrer"
                  />
                </span>
              ) : (
                <div
                  className="grid h-14 w-14 place-items-center rounded-full text-lg font-semibold"
                  style={{ backgroundColor: theme.profileAvatarBackground, color: theme.profileAvatarTextColor }}
                >
                  {profileInitials}
                </div>
              )}
              <p className="mt-2 text-[20px] font-semibold leading-tight" style={{ color: theme.profileNameColor }}>
                {profileDisplayName}
              </p>
              <p className="mt-1 text-[12px]" style={{ color: theme.profileEmailColor }}>
                {profileUsername}
              </p>
            </div>

            <div className="space-y-1">
              <button
                type="button"
                className="flex h-10 w-full items-center gap-3 rounded-xl px-1.5 text-[15px] text-[var(--sidebar-profile-item-text)] transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[var(--sidebar-profile-item-hover-bg)]"
              >
                <Mail className="h-[18px] w-[18px] text-[var(--sidebar-profile-item-icon)]" />
                <span>Email</span>
              </button>
              <button
                type="button"
                className="flex h-10 w-full items-center gap-3 rounded-xl px-1.5 text-[15px] text-[var(--sidebar-profile-item-text)] transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[var(--sidebar-profile-item-hover-bg)]"
              >
                <HardDrive className="h-[18px] w-[18px] text-[var(--sidebar-profile-item-icon)]" />
                <span>Disk</span>
              </button>
            </div>

            <div className="my-2 h-px w-full bg-[var(--sidebar-divider)]" />

            <button
              type="button"
              className="flex h-10 w-full items-center gap-3 rounded-xl px-1.5 text-[15px] text-[var(--sidebar-profile-item-text)] transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[var(--sidebar-profile-item-hover-bg)]"
            >
              <Moon className="h-[18px] w-[18px] text-[var(--sidebar-profile-item-icon)]" />
              <span>Appearance</span>
            </button>

            <div className="my-2 h-px w-full bg-[var(--sidebar-divider)]" />

            <button
              type="button"
              className="flex h-10 w-full items-center gap-3 rounded-xl px-1.5 text-[15px] text-[var(--sidebar-profile-item-text)] transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[var(--sidebar-profile-item-hover-bg)]"
            >
              <ArrowLeftRight className="h-[18px] w-[18px] text-[var(--sidebar-profile-item-icon)]" />
              <span>Change account</span>
            </button>

            <div className="my-2 h-px w-full bg-[var(--sidebar-divider)]" />

            <div className="space-y-1">
              <button
                type="button"
                className="flex h-10 w-full items-center gap-3 rounded-xl px-1.5 text-[15px] text-[var(--sidebar-profile-item-text)] transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[var(--sidebar-profile-item-hover-bg)]"
              >
                <Settings className="h-[18px] w-[18px] text-[var(--sidebar-profile-item-icon)]" />
                <span>Settings</span>
              </button>
              <button
                type="button"
                className="flex h-10 w-full items-center gap-3 rounded-xl px-1.5 text-[15px] text-[var(--sidebar-profile-item-text)] transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[var(--sidebar-profile-item-hover-bg)]"
              >
                <CircleUserRound className="h-[18px] w-[18px] text-[var(--sidebar-profile-item-icon)]" />
                <span>Account management</span>
              </button>
              <button
                type="button"
                className="flex h-10 w-full items-center gap-3 rounded-xl px-1.5 text-[15px] text-[var(--sidebar-profile-item-text)] transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[var(--sidebar-profile-item-hover-bg)]"
              >
                <CircleHelp className="h-[18px] w-[18px] text-[var(--sidebar-profile-item-icon)]" />
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
  forceVisible?: boolean;
  theme?: Partial<SidebarTestTheme>;
  profileSheetLayout?: Partial<SidebarProfileSheetLayout>;
  onWidthChange?: (width: number) => void;
  suppressCompactAutoCollapse?: boolean;
  compactExpandedPersistenceKey?: string;
  className?: string;
};

export function SidebarTestClient({
  embedded = false,
  forceVisible = false,
  theme: themeOverrides,
  profileSheetLayout: profileSheetLayoutOverrides,
  onWidthChange,
  suppressCompactAutoCollapse = false,
  compactExpandedPersistenceKey,
  className,
}: SidebarTestClientProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, username: currentUsername } = useUser();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeItemId, setActiveItemId] = useState<ItemId>("display");
  const [openPanelItemId, setOpenPanelItemId] = useState<ItemId | null>(null);
  const [hoveredItemId, setHoveredItemId] = useState<ItemId | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);
  const [skipInitialRestoredAnimation, setSkipInitialRestoredAnimation] = useState(false);
  const [profileDataByUserId, setProfileDataByUserId] = useState<Record<string, SidebarProfileSnapshot>>({});
  const [logoContextMenu, setLogoContextMenu] = useState<{ open: boolean; x: number; y: number }>({
    open: false,
    x: 0,
    y: 0,
  });
  const shellRef = useRef<HTMLDivElement | null>(null);
  const logoContextMenuRef = useRef<HTMLDivElement | null>(null);
  const hasLoadedCompactPersistenceRef = useRef(false);
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
  const theme: SidebarTestTheme = {
    ...DEFAULT_SIDEBAR_TEST_THEME,
    ...(themeOverrides ?? {}),
  };
  const profileSheetLayout: SidebarProfileSheetLayout = {
    ...DEFAULT_PROFILE_SHEET_LAYOUT,
    ...(profileSheetLayoutOverrides ?? {}),
  };
  const activeSidebarWidth = isExpanded
    ? OPEN_LEFT_WIDTH + (openPanelItemId ? OPEN_RIGHT_WIDTH : 0)
    : RAIL_WIDTH;
  const isCompactExpanded = isExpanded && !openPanelItemId;
  const isUserLoggedIn = Boolean(user?.id);
  const profileTriggerTooltip = isUserLoggedIn
    ? SIDEBAR_TOOLTIPS.collapsed.profileLoggedIn
    : SIDEBAR_TOOLTIPS.collapsed.profileLoggedOut;
  const sidebarTooltipRightClassName =
    "pointer-events-none absolute left-full top-1/2 z-[2147483647] ml-1.5 -translate-y-1/2 whitespace-nowrap rounded-md bg-[#11161a] px-2 py-1 text-[11px] font-medium text-white/95 opacity-0 shadow-[0_8px_20px_rgba(0,0,0,0.35)] transition-opacity duration-150 group-hover:opacity-100";
  const sidebarTooltipTopClassName =
    "pointer-events-none absolute left-1/2 bottom-full z-[2147483647] mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#11161a] px-2 py-1 text-[11px] font-medium text-white/95 opacity-0 shadow-[0_8px_20px_rgba(0,0,0,0.35)] transition-opacity duration-150 group-hover:opacity-100";
  const userMetadata = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const userMetadataAvatarUrl =
    typeof userMetadata.avatar_url === "string" && userMetadata.avatar_url.trim().length > 0
      ? userMetadata.avatar_url.trim()
      : null;
  const userMetadataFullName =
    typeof userMetadata.full_name === "string" && userMetadata.full_name.trim().length > 0
      ? userMetadata.full_name.trim()
      : null;
  const profileDataFromDb = user?.id ? (profileDataByUserId[user.id] ?? null) : null;
  const profileTriggerAvatarUrl = profileDataFromDb?.avatarUrl ?? userMetadataAvatarUrl;
  const resolvedUsernameRaw = (profileDataFromDb?.username ?? currentUsername ?? "").trim().replace(/^@+/, "");
  const profileSheetDisplayName =
    (profileDataFromDb?.fullName || userMetadataFullName || resolvedUsernameRaw || "Guest").trim();
  const profileSheetUsername = resolvedUsernameRaw ? `@${resolvedUsernameRaw}` : "@guest";
  const sidebarCssVars = {
    "--sidebar-focus-ring": theme.focusRingColor,
    "--sidebar-hover-bg": theme.hoverBackground,
    "--sidebar-hover-text": theme.hoverTextColor,
    "--sidebar-icon-muted": theme.iconMutedColor,
    "--sidebar-primary-text": theme.primaryTextColor,
    "--sidebar-secondary-text": theme.secondaryTextColor,
    "--sidebar-tertiary-text": theme.tertiaryTextColor,
    "--sidebar-divider": theme.dividerColor,
    "--sidebar-left-divider": theme.leftPanelDividerColor,
    "--sidebar-secondary-btn-bg": theme.secondaryButtonBackground,
    "--sidebar-secondary-btn-text": theme.secondaryButtonTextColor,
    "--sidebar-profile-trigger-bg": theme.profileTriggerBackground,
    "--sidebar-profile-trigger-active-bg": theme.profileTriggerActiveBackground,
    "--sidebar-profile-trigger-text": theme.profileTriggerTextColor,
    "--sidebar-profile-trigger-dup-bg": theme.profileTriggerDuplicateBackground,
    "--sidebar-profile-trigger-dup-text": theme.profileTriggerDuplicateTextColor,
    "--sidebar-profile-item-text": theme.profileItemTextColor,
    "--sidebar-profile-item-icon": theme.profileItemIconColor,
    "--sidebar-profile-item-hover-bg": theme.profileItemHoverBackground,
    "--sidebar-panel-cta-bg": theme.panelCtaBackground,
    "--sidebar-panel-cta-text": theme.panelCtaTextColor,
    "--sidebar-rail-active-bg": theme.railActiveBackground,
    "--sidebar-rail-hover-bg": theme.railHoverBackground,
  } as CSSProperties;
  const goHome = () => router.push("/");

  const redirectGuestToAuth = useCallback(() => {
    if (isLoading) return;
    const nextPath = pathname || "/dev";
    router.push(`/auth?next=${encodeURIComponent(nextPath)}`);
  }, [isLoading, pathname, router]);

  useEffect(() => {
    if (!user?.id) return;

    let active = true;
    const supabase = createClient();

    const loadProfileAvatar = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url,full_name,username")
        .eq("id", user.id)
        .maybeSingle<{ avatar_url: string | null; full_name: string | null; username: string | null }>();

      if (!active) return;
      const profileAvatarUrl =
        typeof data?.avatar_url === "string" && data.avatar_url.trim().length > 0
          ? data.avatar_url.trim()
          : null;
      const profileFullName =
        typeof data?.full_name === "string" && data.full_name.trim().length > 0
          ? data.full_name.trim()
          : null;
      const profileUsername =
        typeof data?.username === "string" && data.username.trim().length > 0
          ? data.username.trim().replace(/^@+/, "")
          : null;

      const nextProfileData: SidebarProfileSnapshot = {
        avatarUrl: profileAvatarUrl,
        fullName: profileFullName,
        username: profileUsername,
      };

      setProfileDataByUserId((current) => {
        const previousProfileData = current[user.id];
        if (
          previousProfileData &&
          previousProfileData.avatarUrl === nextProfileData.avatarUrl &&
          previousProfileData.fullName === nextProfileData.fullName &&
          previousProfileData.username === nextProfileData.username
        ) {
          return current;
        }
        return { ...current, [user.id]: nextProfileData };
      });
    };

    void loadProfileAvatar();

    return () => {
      active = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!compactExpandedPersistenceKey) {
      hasLoadedCompactPersistenceRef.current = true;
      return;
    }
    let restoreTimeoutId: number | null = null;

    try {
      const shouldRestoreCompactExpanded =
        window.localStorage.getItem(compactExpandedPersistenceKey) === "1";
      if (shouldRestoreCompactExpanded) {
        restoreTimeoutId = window.setTimeout(() => {
          setSkipInitialRestoredAnimation(true);
          setIsExpanded(true);
          setOpenPanelItemId(null);
        }, 0);
      }
    } catch {}

    hasLoadedCompactPersistenceRef.current = true;

    return () => {
      if (restoreTimeoutId !== null) {
        window.clearTimeout(restoreTimeoutId);
      }
    };
  }, [compactExpandedPersistenceKey]);

  useEffect(() => {
    if (!compactExpandedPersistenceKey) return;
    if (!hasLoadedCompactPersistenceRef.current) return;

    const shouldPersistCompactExpanded = isExpanded && !openPanelItemId;

    try {
      window.localStorage.setItem(
        compactExpandedPersistenceKey,
        shouldPersistCompactExpanded ? "1" : "0"
      );
    } catch {}
  }, [compactExpandedPersistenceKey, isExpanded, openPanelItemId]);

  useEffect(() => {
    if (!skipInitialRestoredAnimation) return;
    if (!isExpanded || openPanelItemId) return;

    const timeoutId = window.setTimeout(() => {
      setSkipInitialRestoredAnimation(false);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isExpanded, openPanelItemId, skipInitialRestoredAnimation]);

  const closeLogoContextMenu = useCallback(() => {
    setLogoContextMenu((current) => (current.open ? { ...current, open: false } : current));
  }, []);

  const openLogoContextMenu = useCallback((event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const menuWidth = 184;
    const menuHeight = 94;
    const shellRect = shellRef.current?.getBoundingClientRect();
    const targetRect = event.currentTarget.getBoundingClientRect();
    const preferredLeft = shellRect ? targetRect.right - shellRect.left + 12 : targetRect.right + 12;
    const preferredTop = shellRect ? targetRect.top - shellRect.top : targetRect.top;
    const maxLeft = shellRect
      ? window.innerWidth - shellRect.left - menuWidth - 8
      : window.innerWidth - menuWidth - 8;
    const maxTop = shellRect
      ? window.innerHeight - shellRect.top - menuHeight - 8
      : window.innerHeight - menuHeight - 8;
    const nextLeft = Math.max(8, Math.min(maxLeft, preferredLeft));
    const nextTop = Math.max(8, Math.min(maxTop, preferredTop));

    setLogoContextMenu({
      open: true,
      x: nextLeft,
      y: nextTop,
    });
  }, []);

  const downloadLogoSvg = useCallback(() => {
    const svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${LOGO_SVG_VIEWBOX}" fill="#ffffff"><path d="${LOGO_SVG_PATH_D}"/></svg>`;
    const blob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = "openly-logo.svg";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
    closeLogoContextMenu();
  }, [closeLogoContextMenu]);

  const openMediaKit = useCallback(() => {
    window.open(LOGO_CONTEXT_MENU_MEDIA_KIT_URL, "_blank", "noopener,noreferrer");
    closeLogoContextMenu();
  }, [closeLogoContextMenu]);

  useEffect(() => {
    onWidthChange?.(activeSidebarWidth);
  }, [activeSidebarWidth, onWidthChange]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!shellRef.current) return;
      const target = event.target as HTMLElement;
      if (target.closest("[data-logo-context-menu='true']")) return;
      if (target.closest("[data-sidebar-keep-open='true']")) return;
      if (!shellRef.current.contains(target)) {
        if (suppressCompactAutoCollapse && isCompactExpanded) {
          return;
        }
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
  }, [isCompactExpanded, isExpanded, suppressCompactAutoCollapse]);

  useEffect(() => {
    if (!logoContextMenu.open) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (logoContextMenuRef.current?.contains(target)) return;
      closeLogoContextMenu();
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeLogoContextMenu();
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onEscape);

    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onEscape);
    };
  }, [closeLogoContextMenu, logoContextMenu.open]);

  useEffect(() => {
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (suppressCompactAutoCollapse && isCompactExpanded) {
          return;
        }
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
  }, [isCompactExpanded, isExpanded, suppressCompactAutoCollapse]);

  const sidebarWidthTransition = skipInitialRestoredAnimation
    ? ({ duration: 0 } as const)
    : WIDTH_SPRING;

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
        width: activeSidebarWidth,
      }}
      transition={sidebarWidthTransition}
      style={sidebarCssVars}
      className={cn(
        "relative h-full shrink-0 [will-change:width] [transform:translateZ(0)]",
        embedded && !forceVisible && "hidden md:block",
        className
      )}
    >
      {!isExpanded ? (
        <div
          className="absolute inset-0 overflow-visible border"
          style={{
            borderWidth: theme.shellBorderWidth,
            borderColor: theme.shellBorderColor,
            backgroundColor: theme.shellBackground,
            boxShadow: theme.shellShadow,
            borderTopLeftRadius: theme.shellRadius,
            borderTopRightRadius: theme.shellRadius,
            borderBottomLeftRadius: theme.shellRadiusBottom,
            borderBottomRightRadius: theme.shellRadiusBottom,
          }}
        >
          <div className="absolute left-0 top-0 z-20 flex h-full w-[92px] flex-col px-2 py-3">
            <button
              type="button"
              aria-label="Logo"
              onClick={goHome}
              onContextMenu={openLogoContextMenu}
              className="group mx-auto mt-1 grid h-11 w-11 place-items-center rounded-[14px] text-base font-semibold"
            >
              <CollapsedSidebarLogoIcon className="h-8 w-8 text-white" />
              <span className={sidebarTooltipRightClassName}>{SIDEBAR_TOOLTIPS.collapsed.logo}</span>
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
                      "group relative grid h-11 w-11 place-items-center rounded-2xl transition-[background-color,color,transform,box-shadow] duration-220 ease-[cubic-bezier(0.22,1,0.36,1)]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sidebar-focus-ring)] focus-visible:ring-offset-0",
                      hoveredItemId === item.id && !isActive && "text-[var(--sidebar-hover-text)]",
                      isActive &&
                        "text-[var(--sidebar-hover-text)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                    )}
                    style={{
                      color: theme.railTextColor,
                      backgroundColor: isActive
                        ? theme.railActiveBackground
                        : hoveredItemId === item.id
                          ? theme.railHoverBackground
                          : "transparent",
                    }}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                    <span className={sidebarTooltipRightClassName}>
                      {SIDEBAR_TOOLTIPS.collapsed.items[item.id as keyof typeof SIDEBAR_TOOLTIPS.collapsed.items] ??
                        item.label}
                    </span>
                  </motion.button>
                );
              })}
            </nav>

            <div className="relative z-[2147483647] mt-auto flex flex-col items-center gap-1.5 pb-1">
              <div className="group relative z-[2147483647]">
                <motion.button
                  type="button"
                  aria-label="Open profile panel"
                  aria-expanded={isProfileSheetOpen}
                  data-profile-toggle="true"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (!isUserLoggedIn) {
                      redirectGuestToAuth();
                      return;
                    }
                    setIsExpanded(true);
                    setOpenPanelItemId(null);
                    setIsProfileSheetOpen(true);
                    setUserMenuOpen(false);
                  }}
                  className="grid h-9 w-9 place-items-center rounded-xl bg-transparent text-base leading-none text-[var(--sidebar-profile-trigger-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sidebar-focus-ring)]"
                >
                  <SidebarProfileTriggerIcon
                    isLoggedIn={isUserLoggedIn}
                    avatarUrl={profileTriggerAvatarUrl}
                  />
                </motion.button>
                <span className={sidebarTooltipRightClassName}>{profileTriggerTooltip}</span>
              </div>
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                aria-label="Notifications"
                className="group relative z-[2147483647] grid h-10 w-10 place-items-center rounded-2xl text-[var(--sidebar-icon-muted)] transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--sidebar-hover-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sidebar-focus-ring)]"
              >
                <Bell className="h-[18px] w-[18px]" />
                <span className={sidebarTooltipRightClassName}>{SIDEBAR_TOOLTIPS.collapsed.notifications}</span>
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                aria-label="Help"
                className="group relative z-[2147483647] grid h-10 w-10 place-items-center rounded-2xl text-[var(--sidebar-icon-muted)] transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--sidebar-hover-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sidebar-focus-ring)]"
              >
                <CircleHelp className="h-[18px] w-[18px]" />
                <span className={sidebarTooltipRightClassName}>{SIDEBAR_TOOLTIPS.collapsed.help}</span>
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                aria-label="Settings"
                className="group relative z-[2147483647] grid h-10 w-10 place-items-center rounded-2xl text-[var(--sidebar-icon-muted)] transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--sidebar-hover-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sidebar-focus-ring)]"
              >
                <Settings className="h-[18px] w-[18px]" />
                <span className={sidebarTooltipRightClassName}>{SIDEBAR_TOOLTIPS.collapsed.settings}</span>
              </motion.button>
            </div>

            <UserMenu open={userMenuOpen} theme={theme} />
          </div>
        </div>
      ) : (
        <div
          className="absolute inset-0 overflow-visible border"
          style={{
            borderWidth: theme.shellBorderWidth,
            borderColor: theme.shellBorderColor,
            backgroundColor: theme.shellBackground,
            boxShadow: theme.shellShadow,
            borderTopLeftRadius: theme.shellRadius,
            borderTopRightRadius: theme.shellRadius,
            borderBottomLeftRadius: theme.shellRadiusBottom,
            borderBottomRightRadius: theme.shellRadiusBottom,
          }}
        >
          <div
            className={cn("grid h-full p-4", openPanelItemId ? "gap-0" : "grid-cols-1")}
            style={
              openPanelItemId
                ? { gridTemplateColumns: `${OPEN_LEFT_WIDTH - 32}px minmax(0,1fr)` }
                : undefined
            }
          >
            <motion.div
              initial={skipInitialRestoredAnimation ? false : { opacity: 0, x: 8 }}
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
                openPanelItemId
                  ? isProfileSheetOpen
                    ? "pr-4"
                    : "border-r border-[var(--sidebar-left-divider)] pr-4"
                  : "pr-1"
              )}
            >
              <div className="flex items-center gap-2 px-1">
                <button
                  type="button"
                  aria-label="Go to homepage"
                  onClick={goHome}
                  onContextMenu={openLogoContextMenu}
                  className="grid h-10 w-10 place-items-center rounded-full text-xl font-semibold"
                >
                  <CollapsedSidebarLogoIcon className="h-8 w-8 text-white" />
                </button>
                <SidebarWordmarkIcon className="h-8 w-auto text-white" />
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  className="flex h-10 flex-1 items-center justify-between rounded-full bg-[var(--sidebar-secondary-btn-bg)] px-4 text-[15px] font-medium text-[var(--sidebar-secondary-text)]"
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
                  className="grid h-10 w-10 place-items-center rounded-full bg-[var(--sidebar-secondary-btn-bg)] text-[var(--sidebar-secondary-btn-text)]"
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
                        "flex h-10 w-full items-center gap-3 rounded-full px-3 text-[15px] leading-none text-[var(--sidebar-secondary-btn-text)] transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
                        isCurrent
                          ? "bg-[var(--sidebar-rail-active-bg)] text-[var(--sidebar-hover-text)]"
                          : "hover:bg-[var(--sidebar-rail-hover-bg)] hover:text-[var(--sidebar-hover-text)]"
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
                <div className="group relative">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    aria-label="Profile"
                    data-profile-toggle="true"
                    onClick={() => {
                      if (!isUserLoggedIn) {
                        redirectGuestToAuth();
                        return;
                      }
                      setIsProfileSheetOpen((prev) => !prev);
                    }}
                    className="grid h-9 w-9 place-items-center rounded-xl bg-transparent text-[var(--sidebar-profile-trigger-text)] transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  >
                    <SidebarProfileTriggerIcon
                      isLoggedIn={isUserLoggedIn}
                      avatarUrl={profileTriggerAvatarUrl}
                    />
                  </motion.button>
                  <span className={sidebarTooltipTopClassName}>{profileTriggerTooltip}</span>
                </div>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  aria-label="Notifications"
                  className="group relative grid h-9 w-9 place-items-center rounded-xl text-[var(--sidebar-icon-muted)] transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--sidebar-hover-text)]"
                >
                  <Bell className="h-[18px] w-[18px]" />
                  <span className={sidebarTooltipTopClassName}>{SIDEBAR_TOOLTIPS.collapsed.notifications}</span>
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  aria-label="Help"
                  className="group relative grid h-9 w-9 place-items-center rounded-xl text-[var(--sidebar-icon-muted)] transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--sidebar-hover-text)]"
                >
                  <CircleHelp className="h-[18px] w-[18px]" />
                  <span className={sidebarTooltipTopClassName}>{SIDEBAR_TOOLTIPS.collapsed.help}</span>
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  aria-label="Settings"
                  className="group relative grid h-9 w-9 place-items-center rounded-xl text-[var(--sidebar-icon-muted)] transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--sidebar-hover-text)]"
                >
                  <Settings className="h-[18px] w-[18px]" />
                  <span className={sidebarTooltipTopClassName}>{SIDEBAR_TOOLTIPS.collapsed.settings}</span>
                </motion.button>
              </div>

              <ProfileSlideSheet
                open={isProfileSheetOpen && !openPanelItemId}
                mode="left"
                onClose={() => setIsProfileSheetOpen(false)}
                theme={theme}
                layout={profileSheetLayout}
                profileDisplayName={profileSheetDisplayName}
                profileUsername={profileSheetUsername}
                profileAvatarUrl={profileTriggerAvatarUrl}
              />
            </motion.div>

            {openPanelItemId ? (
              <motion.div
                key={`panel-${openPanelItemId}`}
                initial={skipInitialRestoredAnimation ? false : { opacity: 0, x: 8 }}
                animate={{
                  opacity: 1,
                  x: 0,
                  transition: { duration: MOTION.contentIn, ease: MOTION.ease, delay: 0.04 },
                }}
                style={{ willChange: "transform, opacity" }}
                className="min-w-0 pl-6 pt-5 pr-3"
              >
                <p className="text-[15px] font-semibold leading-tight text-[var(--sidebar-secondary-text)]">
                  {panelItem.panel.heading}
                </p>
                <div className="mt-4 space-y-3">
                  {panelItem.panel.lines.map((line) => (
                    <p
                      key={`${panelItem.id}-${line}`}
                      className="text-[15px] font-medium leading-tight text-[var(--sidebar-tertiary-text)]"
                    >
                      {line}
                    </p>
                  ))}
                </div>
                <button
                  type="button"
                  className="mt-4 flex h-10 w-full items-center rounded-full bg-[var(--sidebar-panel-cta-bg)] px-4 text-[15px] font-medium text-[var(--sidebar-panel-cta-text)]"
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
            theme={theme}
            layout={profileSheetLayout}
            profileDisplayName={profileSheetDisplayName}
            profileUsername={profileSheetUsername}
            profileAvatarUrl={profileTriggerAvatarUrl}
          />

          {isProfileSheetOpen ? (
            <div
              className="group absolute"
              style={{
                left: profileSheetLayout.duplicateToggleLeft,
                bottom: profileSheetLayout.duplicateToggleBottom,
                zIndex: profileSheetLayout.duplicateToggleZIndex,
              }}
            >
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                aria-label="Profile duplicate toggle"
                data-profile-toggle="true"
                onClick={() => {
                  if (!isUserLoggedIn) {
                    redirectGuestToAuth();
                    return;
                  }
                  setIsProfileSheetOpen((prev) => !prev);
                }}
                className="grid h-9 w-9 place-items-center rounded-xl bg-transparent text-[var(--sidebar-profile-trigger-dup-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sidebar-focus-ring)]"
              >
                <SidebarProfileTriggerIcon
                  isLoggedIn={isUserLoggedIn}
                  avatarUrl={profileTriggerAvatarUrl}
                />
              </motion.button>
              <span className={sidebarTooltipTopClassName}>{profileTriggerTooltip}</span>
            </div>
          ) : null}
        </div>
      )}

      <SidebarToggleHandle
        expanded={isExpanded}
        theme={theme}
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

      {logoContextMenu.open ? (
        <div
          ref={logoContextMenuRef}
          data-logo-context-menu="true"
          role="menu"
          aria-label="Logo actions"
          className="absolute z-[1200] min-w-[184px] overflow-hidden rounded-xl border border-white/12 bg-[#161b20] p-1.5 shadow-[0_16px_34px_rgba(0,0,0,0.45)]"
          style={{
            left: `${logoContextMenu.x}px`,
            top: `${logoContextMenu.y}px`,
          }}
        >
          <button
            type="button"
            role="menuitem"
            onClick={downloadLogoSvg}
            className="flex h-9 w-full items-center rounded-lg px-3 text-left text-[13px] font-medium text-white/90 transition-colors duration-150 hover:bg-white/10 hover:text-white"
          >
            Download logo
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={openMediaKit}
            className="flex h-9 w-full items-center rounded-lg px-3 text-left text-[13px] font-medium text-white/90 transition-colors duration-150 hover:bg-white/10 hover:text-white"
          >
            Media Kit
          </button>
        </div>
      ) : null}
    </motion.aside>
  );

  if (embedded) {
    return <div className="relative h-full min-h-0 min-w-0 overflow-visible">{sidebarNode}</div>;
  }

  return (
    <div
      className="h-screen w-full overflow-hidden text-[var(--sidebar-primary-text)]"
      style={{ backgroundColor: theme.shellBackground }}
    >
      <h1 className="sr-only">Sidebar test</h1>
      <main className="mx-auto flex h-full w-full max-w-[1600px] px-2 py-2 md:px-3 md:py-3">
        {sidebarNode}
        <section className="flex-1" />
      </main>
    </div>
  );
}

export default SidebarTestClient;

