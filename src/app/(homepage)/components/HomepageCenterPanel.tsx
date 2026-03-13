"use client";

export function HomepageCenterPanel({
  isLeftSidebarClosed,
  isChatClosed,
  onExpandSidebar,
  onExpandChat,
  commandSearchSlot,
  children,
}: {
  isLeftSidebarClosed: boolean;
  isChatClosed: boolean;
  onExpandSidebar: () => void;
  onExpandChat: () => void;
  commandSearchSlot: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div data-homepage-center-panel="true" className="relative hidden h-full min-h-0 min-w-0 flex-1 md:block">
      <div
        data-homepage-center-surface="true"
        className="no-scrollbar h-full min-h-0 overflow-y-auto rounded-[30px] border border-[#2E3547] bg-[#161923]"
      >
        {children ? <div className="min-h-full">{children}</div> : null}
      </div>
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
      {isChatClosed ? (
        <button
          type="button"
          onClick={onExpandChat}
          aria-label="Reopen chat"
          className="absolute right-6 top-6 z-20 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#2E3547] bg-[#212533] text-white transition hover:bg-[#2E3547] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E3547]"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 13.5997 2.37562 15.1116 3.04346 16.4525C3.22094 16.8088 3.28001 17.2161 3.17712 17.6006L2.58151 19.8267C2.32295 20.793 3.20701 21.677 4.17335 21.4185L6.39939 20.8229C6.78393 20.72 7.19121 20.7791 7.54753 20.9565C8.88837 21.6244 10.4003 22 12 22Z"
              fill="#ffffff"
            />
          </svg>
        </button>
      ) : null}
      <div className="absolute left-1/2 top-6 z-20 w-[min(720px,calc(100%-2.5rem))] -translate-x-1/2">
        {commandSearchSlot}
      </div>
    </div>
  );
}
