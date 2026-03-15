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
      className="group isolate relative z-[2147483647] hidden w-3 shrink-0 cursor-col-resize touch-none overflow-visible border-0 bg-transparent outline-none ring-0 focus:outline-none focus-visible:outline-none focus-visible:ring-0 md:flex"
      style={{ background: "transparent" }}
    >
      <div className="absolute inset-y-3 left-1/2 w-px -translate-x-1/2 rounded-full bg-[var(--gc-border)]/45 transition-colors group-hover:bg-[var(--gc-border)]/45 group-data-[resize-handle-state=drag]:bg-[var(--gc-border)]/45" />
      <div
        className="absolute left-1/2 top-1/2 z-[2147483647] grid h-6 w-3 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-md border-0 text-[var(--gc-resize-handle-icon)] opacity-0 shadow-none transition-[opacity,color] duration-150 group-hover:opacity-100 group-data-[resize-handle-state=drag]:opacity-100"
        style={{ backgroundColor: "var(--gc-chat-panel)", backgroundImage: "none" }}
      >
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

