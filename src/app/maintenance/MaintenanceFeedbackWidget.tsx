"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { CornerLeftUp, MessageSquareText, SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";

type SubmitState = "idle" | "loading" | "success" | "error";
type MaintenanceTheme = "light" | "dark";

const MIN_FEEDBACK_CHARS = 6;
const MAX_FEEDBACK_CHARS = 1000;
const ROOT_THEME_ATTR = "data-maintenance-theme";

function isTheme(value: string | null): value is MaintenanceTheme {
  return value === "light" || value === "dark";
}

export default function MaintenanceFeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");
  const [theme, setTheme] = useState<MaintenanceTheme>("light");

  const normalized = useMemo(() => feedback.trim(), [feedback]);
  const isBusy = state === "loading";
  const canSubmit =
    normalized.length >= MIN_FEEDBACK_CHARS && normalized.length <= MAX_FEEDBACK_CHARS && !isBusy;
  const isDark = theme === "dark";

  useEffect(() => {
    const root = document.documentElement;
    const attr = root.getAttribute(ROOT_THEME_ATTR);
    const systemTheme: MaintenanceTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    setTheme(isTheme(attr) ? attr : systemTheme);

    const observer = new MutationObserver(() => {
      const current = root.getAttribute(ROOT_THEME_ATTR);
      if (isTheme(current)) setTheme(current);
    });

    observer.observe(root, { attributes: true, attributeFilter: [ROOT_THEME_ATTR] });
    return () => observer.disconnect();
  }, []);

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

  function handleTextareaKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      if (!canSubmit) return;
      void submitFeedback();
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
            className={`h-8 rounded-full px-2.5 text-[12px] font-medium shadow-[0_8px_20px_rgba(0,0,0,0.34)] backdrop-blur-md ${
              isDark
                ? "border border-white/20 bg-[rgba(57,61,69,0.76)] text-zinc-100 hover:bg-[rgba(67,72,82,0.86)]"
                : "border border-[#2d5a89]/25 bg-[rgba(241,248,255,0.88)] text-[#1a3655] hover:bg-[rgba(233,243,252,0.96)]"
            }`}
          >
            <MessageSquareText className="size-3.5" />
            Feedback
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={8}
          className={`w-[min(92vw,420px)] gap-0 rounded-[22px] p-3.5 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl ${
            isDark
              ? "border border-white/15 bg-[#0b1018]/95 text-zinc-100"
              : "border border-[#2d5a89]/25 bg-[#eef8ff]/95 text-[#10263f]"
          }`}
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
              onKeyDown={handleTextareaKeyDown}
              maxLength={MAX_FEEDBACK_CHARS}
              disabled={isBusy}
              placeholder="Write your message..."
              className={`min-h-[112px] resize-none rounded-xl px-3 py-2.5 text-sm leading-relaxed ${
                isDark
                  ? "border border-white/15 bg-[#0f1622]/85 text-zinc-100 placeholder:text-zinc-500 focus-visible:border-white/30 focus-visible:ring-2 focus-visible:ring-white/20"
                  : "border border-[#2d5a89]/25 bg-[#f7fcff]/95 text-[#16314e] placeholder:text-[#5f7f9d] focus-visible:border-[#2d5a89]/45 focus-visible:ring-2 focus-visible:ring-[#2d5a89]/20"
              }`}
            />

            <div className="flex items-center justify-end">
              <Button
                type="submit"
                disabled={!canSubmit}
                className={`h-8 rounded-full px-3.5 text-xs font-semibold ${
                  isDark
                    ? "bg-zinc-100 text-zinc-900 hover:bg-white disabled:bg-zinc-400"
                    : "bg-[#16314e] text-[#f5fbff] hover:bg-[#0f2842] disabled:bg-[#6f89a3]"
                }`}
              >
                Send
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] ${
                    isDark
                      ? "border border-zinc-300 bg-zinc-200 text-zinc-700"
                      : "border border-[#8fb2d1] bg-[#d8ebfa] text-[#24496a]"
                  }`}
                >
                  CTRL
                  <CornerLeftUp className="size-3" />
                </span>
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
