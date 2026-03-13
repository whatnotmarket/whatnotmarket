"use client";

import { cn } from "@/lib/utils";

export function SectionChevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 -4.5 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn(
        "h-3 w-3 drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)] transition-transform",
        open ? "" : "rotate-180"
      )}
    >
      <path
        fill="currentColor"
        d="M23.345 10.39L13.615-.4c-.448-.45-1.045-.65-1.631-.61-.586-.04-1.182.16-1.63.61L.624 10.39c-.827.83-.827 2.18 0 3.01.828.83 2.169.83 2.997 0l8.363-9.27 8.365 9.27c.827.83 2.169.83 2.996 0 .827-.83.827-2.18 0-3.01z"
      />
    </svg>
  );
}

