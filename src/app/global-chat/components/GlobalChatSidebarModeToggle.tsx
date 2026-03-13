"use client";

import { cn } from "@/lib/utils";
import type { SidebarMode } from "../types";

export function GlobalChatSidebarModeToggle({
  sidebarMode,
  onChange,
}: {
  sidebarMode: SidebarMode;
  onChange: (mode: SidebarMode) => void;
}) {
  return (
    <div className="mb-3 grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={() => onChange("buy")}
        aria-pressed={sidebarMode === "buy"}
        className={cn(
          "h-9 rounded-xl text-sm font-extrabold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E3547]",
          sidebarMode === "buy"
            ? "border border-[#2E3547] bg-[#212533]"
            : "border border-[#2E3547] bg-[#161923] hover:bg-[#2E3547]"
        )}
      >
        Buy
      </button>
      <button
        type="button"
        onClick={() => onChange("sell")}
        aria-pressed={sidebarMode === "sell"}
        className={cn(
          "h-9 rounded-xl text-sm font-extrabold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E3547]",
          sidebarMode === "sell"
            ? "border border-[#2E3547] bg-[#212533]"
            : "border border-[#2E3547] bg-[#161923] hover:bg-[#2E3547]"
        )}
      >
        Sell
      </button>
    </div>
  );
}

