"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Globe2, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GlobalChatRoom } from "@/lib/chat/global-chat-config";
import { HomepageSectionChevron } from "./HomepageSectionChevron";

export function HomepageSidebarBuy<
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
          isMarketplaceSectionOpen ? "rounded-[22px] overflow-hidden border-2 border-[#395565] bg-[#13232D]" : ""
        )}
        style={isMarketplaceSectionOpen ? { backgroundColor: "#13232D", backgroundImage: "none", opacity: 1 } : undefined}
      >
        <button
          type="button"
          className={cn(
            "grid h-10 w-full items-center gap-2.5 overflow-hidden rounded-[22px] px-3 text-left text-sm font-extrabold text-white transition hover:bg-[#13232D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#395565]",
            sidebarRowGridClass,
            "bg-[#13232D]",
            !isMarketplaceSectionOpen ? "border-2 border-[#395565]" : ""
          )}
          style={{ backgroundColor: "#13232D", backgroundImage: "none", opacity: 1 }}
          onClick={onToggleMarketplaceSection}
          aria-expanded={isMarketplaceSectionOpen}
        >
          <span className="grid h-7 w-7 place-items-center text-white">
            <Store className="h-3.5 w-3.5" />
          </span>
          <span className="min-w-0 truncate">Marketplace</span>
          <span className="grid h-7 w-7 place-items-center rounded-xl bg-[#395565] text-white">
            <HomepageSectionChevron open={isMarketplaceSectionOpen} />
          </span>
        </button>
        <AnimatePresence initial={false}>
          {isMarketplaceSectionOpen ? (
            <motion.div
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="mt-1 space-y-1 px-1.5 pb-1.5"
            >
              {marketplaceCategories.map((category) => renderMarketplaceNavItem(category, closeMobileOnClick))}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div
        className={cn(
          isRoomsSectionOpen ? "rounded-[22px] overflow-hidden border-2 border-[#395565] bg-[#13232D]" : ""
        )}
        style={isRoomsSectionOpen ? { backgroundColor: "#13232D", backgroundImage: "none", opacity: 1 } : undefined}
      >
        <button
          type="button"
          className={cn(
            "grid h-10 w-full items-center gap-2.5 overflow-hidden rounded-[22px] px-3 text-left text-sm font-extrabold text-white transition hover:bg-[#13232D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#395565]",
            sidebarRowGridClass,
            "bg-[#13232D]",
            !isRoomsSectionOpen ? "border-2 border-[#395565]" : ""
          )}
          style={{ backgroundColor: "#13232D", backgroundImage: "none", opacity: 1 }}
          onClick={onToggleRoomsSection}
          aria-expanded={isRoomsSectionOpen}
        >
          <span className="grid h-7 w-7 place-items-center text-white">
            <Globe2 className="h-3.5 w-3.5" />
          </span>
          <span className="min-w-0 truncate">Trading Rooms</span>
          <span className="grid h-7 w-7 place-items-center rounded-xl bg-[#395565] text-white">
            <HomepageSectionChevron open={isRoomsSectionOpen} />
          </span>
        </button>
        <AnimatePresence initial={false}>
          {isRoomsSectionOpen ? (
            <motion.div
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="mt-1 space-y-1 px-1.5 pb-1.5"
            >
              {primaryRooms.map((room) => renderRoomNavItem(room))}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
