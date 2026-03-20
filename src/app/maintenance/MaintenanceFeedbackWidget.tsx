"use client";

import { useMemo, useState, type FormEvent } from "react";
import { MessageSquareText, SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";

type SubmitState = "idle" | "loading" | "success" | "error";

const MIN_FEEDBACK_CHARS = 6;
const MAX_FEEDBACK_CHARS = 1000;

export default function MaintenanceFeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  const normalized = useMemo(() => feedback.trim(), [feedback]);
  const isBusy = state === "loading";
  const canSubmit =
    normalized.length >= MIN_FEEDBACK_CHARS && normalized.length <= MAX_FEEDBACK_CHARS && !isBusy;

  const resetStatus = () => {
    if (state === "idle") return;
    setState("idle");
    setMessage("");
  };

  async function submitFeedback() {
    if (!canSubmit) {
      setState("error");
      setMessage(`Write at least ${MIN_FEEDBACK_CHARS} characters.`);
      return;
    }

    setState("loading");
    setMessage("");

    try {
      const response = await fetch("/api/maintenance/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: normalized,
          page: "/maintenance",
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; message?: string; error?: string }
        | null;

      if (!response.ok || !payload?.ok) {
        setState("error");
        setMessage(payload?.error || "Unable to send feedback right now.");
        return;
      }

      setState("success");
      setMessage(payload.message || "Feedback sent. Thank you.");
      setFeedback("");
    } catch {
      setState("error");
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <div
      style={{
        position: "absolute",
        top: "14px",
        left: "14px",
        zIndex: 3,
        width: "fit-content",
        maxWidth: "calc(100% - 90px)",
      }}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            onClick={resetStatus}
            className="h-8 rounded-full border border-white/25 bg-[#1f2a37]/78 px-2.5 text-[12px] font-medium text-zinc-100 shadow-[0_8px_20px_rgba(0,0,0,0.34)] backdrop-blur-md hover:bg-[#263445]/86"
          >
            <MessageSquareText className="size-3.5" />
            Feedback
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={8}
          className="w-[min(92vw,420px)] gap-0 rounded-[22px] border border-white/15 bg-[#0b1018]/95 p-3.5 text-zinc-100 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl"
        >
          <form
            className="flex flex-col gap-2.5"
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              void submitFeedback();
            }}
          >
            <Textarea
              value={feedback}
              onChange={(event) => {
                setFeedback(event.target.value);
                resetStatus();
              }}
              maxLength={MAX_FEEDBACK_CHARS}
              disabled={isBusy}
              placeholder="Write your message..."
              className="min-h-[112px] resize-none rounded-xl border border-white/15 bg-[#0f1622]/85 px-3 py-2.5 text-sm leading-relaxed text-zinc-100 placeholder:text-zinc-500 focus-visible:border-white/30 focus-visible:ring-2 focus-visible:ring-white/20"
            />

            <div className="flex items-center justify-end">
              <Button
                type="submit"
                disabled={!canSubmit}
                className="h-8 rounded-full bg-zinc-100 px-3.5 text-xs font-semibold text-zinc-900 hover:bg-white disabled:bg-zinc-400"
              >
                Send
                <SendHorizontal className="size-3.5" />
              </Button>
            </div>

            {(state !== "idle" || message) && (
              <p
                role="status"
                aria-live="polite"
                className={`m-0 text-xs ${
                  state === "error"
                    ? "text-rose-300"
                    : state === "success"
                      ? "text-emerald-300"
                      : "text-zinc-400"
                }`}
              >
                {message}
              </p>
            )}
          </form>
        </PopoverContent>
      </Popover>
    </div>
  );
}
