"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  ChartNoAxesColumn,
  ChevronDown,
  ChevronRight,
  Compass,
  Feather,
  House,
  Mail,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type RailItemId = "home" | "discover" | "compose" | "stats" | "messages";

type RailItem = {
  id: RailItemId;
  icon: LucideIcon;
  label: string;
  shortcut?: string;
};

type AccordionEntry = {
  label: string;
  icon: LucideIcon;
};

const RAIL_ITEMS: RailItem[] = [
  {
    id: "home",
    icon: House,
    label: "Home",
    shortcut: "H",
  },
  {
    id: "discover",
    icon: Compass,
    label: "Discover",
    shortcut: "R",
  },
  {
    id: "compose",
    icon: Feather,
    label: "Compose",
    shortcut: "P",
  },
  {
    id: "stats",
    icon: ChartNoAxesColumn,
    label: "Stats",
    shortcut: "T",
  },
  {
    id: "messages",
    icon: Mail,
    label: "Messages",
    shortcut: "N",
  },
];

const ACCORDION_CONTENT: Record<RailItemId, AccordionEntry[]> = {
  home: [
    { label: "Dashboard", icon: House },
    { label: "Quick links", icon: Compass },
    { label: "Recent activity", icon: ChartNoAxesColumn },
  ],
  discover: [
    { label: "Trending pages", icon: Feather },
    { label: "Suggestions", icon: House },
    { label: "Collections", icon: Mail },
  ],
  compose: [
    { label: "New draft", icon: Feather },
    { label: "Templates", icon: House },
    { label: "Scheduled posts", icon: ChartNoAxesColumn },
  ],
  stats: [
    { label: "Traffic", icon: ChartNoAxesColumn },
    { label: "Conversions", icon: Compass },
    { label: "Performance", icon: House },
  ],
  messages: [
    { label: "Inbox", icon: Mail },
    { label: "Mentions", icon: Compass },
    { label: "Archived", icon: Feather },
  ],
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

const IOS_GLASS_HOVER_CLASSNAME =
  "transition-[background-color,color,box-shadow,backdrop-filter] duration-150 ease-out hover:bg-[rgba(57,61,69,0.76)] hover:text-white/95 hover:backdrop-blur-[12px] hover:backdrop-saturate-[125%] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_10px_24px_rgba(0,0,0,0.34)] focus-visible:bg-[rgba(57,61,69,0.76)] focus-visible:text-white/95 focus-visible:backdrop-blur-[12px] focus-visible:backdrop-saturate-[125%] focus-visible:shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_10px_24px_rgba(0,0,0,0.34)]";

const TOOLTIP_CLASSNAME =
  "pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-[14px] [corner-shape:squircle] border border-white/14 bg-[rgba(20,16,16,0.86)] px-3 py-1 text-[13px] font-medium leading-none tracking-[0.01em] text-[#f5f5f7] opacity-0 backdrop-blur-[10px] backdrop-saturate-[120%] shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_8px_18px_rgba(0,0,0,0.32)] transition-opacity duration-150 ease-out group-hover:opacity-100 group-focus-visible:opacity-100";

const ACTIVE_BUTTON_CLASSNAME =
  "group relative h-[46px] overflow-hidden [corner-shape:squircle] rounded-[14px] bg-[#3f67ff] text-white transition-[box-shadow,background-color,color] duration-150 ease-out shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_4px_10px_rgba(0,0,0,0.22),0_8px_14px_rgba(63,103,255,0.2)]";

const IDLE_CLOSED_CLASSNAME =
  `group relative h-[46px] overflow-hidden [corner-shape:squircle] rounded-[14px] text-[#73757f] ${IOS_GLASS_HOVER_CLASSNAME}`;

const IDLE_OPEN_CLASSNAME =
  `group relative h-[46px] overflow-hidden [corner-shape:squircle] rounded-[14px] bg-transparent text-white ${IOS_GLASS_HOVER_CLASSNAME}`;

export function DevHomeClient() {
  const [activeItemId, setActiveItemId] = useState<RailItemId>("compose");
  const [openAccordionId, setOpenAccordionId] = useState<RailItemId | null>("compose");
  const [isMiniSidebarOpen, setMiniSidebarOpen] = useState(false);
  const [isRailClosing, setRailClosing] = useState(false);
  const asideRef = useRef<HTMLElement | null>(null);

  const closeMiniSidebar = () => {
    if (!isMiniSidebarOpen) {
      return;
    }

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
        setRailClosing(true);
        setMiniSidebarOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isMiniSidebarOpen]);

  const handleItemClick = (id: RailItemId) => {
    setActiveItemId(id);

    if (isMiniSidebarOpen) {
      setOpenAccordionId((previous) => (previous === id ? null : id));
      return;
    }

    setRailClosing(false);
    setOpenAccordionId(id);
    setMiniSidebarOpen(true);
  };

  return (
    <main className="relative z-[120] h-dvh w-full overflow-hidden bg-[#131111]">
      <div className="absolute left-0 right-0 top-0 h-px bg-white/14" />

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
        className={`fixed left-0 top-0 z-[220] h-full [will-change:width] ${
          isMiniSidebarOpen ? "overflow-hidden" : "overflow-visible"
        }`}
      >
        <AnimatePresence initial={false}>
          {isMiniSidebarOpen ? (
            <motion.div
              key="dev-home-shell"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-none absolute bottom-3 left-3 right-3 top-3 overflow-hidden rounded-[22px] [corner-shape:squircle] border-t border-white/14 bg-[rgba(20,16,16,0.86)] backdrop-blur-[10px] backdrop-saturate-[120%]"
            />
          ) : null}
        </AnimatePresence>

        <div
          className="absolute inset-y-0 left-0 z-20 flex flex-col"
          style={{ width: `${isMiniSidebarOpen ? MINI_SIDEBAR_WIDTH : RAIL_WIDTH}px` }}
        >
          <Link
            href="/"
            aria-label="Logo"
            className="absolute z-30 flex h-8 items-center overflow-visible rounded-xl text-white/95 transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] [transform-origin:left_center] hover:scale-105"
            style={{ left: BUTTON_LEFT, top: 24 }}
          >
            <span
              className="flex h-8 items-center justify-center"
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
              className="flex h-8 items-center overflow-hidden leading-none"
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

          <nav
            className="flex w-full flex-col"
            style={{
              marginTop: `${NAV_TOP}px`,
              paddingRight: "0px",
              paddingBottom: isMiniSidebarOpen ? "14px" : "0px",
            }}
          >
            {RAIL_ITEMS.map(({ id, icon: Icon, label, shortcut }) => {
              const isActive = activeItemId === id;
              const isAccordionOpen = openAccordionId === id;
              const rowWidth = isMiniSidebarOpen ? OPEN_BUTTON_WIDTH : CLOSED_BUTTON_WIDTH;

              const rowClassName = isActive
                ? ACTIVE_BUTTON_CLASSNAME
                : isMiniSidebarOpen
                  ? IDLE_OPEN_CLASSNAME
                  : IDLE_CLOSED_CLASSNAME;

              return (
                <div key={id} className="w-full">
                  <div
                    className="flex w-full items-center"
                    style={{
                      height: `${RAIL_SLOT_HEIGHT}px`,
                      justifyContent: isMiniSidebarOpen ? "flex-start" : "center",
                      paddingLeft: isMiniSidebarOpen ? `${BUTTON_LEFT}px` : "0px",
                    }}
                  >
                    <button
                      type="button"
                      aria-label={label}
                      onClick={() => handleItemClick(id)}
                      className={`${rowClassName} ${isMiniSidebarOpen ? "" : "grid place-items-center"}`}
                      style={{
                        width: `${rowWidth}px`,
                        maxWidth: "100%",
                        overflow: isMiniSidebarOpen ? "hidden" : "visible",
                      }}
                    >
                      <Icon
                        className={
                          isMiniSidebarOpen
                            ? "pointer-events-none absolute left-4 top-1/2 h-[20px] w-[20px] -translate-y-1/2 shrink-0"
                            : "pointer-events-none h-[20px] w-[20px] shrink-0"
                        }
                        strokeWidth={2.15}
                      />

                      {isMiniSidebarOpen ? (
                        <span className="flex h-full w-full items-center justify-between pl-12 pr-4">
                          <span className="truncate text-[14px] font-semibold leading-[1.2] text-white">{label}</span>
                          <span className="text-white/90">
                            {isAccordionOpen ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </span>
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
                    </button>
                  </div>

                  <AnimatePresence initial={false}>
                    {isMiniSidebarOpen && isAccordionOpen ? (
                      <motion.div
                        key={`${id}-accordion`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div
                          className="relative mb-2"
                          style={{ paddingLeft: `${BUTTON_LEFT}px`, paddingRight: `${BUTTON_LEFT}px` }}
                        >
                          <div className="pointer-events-none absolute bottom-1 left-[14px] top-1 w-px bg-white/16" />

                          <div className="flex w-full flex-col gap-1">
                            {ACCORDION_CONTENT[id].map(({ label: entryLabel, icon: EntryIcon }) => (
                              <button
                                key={`${id}-${entryLabel}`}
                                type="button"
                                className="relative flex h-[46px] w-full items-center rounded-[14px] pl-12 pr-4 text-left text-[14px] font-semibold text-white/78 transition-colors duration-150 hover:bg-white/8 hover:text-white"
                              >
                                <EntryIcon
                                  className="pointer-events-none absolute left-[6px] top-1/2 h-[16px] w-[16px] -translate-y-1/2 text-[#b7d3e6]"
                                  strokeWidth={2.05}
                                />
                                <span className="truncate">{entryLabel}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>
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
              style={{ left: 98, right: 24, top: 24 }}
            >
              <button
                type="button"
                aria-label="Collapse mini sidebar"
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  closeMiniSidebar();
                }}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  closeMiniSidebar();
                }}
                className="pointer-events-auto grid h-8 w-8 place-items-center rounded-xl text-white/70 transition-colors duration-150 hover:bg-white/10 hover:text-white"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M9.67272 0.522827C10.8339 0.522827 11.76 0.522701 12.4963 0.60248C13.2453 0.683644 13.8789 0.854235 14.4264 1.25196C14.7504 1.48738 15.0355 1.77246 15.2709 2.09648C15.6686 2.64392 15.8392 3.27756 15.9204 4.02653C16.0002 4.76289 16 5.68894 16 6.85013V9.14985C16 10.311 16.0002 11.2371 15.9204 11.9734C15.8392 12.7224 15.6686 13.3561 15.2709 13.9035C15.0355 14.2275 14.7504 14.5126 14.4264 14.748C13.8789 15.1457 13.2453 15.3163 12.4963 15.3975C11.76 15.4773 10.8339 15.4772 9.67272 15.4772H6.3273C5.16611 15.4772 4.24006 15.4773 3.50371 15.3975C2.75474 15.3163 2.1211 15.1457 1.57366 14.748C1.24963 14.5126 0.964549 14.2275 0.729131 13.9035C0.331407 13.3561 0.160817 12.7224 0.0796529 11.9734C-0.000126137 11.2371 1.25338e-09 10.311 1.25338e-09 9.14985V6.85013C1.25329e-09 5.68894 -0.000126137 4.76289 0.0796529 4.02653C0.160817 3.27756 0.331407 2.64392 0.729131 2.09648C0.964549 1.77246 1.24963 1.48738 1.57366 1.25196C2.1211 0.854235 2.75474 0.683644 3.50371 0.60248C4.24006 0.522701 5.16611 0.522827 6.3273 0.522827H9.67272ZM5.54303 1.88714V14.1118C5.78636 14.1128 6.04709 14.1169 6.3273 14.1169H9.67272C10.8639 14.1169 11.7032 14.1164 12.3493 14.0465C12.9824 13.9779 13.3497 13.8494 13.6268 13.6482C13.8354 13.4966 14.0195 13.3125 14.1711 13.1039C14.3723 12.8268 14.5007 12.4595 14.5693 11.8264C14.6393 11.1803 14.6398 10.341 14.6398 9.14985V6.85013C14.6398 5.65895 14.6393 4.81965 14.5693 4.17359C14.5007 3.54047 14.3723 3.17317 14.1711 2.89608C14.0195 2.68746 13.8354 2.50335 13.6268 2.35178C13.3497 2.15059 12.9824 2.02211 12.3493 1.95352C11.7032 1.88356 10.8639 1.88305 9.67272 1.88305H6.3273C6.04709 1.88305 5.78636 1.88618 5.54303 1.88714ZM4.1828 1.91165C3.99125 1.92158 3.8148 1.93575 3.65076 1.95352C3.01764 2.02211 2.65034 2.15059 2.37325 2.35178C2.16463 2.50335 1.98052 2.68746 1.82895 2.89608C1.62776 3.17317 1.49928 3.54047 1.43069 4.17359C1.36074 4.81965 1.36023 5.65895 1.36023 6.85013V9.14985C1.36023 10.341 1.36074 11.1803 1.43069 11.8264C1.49928 12.4595 1.62776 12.8268 1.82895 13.1039C1.98052 13.3125 2.16463 13.4966 2.37325 13.6482C2.65034 13.8494 3.01764 13.9779 3.65076 14.0465C3.81478 14.0642 3.99127 14.0774 4.1828 14.0873V1.91165Z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.aside>
    </main>
  );
}
