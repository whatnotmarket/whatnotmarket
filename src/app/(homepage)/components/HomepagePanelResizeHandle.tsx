"use client";

import { Separator as ResizableSeparator } from "react-resizable-panels";

export function HomepagePanelResizeHandle({
  onPointerDown,
}: {
  onPointerDown?: () => void;
}) {
  return (
    <ResizableSeparator
      onPointerDown={onPointerDown}
      className="group relative z-[2147483647] hidden w-3 shrink-0 cursor-col-resize touch-none overflow-visible border-0 bg-transparent outline-none ring-0 focus:outline-none focus-visible:outline-none focus-visible:ring-0 md:flex"
      style={{ background: "transparent" }}
    >
      <div className="absolute inset-y-3 left-1/2 w-px -translate-x-1/2 rounded-full bg-[#2E3547]/45 transition-colors group-hover:bg-[#4a5571]/80 group-data-[resize-handle-state=drag]:bg-[#6f7ea6]" />
      <div className="absolute left-1/2 top-1/2 z-[2147483647] grid h-6 w-3 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-md border border-[#2E3547] bg-[#212533] text-[#8e9dc6] opacity-0 shadow-[0_8px_16px_rgba(0,0,0,0.35)] transition-[opacity,color,border-color] duration-150 group-hover:border-[#4a5571] group-hover:text-[#b9c5e6] group-hover:opacity-100 group-data-[resize-handle-state=drag]:border-[#6f7ea6] group-data-[resize-handle-state=drag]:text-[#d4dcf5] group-data-[resize-handle-state=drag]:opacity-100">
        <svg viewBox="0 0 12 12" className="h-3 w-3" fill="currentColor" aria-hidden="true">
          <circle cx="4" cy="3" r="1" />
          <circle cx="8" cy="3" r="1" />
          <circle cx="4" cy="6" r="1" />
          <circle cx="8" cy="6" r="1" />
          <circle cx="4" cy="9" r="1" />
          <circle cx="8" cy="9" r="1" />
        </svg>
      </div>
    </ResizableSeparator>
  );
}
