"use client";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function GlobalChatRulesCard({
  onClose,
  onAccept,
}: {
  onClose: () => void;
  onAccept: () => void;
}) {
  return (
    <div className="mb-2 rounded-2xl border border-[#2E3547] bg-[#161923] px-3 py-3 text-sm text-zinc-300">
      <div className="flex items-center justify-between">
        <span className="text-white font-semibold">Chat Rules</span>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-[#2E3547] hover:text-white"
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
        <Button onClick={onAccept} className="w-full py-3 px-4 rounded-2xl bg-white text-black hover:bg-zinc-200">
          Accept Rules
        </Button>
      </div>
    </div>
  );
}

