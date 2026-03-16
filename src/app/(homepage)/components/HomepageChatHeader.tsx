"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { GlobalChatRoom } from "@/lib/chat/global-chat-config";
import { Menu, X } from "lucide-react";
import { HomepageRoomMenu } from "./HomepageRoomMenu";

const RULES_ACCEPTED_STORAGE_KEY = "global_chat_rules_accepted";
const RULES_ACCEPTED_STORAGE_EVENT = "global_chat_rules_accepted_change";
const CLOSE_TOOLTIP_SEEN_STORAGE_KEY = "global_chat_close_tooltip_seen";
const CLOSE_TOOLTIP_SEEN_STORAGE_EVENT = "global_chat_close_tooltip_seen_change";

function readRulesAcceptedSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(RULES_ACCEPTED_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function readCloseTooltipSeenSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(CLOSE_TOOLTIP_SEEN_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function subscribeRulesAccepted(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const onStorage = (event: StorageEvent) => {
    if (event.key === RULES_ACCEPTED_STORAGE_KEY) {
      onStoreChange();
    }
  };

  const onCustom = () => {
    onStoreChange();
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(RULES_ACCEPTED_STORAGE_EVENT, onCustom);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(RULES_ACCEPTED_STORAGE_EVENT, onCustom);
  };
}

function subscribeCloseTooltipSeen(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const onStorage = (event: StorageEvent) => {
    if (event.key === CLOSE_TOOLTIP_SEEN_STORAGE_KEY) {
      onStoreChange();
    }
  };

  const onCustom = () => {
    onStoreChange();
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(CLOSE_TOOLTIP_SEEN_STORAGE_EVENT, onCustom);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CLOSE_TOOLTIP_SEEN_STORAGE_EVENT, onCustom);
  };
}

function markCloseTooltipSeen() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CLOSE_TOOLTIP_SEEN_STORAGE_KEY, "1");
    window.dispatchEvent(new Event(CLOSE_TOOLTIP_SEEN_STORAGE_EVENT));
  } catch {}
}

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
  onOpenRules: () => void;
  onCloseChat: () => void;
}) {
  const hasAcceptedRules = useSyncExternalStore(
    subscribeRulesAccepted,
    readRulesAcceptedSnapshot,
    () => false
  );
  const hasSeenCloseTooltip = useSyncExternalStore(
    subscribeCloseTooltipSeen,
    readCloseTooltipSeenSnapshot,
    () => false
  );
  const handleCloseChat = useCallback(() => {
    markCloseTooltipSeen();
    onCloseChat();
  }, [onCloseChat]);

  const tooltipBaseClassName =
    "pointer-events-none absolute top-full z-[999] mt-2 whitespace-nowrap rounded-md bg-[#11161a] px-2 py-1 text-[11px] font-medium text-white/95 opacity-0 shadow-[0_8px_20px_rgba(0,0,0,0.35)] transition-opacity duration-150 group-hover:opacity-100";
  const rulesTooltipClassName = `${tooltipBaseClassName} left-1/2 -translate-x-1/2`;
  const closeTooltipClassName =
    `${tooltipBaseClassName} right-0`;

  return (
    <div className="flex items-center justify-between gap-3 px-3 py-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label="Open room sidebar"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[var(--gc-header-action-border)] bg-[var(--gc-header-action-bg)] text-[var(--gc-header-action-text)] transition hover:bg-[var(--gc-header-action-hover-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gc-header-action-focus-ring)] md:hidden"
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
        <div className="group relative inline-flex">
          <button
            type="button"
            onClick={onOpenRules}
            aria-label="Open chat rules"
            data-chat-rules-toggle="true"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[var(--gc-header-action-border)] bg-[var(--gc-header-action-bg)] text-[var(--gc-header-action-text)] transition hover:bg-[var(--gc-header-action-hover-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gc-header-action-focus-ring)]"
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
          {!hasAcceptedRules ? (
            <span className={rulesTooltipClassName}>Rules</span>
          ) : null}
        </div>
        <div className="group relative inline-flex">
          <button
            type="button"
            onClick={handleCloseChat}
            aria-label="Close chat"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[var(--gc-header-action-border)] bg-[var(--gc-header-action-bg)] text-[var(--gc-header-action-text)] transition hover:bg-[var(--gc-header-action-hover-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gc-header-action-focus-ring)]"
          >
            <X className="h-4 w-4" />
          </button>
          {!hasSeenCloseTooltip ? (
            <span className={closeTooltipClassName}>Close Global Chat</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}


