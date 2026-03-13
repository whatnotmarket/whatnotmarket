"use client";

import { Globe2, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GlobalChatRoom } from "@/lib/chat/global-chat-config";
import { SectionChevron } from "./SectionChevron";

export function GlobalChatSidebarBuy<
  RoomT extends { slug: GlobalChatRoom; label: string },
  CategoryT extends { label: string; href: string },
>({
  isMarketplaceSectionOpen,
  onToggleMarketplaceSection,
  isRoomsSectionOpen,
  onToggleRoomsSection,
  primaryRooms,
  renderMarketplaceNavItem,
  renderRoomNavItem,
  marketplaceCategories,
  sidebarRowGridClass,
  closeMobileOnClick = false,
}: {
  isMarketplaceSectionOpen: boolean;
  onToggleMarketplaceSection: () => void;
  isRoomsSectionOpen: boolean;
  onToggleRoomsSection: () => void;
  primaryRooms: readonly RoomT[];
  renderMarketplaceNavItem: (category: CategoryT, closeMobileOnClick?: boolean) => React.ReactNode;
  renderRoomNavItem: (room: RoomT) => React.ReactNode;
  marketplaceCategories: readonly CategoryT[];
  sidebarRowGridClass: string;
  closeMobileOnClick?: boolean;
}) {
  return (
    <div className="space-y-2.5">
      <div
        className={cn(
          isMarketplaceSectionOpen ? "rounded-[22px] overflow-hidden border border-[#2E3547] bg-[#161923]" : ""
        )}
      >
        <button
          type="button"
          className={cn(
            "grid h-10 w-full items-center gap-2.5 overflow-hidden rounded-[22px] px-3 text-left text-sm font-extrabold text-white transition hover:bg-[#2E3547] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E3547]",
            sidebarRowGridClass,
            "bg-[#212533]",
            !isMarketplaceSectionOpen ? "border border-[#2E3547]" : ""
          )}
          onClick={onToggleMarketplaceSection}
          aria-expanded={isMarketplaceSectionOpen}
        >
          <span className="grid h-7 w-7 place-items-center text-white">
            <Store className="h-3.5 w-3.5" />
          </span>
          <span className="min-w-0 truncate">Marketplace</span>
          <span className="grid h-7 w-7 place-items-center rounded-xl bg-[#2E3547] text-white">
            <SectionChevron open={isMarketplaceSectionOpen} />
          </span>
        </button>
        {isMarketplaceSectionOpen ? (
          <div className="mt-1 space-y-1 px-1.5 pb-1.5">
            {marketplaceCategories.map((category) => renderMarketplaceNavItem(category, closeMobileOnClick))}
          </div>
        ) : null}
      </div>

      <div
        className={cn(
          isRoomsSectionOpen ? "rounded-[22px] overflow-hidden border border-[#2E3547] bg-[#161923]" : ""
        )}
      >
        <button
          type="button"
          className={cn(
            "grid h-10 w-full items-center gap-2.5 overflow-hidden rounded-[22px] px-3 text-left text-sm font-extrabold text-white transition hover:bg-[#2E3547] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E3547]",
            sidebarRowGridClass,
            "bg-[#212533]",
            !isRoomsSectionOpen ? "border border-[#2E3547]" : ""
          )}
          onClick={onToggleRoomsSection}
          aria-expanded={isRoomsSectionOpen}
        >
          <span className="grid h-7 w-7 place-items-center text-white">
            <Globe2 className="h-3.5 w-3.5" />
          </span>
          <span className="min-w-0 truncate">Trading Rooms</span>
          <span className="grid h-7 w-7 place-items-center rounded-xl bg-[#2E3547] text-white">
            <SectionChevron open={isRoomsSectionOpen} />
          </span>
        </button>
        {isRoomsSectionOpen ? (
          <div className="mt-1 space-y-1 px-1.5 pb-1.5">
            {primaryRooms.map((room) => renderRoomNavItem(room))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
