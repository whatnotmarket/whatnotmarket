"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { SidebarMode } from "../types";
import { HomepageSidebarModeToggle } from "./HomepageSidebarModeToggle";
import { HomepageSidebarBuy } from "./HomepageSidebarBuy";
import { HomepageSidebarSell } from "./HomepageSidebarSell";
import type { GlobalChatRoom } from "@/lib/chat/global-chat-config";

export function HomepageDesktopSidebar<
  RoomT extends { slug: GlobalChatRoom; label: string },
  CategoryT extends { label: string; href: string },
>({
  isLeftSidebarClosed,
  onCollapse,
  sidebarMode,
  onSidebarModeChange,
  isMarketplaceSectionOpen,
  onToggleMarketplaceSection,
  isRoomsSectionOpen,
  onToggleRoomsSection,
  primaryRooms,
  marketplaceCategories,
  renderMarketplaceNavItem,
  renderRoomNavItem,
  renderSellSections,
  displayOnlineCount,
  threadCount,
  sidebarRowGridClass,
}: {
  isLeftSidebarClosed: boolean;
  onCollapse: () => void;
  sidebarMode: SidebarMode;
  onSidebarModeChange: (mode: SidebarMode) => void;
  isMarketplaceSectionOpen: boolean;
  onToggleMarketplaceSection: () => void;
  isRoomsSectionOpen: boolean;
  onToggleRoomsSection: () => void;
  primaryRooms: readonly RoomT[];
  marketplaceCategories: readonly CategoryT[];
  renderMarketplaceNavItem: (category: CategoryT, closeMobileOnClick?: boolean) => React.ReactNode;
  renderRoomNavItem: (room: RoomT) => React.ReactNode;
  renderSellSections: (closeMobileOnClick?: boolean) => React.ReactNode;
  displayOnlineCount: number;
  threadCount: number;
  sidebarRowGridClass: string;
}) {
  return (
    <motion.aside
      initial={false}
      animate={{
        width: isLeftSidebarClosed ? 0 : 264,
        opacity: isLeftSidebarClosed ? 0 : 1,
      }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="relative hidden shrink-0 overflow-hidden md:sticky md:top-6 md:block md:h-[calc(100vh-3rem)]"
      aria-hidden={isLeftSidebarClosed}
    >
      <motion.div
        initial={false}
        animate={{
          x: isLeftSidebarClosed ? -36 : 0,
          opacity: isLeftSidebarClosed ? 0 : 1,
        }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "flex h-full w-[264px] flex-col rounded-[30px] border border-[#2E3547] bg-[#161923] p-3 shadow-[0_22px_60px_rgba(0,0,0,0.55)]",
          isLeftSidebarClosed ? "pointer-events-none" : ""
        )}
      >
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={onCollapse}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#2E3547] bg-[#212533] text-white transition hover:bg-[#2E3547] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E3547]"
            aria-label="Collapse left sidebar"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 rotate-180 text-white"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M10 22.5H18.5C20.7091 22.5 22.5 20.7091 22.5 18.5V5.5C22.5 3.29086 20.7091 1.5 18.5 1.5H10V22.5Z"
                fill="currentColor"
              />
              <path
                d="M8 1.5H5.5C3.29086 1.5 1.5 3.29086 1.5 5.5V18.5C1.5 20.7091 3.29086 22.5 5.5 22.5H8V1.5Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
          <HomepageSidebarModeToggle sidebarMode={sidebarMode} onChange={onSidebarModeChange} />

          {sidebarMode === "buy" ? (
            <HomepageSidebarBuy
              isMarketplaceSectionOpen={isMarketplaceSectionOpen}
              onToggleMarketplaceSection={onToggleMarketplaceSection}
              isRoomsSectionOpen={isRoomsSectionOpen}
              onToggleRoomsSection={onToggleRoomsSection}
              primaryRooms={primaryRooms}
              marketplaceCategories={marketplaceCategories}
              sidebarRowGridClass={sidebarRowGridClass}
              renderMarketplaceNavItem={renderMarketplaceNavItem}
              renderRoomNavItem={renderRoomNavItem}
            />
          ) : (
            <HomepageSidebarSell renderSellSections={renderSellSections} />
          )}
        </div>

        <div className="mt-auto rounded-[22px] border border-[#2E3547] bg-[#161923] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.11em] text-zinc-400">
            Live Activity
          </p>
          <p className="mt-1 text-sm font-bold text-white">Online: {displayOnlineCount.toLocaleString("en-US")}</p>
          <p className="mt-1 text-xs text-zinc-400">Threads: {threadCount.toLocaleString("en-US")}</p>
        </div>
      </motion.div>
    </motion.aside>
  );
}
