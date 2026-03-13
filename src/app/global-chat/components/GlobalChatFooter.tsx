"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { LogIn, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { GlobalChatRoom } from "@/lib/chat/global-chat-config";
import type { GlobalChatMessage, MentionContext, MentionableUser } from "../types";
import { GlobalChatRulesCard } from "./GlobalChatRulesCard";

export function GlobalChatFooter({
  replyTarget,
  onClearReplyTarget,
  truncateMessage,
  isRulesOpen,
  onCloseRules,
  onAcceptRules,
  hasAcceptedRules,
  onOpenRules,
  isBanned,
  mutedUntilTs,
  closedUntilTs,
  closedRemainingSeconds,
  slowRemainingSeconds,
  canWrite,
  requiredRoleText,
  mentionContext,
  setMentionContext,
  mentionSuggestions,
  activeMentionIndex,
  setActiveMentionIndex,
  applyMention,
  getAvatarFallback,
  inputRef,
  draft,
  setDraft,
  syncMentionContextFromInput,
  handleSend,
  isSending,
  displayOnlineCount,
  activeRoom,
  slowModeMinutes,
  user,
}: {
  replyTarget: GlobalChatMessage | null;
  onClearReplyTarget: () => void;
  truncateMessage: (text: string, maxLength?: number) => string;
  isRulesOpen: boolean;
  onCloseRules: () => void;
  onAcceptRules: () => void;
  hasAcceptedRules: boolean;
  onOpenRules: () => void;
  isBanned: boolean;
  mutedUntilTs: number;
  closedUntilTs: number;
  closedRemainingSeconds: number;
  slowRemainingSeconds: number;
  canWrite: boolean;
  requiredRoleText: string | null;
  mentionContext: MentionContext | null;
  setMentionContext: (value: MentionContext | null) => void;
  mentionSuggestions: MentionableUser[];
  activeMentionIndex: number;
  setActiveMentionIndex: (next: number | ((prev: number) => number)) => void;
  applyMention: (candidate: MentionableUser) => void;
  getAvatarFallback: (name: string) => string;
  inputRef: React.RefObject<HTMLInputElement>;
  draft: string;
  setDraft: (value: string) => void;
  syncMentionContextFromInput: (input: HTMLInputElement) => void;
  handleSend: () => void;
  isSending: boolean;
  displayOnlineCount: number;
  activeRoom: GlobalChatRoom;
  slowModeMinutes: number;
  user: { id: string } | null;
}) {
  return (
    <div className="mx-3 mb-3 mt-2 rounded-[24px] border border-[#2E3547] bg-[#212533] p-3 shadow-[0_0_0_1px_rgba(46,53,71,0.05)] transition-shadow duration-200 focus-within:shadow-[0_0_0_1px_rgba(46,53,71,0.72),0_0_0_5px_rgba(46,53,71,0.12)]">
      {replyTarget ? (
        <div className="mb-2 flex items-center justify-between rounded-xl border border-[#2E3547] bg-[#161923] px-3 py-2 text-xs text-zinc-300">
          <div className="min-w-0">
            <span className="font-semibold text-white">Replying to {replyTarget.displayName}</span>
            <span className="ml-2 text-zinc-300">{truncateMessage(replyTarget.text, 70)}</span>
          </div>
          <button
            type="button"
            onClick={onClearReplyTarget}
            className="ml-2 inline-flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-[#2E3547] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {isRulesOpen ? <GlobalChatRulesCard onClose={onCloseRules} onAccept={onAcceptRules} /> : null}

      {isBanned ? (
        <div className="mb-2 inline-flex items-center gap-2 text-sm text-[#ff0000]">
          <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M16 8C16 12.4183 12.4183 16 8 16C3.58172 16 0 12.4183 0 8C0 3.58172 3.58172 0 8 0C12.4183 0 16 3.58172 16 8ZM10.3128 12.4341C9.62116 12.7956 8.83445 13 8 13C5.23858 13 3 10.7614 3 8C3 7.16555 3.20441 6.37884 3.5659 5.68722L10.3128 12.4341ZM12.4341 10.3128L5.68722 3.5659C6.37884 3.20441 7.16555 3 8 3C10.7614 3 13 5.23858 13 8C13 8.83445 12.7956 9.62116 12.4341 10.3128Z"
              fill="#ff0000"
            />
          </svg>
          <span className="font-semibold">You are banned to write here</span>
        </div>
      ) : mutedUntilTs && mutedUntilTs > Date.now() ? (
        <div className="mb-2 inline-flex items-center gap-2 text-sm text-white">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
            <path d="M5 5L19 19" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M9.68219 5.56134C10.0533 4.64576 10.9513 4 12 4C13.3807 4 14.5 5.11929 14.5 6.5V10.3792L9.68219 5.56134ZM12.7605 12.8822L9.5 9.62179V10.5C9.5 11.8807 10.6193 13 12 13C12.2651 13 12.5207 12.9587 12.7605 12.8822Z"
              fill="#ffffff"
            />
            <path
              d="M9.68219 5.56134L8.97509 6.26845L8.50647 5.79984L8.75544 5.18566L9.68219 5.56134ZM14.5 10.3792H15.5V12.7934L13.7929 11.0863L14.5 10.3792ZM12.7605 12.8822L13.4676 12.1751L14.6285 13.3361L13.0643 13.835L12.7605 12.8822ZM9.5 9.62179H8.5V7.20758L10.2071 8.91469L9.5 9.62179ZM8.75544 5.18566C9.27431 3.90569 10.5302 3 12 3V5C11.3723 5 10.8324 5.38583 10.6089 5.93702L8.75544 5.18566ZM12 3C13.933 3 15.5 4.567 15.5 6.5H13.5C13.5 5.67157 12.8284 5 12 5V3ZM15.5 6.5V10.3792H13.5V6.5H15.5ZM10.3893 4.85424L15.2071 9.67204L13.7929 11.0863L8.97509 6.26845L10.3893 4.85424ZM12.0533 13.5893L8.79289 10.3289L10.2071 8.91469L13.4676 12.1751L12.0533 13.5893ZM8.5 10.5V9.62179H10.5V10.5H8.5ZM12 14C10.067 14 8.5 12.433 8.5 10.5H10.5C10.5 11.3284 11.1716 12 12 12V14ZM13.0643 13.835C12.7274 13.9424 12.3695 14 12 14V12C12.1608 12 12.3139 11.975 12.4566 11.9295L13.0643 13.835Z"
              fill="#ffffff"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M8.46291 13.7293C8.31338 13.1976 7.76117 12.8878 7.22951 13.0373C6.69785 13.1869 6.38808 13.7391 6.5376 14.2707C7.17394 16.5333 8.82364 18.063 11.0003 18.42V21C11.0003 21.5523 11.448 22 12.0003 22C12.5525 22 13.0003 21.5523 13.0003 21V18.42C13.7841 18.2914 14.4996 18.0108 15.124 17.5986L13.6608 16.1355C13.1713 16.3753 12.6119 16.5 12.0003 16.5C10.2727 16.5 8.9625 15.5056 8.46291 13.7293ZM15.7806 13.3054C16.0279 13.0495 16.4044 12.9342 16.771 13.0373C17.3027 13.1869 17.6124 13.7391 17.4629 14.2707C17.4108 14.456 17.3519 14.6363 17.2865 14.8114L15.7806 13.3054Z"
              fill="#ffffff"
            />
          </svg>
          <span className="font-semibold">You are muted to write here</span>
        </div>
      ) : closedUntilTs && closedUntilTs > Date.now() ? (
        <div className="mb-2 inline-flex items-center gap-2 text-sm text-white">
          <span className="font-semibold">
            {closedUntilTs > Date.now() + 365 * 24 * 60 * 60 * 1000
              ? "This chat is closed"
              : `This chat is closed for ${closedRemainingSeconds}s`}
          </span>
        </div>
      ) : slowRemainingSeconds > 0 ? (
        <div className="mb-2 flex items-center gap-2 text-sm text-white">
          <svg
            viewBox="0 0 16 16"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-zinc-300"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16ZM7 3V8.41421L10.2929 11.7071L11.7071 10.2929L9 7.58579V3H7Z"
            />
          </svg>
          <span className="font-semibold">Slow mode attivo</span>
          <span className="text-zinc-400">({slowRemainingSeconds}s)</span>
        </div>
      ) : null}

      {mentionContext ? (
        <div className="mb-2 max-h-60 overflow-y-auto rounded-2xl border border-[#2E3547] bg-[#161923] px-3 py-3 text-sm text-zinc-300 shadow-sm">
          {mentionSuggestions.length > 0 ? (
            mentionSuggestions.map((candidate, index) => (
              <button
                key={`${candidate.userId}-${candidate.handle}`}
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  applyMention(candidate);
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left transition",
                  index === activeMentionIndex ? "bg-[#2E3547] text-white" : "text-zinc-200 hover:bg-[#2E3547]"
                )}
              >
                <Avatar size="default" className="shrink-0 border border-[#2E3547]">
                  <AvatarImage src={candidate.avatarUrl || undefined} alt={candidate.displayName} />
                  <AvatarFallback className="bg-[#151515] text-[10px] text-zinc-300">
                    {getAvatarFallback(candidate.displayName)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="truncate font-semibold">{candidate.displayName}</span>
                    <span className="truncate text-xs text-zinc-400">@{candidate.handle}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                    {candidate.isSeller ? <span>Seller</span> : null}
                    {candidate.isBuyer ? <span>Buyer</span> : null}
                    <span>Online now</span>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="rounded-xl px-1 py-1 text-sm text-zinc-400">No people found to mention.</div>
          )}
        </div>
      ) : null}

      <div className="mb-2 flex items-center gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              syncMentionContextFromInput(event.currentTarget);
            }}
            maxLength={180}
            onFocus={() => {
              if (!hasAcceptedRules) {
                onOpenRules();
              }
            }}
            onClick={(event) => {
              syncMentionContextFromInput(event.currentTarget);
            }}
            onKeyUp={(event) => {
              if (
                event.key === "ArrowDown" ||
                event.key === "ArrowUp" ||
                event.key === "Enter" ||
                event.key === "Tab"
              ) {
                return;
              }
              syncMentionContextFromInput(event.currentTarget);
            }}
            onBlur={() => {
              window.setTimeout(() => {
                setMentionContext(null);
              }, 120);
            }}
            onKeyDown={(event) => {
              if (mentionContext && mentionSuggestions.length > 0) {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setActiveMentionIndex((prev) => (prev + 1 >= mentionSuggestions.length ? 0 : prev + 1));
                  return;
                }

                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setActiveMentionIndex((prev) => (prev - 1 < 0 ? mentionSuggestions.length - 1 : prev - 1));
                  return;
                }

                if (event.key === "Enter" || event.key === "Tab") {
                  event.preventDefault();
                  applyMention(mentionSuggestions[activeMentionIndex]);
                  return;
                }

                if (event.key === "Escape") {
                  event.preventDefault();
                  setMentionContext(null);
                  return;
                }
              }

              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              canWrite
                ? "Type your message..."
                : !user
                  ? "Login to write in chat"
                  : isBanned
                    ? "You are banned from global chat."
                    : mutedUntilTs && mutedUntilTs > Date.now()
                      ? `You are muted for ${Math.ceil((mutedUntilTs - Date.now()) / 1000)} seconds.`
                      : closedUntilTs && closedUntilTs > Date.now()
                        ? `This chat is closed`
                        : slowRemainingSeconds > 0
                          ? `Slow mode active`
                          : `You are not ${requiredRoleText || "allowed"} to write here.`
            }
            disabled={
              !canWrite ||
              isSending ||
              isBanned ||
              !!(mutedUntilTs && mutedUntilTs > Date.now()) ||
              !!slowRemainingSeconds ||
              !!(closedUntilTs && closedUntilTs > Date.now())
            }
            className="h-11 w-full rounded-2xl border border-[#2E3547] bg-[#161923] px-3 pr-28 text-base text-white shadow-[0_0_0_1px_rgba(46,53,71,0.06)] placeholder:text-zinc-500 focus:border-[#2E3547] focus:outline-none focus:shadow-[0_0_0_1px_rgba(46,53,71,0.76),0_0_0_4px_rgba(46,53,71,0.12)] disabled:cursor-not-allowed disabled:opacity-40"
          />
          <AnimatePresence>
            {draft.trim().length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-y-1 right-1 flex items-center"
              >
                <Button
                  onClick={handleSend}
                  disabled={!canWrite || isSending}
                  className="h-full px-4 rounded-2xl bg-white text-black hover:bg-zinc-200 flex items-center gap-2 font-medium text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M12 19V5M12 5L5 12M12 5L19 12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Send
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-zinc-300">
        <span className="inline-flex items-center gap-2">
          <svg
            width="256px"
            height="256px"
            viewBox="0 0 24.00 24.00"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            stroke="#b8ffc0"
            strokeWidth="0.40800000000000003"
            className="h-6 w-6"
          >
            <g strokeWidth="0" />
            <g strokeLinecap="round" strokeLinejoin="round" />
            <g>
              <path
                d="M12 9.5C13.3807 9.5 14.5 10.6193 14.5 12C14.5 13.3807 13.3807 14.5 12 14.5C10.6193 14.5 9.5 13.3807 9.5 12C9.5 10.6193 10.6193 9.5 12 9.5Z"
                fill="#04dc3a"
              />
            </g>
          </svg>
          Online: {displayOnlineCount.toLocaleString("en-US")}
        </span>

        {mutedUntilTs && mutedUntilTs > Date.now() ? (
          <span className="text-zinc-400">Muted: {Math.ceil((mutedUntilTs - Date.now()) / 1000)}s</span>
        ) : activeRoom === "help" && slowModeMinutes > 0 ? (
          <span className="text-zinc-400">Slow mode: {slowModeMinutes} min</span>
        ) : !user ? (
          <Link href="/auth?next=/global-chat" className="inline-flex items-center gap-1 text-zinc-300 hover:text-white">
            <LogIn className="h-3.5 w-3.5" />
            Sign in to write
          </Link>
        ) : !canWrite ? (
          <span className="text-zinc-400">
            {isBanned ? "You are banned from global chat." : `You are not ${requiredRoleText || "allowed"} to write here.`}
          </span>
        ) : (
          <span className="text-zinc-400">{draft.length}/180</span>
        )}
      </div>
    </div>
  );
}

