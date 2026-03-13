"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import type { SidebarMode } from "../types";
import type { GlobalChatRoom } from "@/lib/chat/global-chat-config";
import { HomepageSidebarModeToggle } from "./HomepageSidebarModeToggle";
import { HomepageSidebarBuy } from "./HomepageSidebarBuy";
import { HomepageSidebarSell } from "./HomepageSidebarSell";

export function HomepageMobileSidebar<
  RoomT extends { slug: GlobalChatRoom; label: string },
  CategoryT extends { label: string; href: string },
>({
  isOpen,
  onClose,
  activeRoomLabel,
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
  isOpen: boolean;
  onClose: () => void;
  activeRoomLabel: string;
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
  if (!isOpen) return null;

  return (
    <>
      <motion.button
        type="button"
        aria-label="Close chat sidebar"
        className="fixed inset-0 z-40 bg-[#09071f]/70 backdrop-blur-[2px] md:hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.aside
        className="fixed inset-y-0 left-0 z-50 w-[min(84vw,280px)] overflow-y-auto border-r border-[#2E3547] bg-[#161923] p-3 shadow-[0_22px_60px_rgba(0,0,0,0.65)] md:hidden"
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">Global Chat</p>
            <p className="text-sm font-extrabold text-white">{activeRoomLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[#2E3547] bg-[#212533] text-white transition hover:bg-[#2E3547] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E3547]"
            aria-label="Close mobile sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

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
            closeMobileOnClick
          />
        ) : (
          <HomepageSidebarSell renderSellSections={renderSellSections} closeMobileOnClick />
        )}

        <div className="mt-3 rounded-[22px] border border-[#2E3547] bg-[#161923] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.11em] text-zinc-400">Live Activity</p>
          <p className="mt-1 text-sm font-bold text-white">Online: {displayOnlineCount.toLocaleString("en-US")}</p>
          <p className="mt-1 text-xs text-zinc-400">Threads: {threadCount.toLocaleString("en-US")}</p>
        </div>
      </motion.aside>
    </>
  );
}
