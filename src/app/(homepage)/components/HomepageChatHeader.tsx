"use client";

import type { GlobalChatRoom } from "@/lib/chat/global-chat-config";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { HomepageRoomMenu } from "./HomepageRoomMenu";

export function HomepageChatHeader({
  onOpenMobileSidebar,
  roomMenuRef,
  isRoomMenuOpen,
  onToggleRoomMenu,
  activeRoom,
  activeRoomLabel,
  rooms,
  onRoomChange,
  renderRoomIcon,
  isChatExpanded,
  onToggleChatExpanded,
  onOpenRules,
  onCloseChat,
}: {
  onOpenMobileSidebar: () => void;
  roomMenuRef: React.RefObject<HTMLDivElement | null>;
  isRoomMenuOpen: boolean;
  onToggleRoomMenu: () => void;
  activeRoom: GlobalChatRoom;
  activeRoomLabel: string;
  rooms: readonly { slug: GlobalChatRoom; label: string }[];
  onRoomChange: (room: GlobalChatRoom) => void;
  renderRoomIcon: (room: GlobalChatRoom, iconClassName?: string) => React.ReactNode;
  isChatExpanded: boolean;
  onToggleChatExpanded: () => void;
  onOpenRules: () => void;
  onCloseChat: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label="Open room sidebar"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#2E3547] bg-[#212533] text-white transition hover:bg-[#262c3b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E3547] md:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>

        <HomepageRoomMenu
          containerRef={roomMenuRef}
          isOpen={isRoomMenuOpen}
          onToggle={onToggleRoomMenu}
          activeRoom={activeRoom}
          activeRoomLabel={activeRoomLabel}
          rooms={rooms}
          onRoomChange={onRoomChange}
          renderRoomIcon={renderRoomIcon}
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleChatExpanded}
          aria-label={isChatExpanded ? "Shrink chat width" : "Stretch chat width"}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#2E3547] bg-[#212533] text-white transition hover:bg-[#262c3b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E3547]"
        >
          <svg
            className={cn("h-6 w-6 transition-transform", !isChatExpanded ? "rotate-180" : "")}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g stroke="#fff" strokeLinecap="round" strokeWidth="2">
              <path d="M18 16V8" />
              <path d="M5 12h8" />
              <path d="M10.1538 7.84619 13.8461 11.8462 10.1538 15.8462" />
            </g>
          </svg>
        </button>
        <button
          type="button"
          onClick={onOpenRules}
          aria-label="Open chat rules"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#2E3547] bg-[#212533] text-white transition hover:bg-[#262c3b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E3547]"
        >
          <svg
            viewBox="0 0 32 32"
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="currentColor"
            aria-hidden="true"
          >
            <g transform="translate(-414 -101)">
              <path d="M418,101 C415.791,101 414,102.791 414,105 L414,126 C414,128.209 415.885,129.313 418,130 L429,133 L429,104 C423.988,102.656 418,101 418,101 L418,101 Z M442,101 C442,101 436.212,102.594 430.951,104 L431,104 L431,133 C436.617,131.501 442,130 442,130 C444.053,129.469 446,128.209 446,126 L446,105 C446,102.791 444.209,101 442,101 L442,101 Z" />
            </g>
          </svg>
        </button>
        <button
          type="button"
          onClick={onCloseChat}
          aria-label="Close chat"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#2E3547] bg-[#212533] text-white transition hover:bg-[#262c3b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E3547]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
