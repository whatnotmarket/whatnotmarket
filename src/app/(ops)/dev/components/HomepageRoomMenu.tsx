"use client";

import { cn } from "@/lib/core/utils/utils";
import type { GlobalChatRoom } from "@/lib/domains/chat/global-chat-config";
import { ChevronDown } from "lucide-react";
import { useCallback,useState,useSyncExternalStore } from "react";

const ROOM_TOOLTIP_CHOSEN_STORAGE_KEY = "global_chat_room_tooltip_chosen";
const ROOM_TOOLTIP_CHOSEN_STORAGE_EVENT = "global_chat_room_tooltip_chosen_change";

function readRoomTooltipChosenSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(ROOM_TOOLTIP_CHOSEN_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function subscribeRoomTooltipChosen(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const onStorage = (event: StorageEvent) => {
    if (event.key === ROOM_TOOLTIP_CHOSEN_STORAGE_KEY) {
      onStoreChange();
    }
  };

  const onCustom = () => {
    onStoreChange();
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(ROOM_TOOLTIP_CHOSEN_STORAGE_EVENT, onCustom);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(ROOM_TOOLTIP_CHOSEN_STORAGE_EVENT, onCustom);
  };
}

function markRoomTooltipChosen() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ROOM_TOOLTIP_CHOSEN_STORAGE_KEY, "1");
    window.dispatchEvent(new Event(ROOM_TOOLTIP_CHOSEN_STORAGE_EVENT));
  } catch {}
}

export function HomepageRoomMenu({
  containerRef,
  isOpen,
  onToggle,
  activeRoom,
  activeRoomLabel,
  rooms,
  onRoomChange,
  renderRoomIcon,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  isOpen: boolean;
  onToggle: () => void;
  activeRoom: GlobalChatRoom;
  activeRoomLabel: string;
  rooms: readonly { slug: GlobalChatRoom; label: string }[];
  onRoomChange: (room: GlobalChatRoom) => void;
  renderRoomIcon: (room: GlobalChatRoom, iconClassName?: string) => React.ReactNode;
}) {
  const [hoveredRoom, setHoveredRoom] = useState<GlobalChatRoom | null>(null);
  const hasChosenRoom = useSyncExternalStore(
    subscribeRoomTooltipChosen,
    readRoomTooltipChosenSnapshot,
    () => false
  );
  const roomTooltipText = hasChosenRoom ? `You are in ${activeRoomLabel}` : "Choose a Room";
  const roomTooltipClassName =
    "pointer-events-none absolute left-1/2 top-full z-[999] mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#11161a] px-2 py-1 text-[11px] font-medium text-white/95 opacity-0 shadow-[0_8px_20px_rgba(0,0,0,0.35)] transition-opacity duration-150 group-hover:opacity-100";

  const handleRoomChange = useCallback(
    (room: GlobalChatRoom) => {
      markRoomTooltipChosen();
      onRoomChange(room);
    },
    [onRoomChange]
  );

  return (
    <div className="relative" ref={containerRef}>
      <div className="group relative inline-flex">
        <button
          type="button"
          onClick={onToggle}
          className="inline-flex h-9 min-w-[144px] items-center justify-between rounded-2xl border-2 border-[var(--gc-room-button-border)] bg-[var(--gc-room-button-bg)] px-3 text-left text-sm font-semibold text-[var(--gc-room-button-text)] transition hover:bg-[var(--gc-room-button-hover-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gc-room-focus-ring)]"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center text-[var(--gc-room-button-text)]">{renderRoomIcon(activeRoom, "h-3.5 w-3.5")}</span>
            <span>{activeRoomLabel}</span>
          </span>
          <ChevronDown
            className={cn(
              "ml-2 h-4 w-4 text-[var(--gc-room-button-text)] transition-transform",
              isOpen ? "rotate-180" : ""
            )}
          />
        </button>
        <span className={roomTooltipClassName}>{roomTooltipText}</span>
      </div>

      {isOpen ? (
        <div
          className="absolute left-0 top-[calc(100%+6px)] z-40 w-[210px] overflow-hidden rounded-2xl border-2 border-[var(--gc-room-dropdown-border)] bg-[var(--gc-room-dropdown-bg)] p-2 shadow-none"
          style={{ backgroundColor: "var(--gc-room-dropdown-bg)", backgroundImage: "none", opacity: 1 }}
        >
          <ul role="listbox" aria-label="Chat rooms" className="space-y-1">
            {rooms.map((room) => {
              const isActive = room.slug === activeRoom;
              return (
                <li key={room.slug}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => handleRoomChange(room.slug)}
                    onMouseEnter={() => setHoveredRoom(room.slug)}
                    onMouseLeave={() => setHoveredRoom(null)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gc-room-focus-ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--gc-room-dropdown-bg)]",
                      "text-[var(--gc-room-item-text)]"
                    )}
                    style={
                      isActive || hoveredRoom === room.slug
                        ? {
                            backgroundColor: isActive
                              ? "var(--gc-room-item-active-bg)"
                              : "var(--gc-room-item-hover-bg)",
                            backgroundImage: "none",
                            opacity: 1,
                          }
                        : { backgroundColor: "transparent", backgroundImage: "none", opacity: 1 }
                    }
                  >
                    <span className="grid h-6 w-6 shrink-0 place-items-center bg-transparent text-[var(--gc-room-item-text)]">
                      {renderRoomIcon(room.slug, "h-3.5 w-3.5")}
                    </span>
                    <span className="text-sm font-semibold">{room.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}



