"use client";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function HomepageRulesCard({
  onClose,
  onAccept,
}: {
  onClose: () => void;
  onAccept: () => void;
}) {
  return (
    <div
      className="mb-2 rounded-2xl border-2 border-[var(--gc-border)] bg-[var(--gc-chat-panel)] px-3 py-3 text-sm text-[var(--gc-text-secondary)]"
      style={{ backgroundColor: "var(--gc-chat-panel)", backgroundImage: "none", opacity: 1 }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[var(--gc-text-primary)] font-semibold">Chat Rules</span>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[var(--gc-border)] bg-[var(--gc-surface)] text-[var(--gc-text-primary)] transition hover:bg-[var(--gc-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gc-border)]"
          style={{ backgroundColor: "var(--gc-surface)", backgroundImage: "none", opacity: 1 }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <ul className="mt-2 list-disc pl-5 space-y-1">
        <li>No spamming</li>
        <li>No advertising</li>
        <li>Zero tolerance for harassment</li>
        <li>No slandering website, staff, or other players</li>
        <li>No sharing of socials or personal info</li>
        <li>No posting external links</li>
      </ul>
      <div className="mt-3">
        <Button
          onClick={onAccept}
          className="w-full py-3 px-4 rounded-2xl bg-[var(--gc-button-primary-bg)] text-[var(--gc-button-primary-text)] hover:bg-[var(--gc-button-primary-hover-bg)]"
          style={{ backgroundColor: "var(--gc-button-primary-bg)", color: "var(--gc-button-primary-text)", opacity: 1 }}
        >
          Accept Rules
        </Button>
      </div>
    </div>
  );
}


