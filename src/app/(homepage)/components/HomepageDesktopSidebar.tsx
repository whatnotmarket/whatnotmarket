"use client";

import { motion } from "framer-motion";
import { Globe2, LayoutPanelLeft, Store, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SidebarMode } from "../types";
import { HomepageSidebarModeToggle } from "./HomepageSidebarModeToggle";
import { HomepageSidebarBuy } from "./HomepageSidebarBuy";
import { HomepageSidebarSell } from "./HomepageSidebarSell";
import type { GlobalChatRoom } from "@/lib/chat/global-chat-config";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function RailButton({
  label,
  onClick,
  children,
  active = false,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          aria-label={label}
          className={cn(
            "inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-transparent bg-transparent text-[var(--gc-text-primary)] transition",
            active
              ? "border-[var(--gc-border)] bg-[var(--gc-border)]/35"
              : "hover:border-[var(--gc-border)] hover:bg-[var(--gc-border)]/20"
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="right"
        sideOffset={8}
        className="border-[var(--gc-tooltip-border)] bg-[var(--gc-tooltip-bg)] px-2 py-1 text-[10px] font-semibold text-[var(--gc-text-primary)]"
      >
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

export function HomepageDesktopSidebar<
  RoomT extends { slug: GlobalChatRoom; label: string },
  CategoryT extends { label: string; href: string },
>({
  isLeftSidebarClosed,
  forceRail = false,
  renderEmpty = false,
  onCollapse,
  onExpand,
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
  forceRail?: boolean;
  renderEmpty?: boolean;
  onCollapse: () => void;
  onExpand: () => void;
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
  const isRailMode = isLeftSidebarClosed || forceRail;

  if (renderEmpty) {
    return (
      <aside className="relative hidden h-full min-h-0 min-w-0 overflow-hidden md:block">
        <div className="h-full w-full rounded-[30px] border-2 border-[var(--gc-border)] bg-[var(--gc-surface)]" />
      </aside>
    );
  }

  if (isRailMode) {
    return (
      <aside className="relative hidden h-full min-h-0 min-w-0 overflow-hidden md:block">
        <div className="flex h-full w-full items-center justify-center rounded-[30px] border-2 border-[var(--gc-border)] bg-[var(--gc-surface)] px-1 py-2 shadow-none">
          <div className="flex h-[calc(100%-0.5rem)] w-14 flex-col items-center rounded-[28px] bg-transparent px-2 py-3">
            <div className="mb-2 flex w-full justify-center">
            <RailButton label="Expand sidebar" onClick={onExpand}>
              <LayoutPanelLeft className="h-5 w-5" />
            </RailButton>
            </div>

            <div className="mt-1 flex w-full flex-1 flex-col items-center gap-2.5">
              <RailButton
                label="Buy mode"
                onClick={() => {
                  onSidebarModeChange("buy");
                  onExpand();
                }}
              active={sidebarMode === "buy"}
            >
              <Store className="h-5 w-5" />
            </RailButton>
              <RailButton
                label="Sell mode"
                onClick={() => {
                  onSidebarModeChange("sell");
                  onExpand();
                }}
              active={sidebarMode === "sell"}
            >
              <Wallet className="h-5 w-5" />
            </RailButton>
              <RailButton
                label="Marketplace"
                onClick={() => {
                  onSidebarModeChange("buy");
                  onExpand();
                  if (!isMarketplaceSectionOpen) onToggleMarketplaceSection();
                }}
              >
                <Store className="h-5 w-5" />
              </RailButton>
              <RailButton
                label="Trading rooms"
                onClick={() => {
                  onSidebarModeChange("buy");
                  onExpand();
                  if (!isRoomsSectionOpen) onToggleRoomsSection();
                }}
              >
                <Globe2 className="h-5 w-5" />
              </RailButton>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <motion.aside
      initial={false}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="relative hidden h-full min-h-0 min-w-0 overflow-hidden md:block"
    >
      <div className="flex h-full w-full flex-col rounded-[30px] border-2 border-[var(--gc-border)] bg-[var(--gc-surface)] p-3 shadow-none">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={onCollapse}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[var(--gc-border)] bg-[var(--gc-surface)] text-[var(--gc-text-primary)] transition hover:bg-[var(--gc-border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gc-border)]"
            aria-label="Collapse left sidebar"
          >
            <LayoutPanelLeft className="h-4 w-4" />
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

        <div className="mt-auto rounded-[22px] border-2 border-[var(--gc-border)] bg-[var(--gc-surface)] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.11em] text-[var(--gc-text-tertiary)]">
            Live Activity
          </p>
          <p className="mt-1 text-sm font-bold text-[var(--gc-text-primary)]">
            Online: {displayOnlineCount.toLocaleString("en-US")}
          </p>
          <p className="mt-1 text-xs text-[var(--gc-text-tertiary)]">
            Threads: {threadCount.toLocaleString("en-US")}
          </p>
        </div>
      </div>
    </motion.aside>
  );
}
