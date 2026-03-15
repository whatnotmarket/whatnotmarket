"use client";

import { useState } from "react";
import type { GlobalChatRoom } from "@/lib/chat/global-chat-config";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

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

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex h-9 min-w-[144px] items-center justify-between rounded-2xl border-2 border-[var(--gc-border)] bg-[var(--gc-surface)] px-3 text-left text-sm font-semibold text-[var(--gc-text-primary)] transition hover:bg-[var(--gc-border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gc-border)]"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center text-[var(--gc-text-primary)]">{renderRoomIcon(activeRoom, "h-3.5 w-3.5")}</span>
          <span>{activeRoomLabel}</span>
        </span>
        <ChevronDown
          className={cn("ml-2 h-4 w-4 text-[var(--gc-text-primary)] transition-transform", isOpen ? "rotate-180" : "")}
        />
      </button>

      {isOpen ? (
        <div
          className="absolute left-0 top-[calc(100%+6px)] z-40 w-[210px] overflow-hidden rounded-2xl border-2 border-[var(--gc-border)] bg-[var(--gc-surface)] p-2 shadow-none"
          style={{ backgroundColor: "var(--gc-surface)", backgroundImage: "none", opacity: 1 }}
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
                    onClick={() => onRoomChange(room.slug)}
                    onMouseEnter={() => setHoveredRoom(room.slug)}
                    onMouseLeave={() => setHoveredRoom(null)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gc-border)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--gc-surface)]",
                      "text-[var(--gc-text-primary)]"
                    )}
                    style={
                      isActive || hoveredRoom === room.slug
                        ? { backgroundColor: "var(--gc-chat-panel)", backgroundImage: "none", opacity: 1 }
                        : { backgroundColor: "transparent", backgroundImage: "none", opacity: 1 }
                    }
                  >
                    <span className="grid h-6 w-6 shrink-0 place-items-center bg-transparent text-[var(--gc-text-primary)]">
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


