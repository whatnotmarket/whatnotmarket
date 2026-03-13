"use client";

import { cn } from "@/lib/utils";

export function GlobalChatCenterPanel({
  isLeftSidebarClosed,
  onExpandSidebar,
  renderCommandSearch,
}: {
  isLeftSidebarClosed: boolean;
  onExpandSidebar: () => void;
  renderCommandSearch: () => React.ReactNode;
}) {
  return (
    <div className={cn("relative hidden flex-1 md:block", isLeftSidebarClosed ? "md:-ml-1" : "")}>
      <div className="h-[calc(100vh-3rem)] rounded-[30px] border border-[#2E3547] bg-[#161923]" />
      {isLeftSidebarClosed ? (
        <button
          type="button"
          onClick={onExpandSidebar}
          aria-label="Expand left sidebar"
          className="absolute left-6 top-6 z-20 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#2E3547] bg-[#212533] text-white transition hover:bg-[#2E3547] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E3547]"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 text-white"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M10 22.5H18.5C20.7091 22.5 22.5 20.7091 22.5 18.5V5.5C22.5 3.29086 20.7091 1.5 18.5 1.5H10V22.5Z"
              fill="currentColor"
            />
            <path
              d="M8 1.5H5.5C3.29086 1.5 1.5 3.29086 1.5 5.5V18.5C1.5 20.7091 3.29086 22.5 5.5 22.5H8V1.5Z"
              fill="currentColor"
            />
          </svg>
        </button>
      ) : null}
      <div className="absolute left-1/2 top-6 z-20 w-[min(760px,calc(100%-4rem))] -translate-x-1/2">
        {renderCommandSearch()}
      </div>
    </div>
  );
}

