"use client";

import { cn } from "@/lib/utils";
import type { SidebarMode } from "../types";

export function HomepageSidebarModeToggle({
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
          "h-9 rounded-xl text-sm font-extrabold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#395565]",
          sidebarMode === "buy"
            ? "border-2 border-[#395565] bg-[#13232D]"
            : "border-2 border-[#395565] bg-[#13232D] hover:bg-[#13232D]"
        )}
      >
        Buy
      </button>
      <button
        type="button"
        onClick={() => onChange("sell")}
        aria-pressed={sidebarMode === "sell"}
        className={cn(
          "h-9 rounded-xl text-sm font-extrabold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#395565]",
          sidebarMode === "sell"
            ? "border-2 border-[#395565] bg-[#13232D]"
            : "border-2 border-[#395565] bg-[#13232D] hover:bg-[#13232D]"
        )}
      >
        Sell
      </button>
    </div>
  );
}
