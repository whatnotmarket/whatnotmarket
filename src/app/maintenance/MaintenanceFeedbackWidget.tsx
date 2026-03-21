"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { CornerLeftUp } from "lucide-react";
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

function FeedbackMessageIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={className} fill="none">
      <path
        d="M380.872728,808.94 C380.872728,810.045 379.977728,810.94 378.872728,810.94 C377.767728,810.94 376.872728,810.045 376.872728,808.94 C376.872728,807.835 377.767728,806.94 378.872728,806.94 C379.977728,806.94 380.872728,807.835 380.872728,808.94 M375.872728,808.94 C375.872728,810.045 374.977728,810.94 373.872728,810.94 C372.767728,810.94 371.872728,810.045 371.872728,808.94 C371.872728,807.835 372.767728,806.94 373.872728,806.94 C374.977728,806.94 375.872728,807.835 375.872728,808.94 M370.872728,808.94 C370.872728,810.045 369.977728,810.94 368.872728,810.94 C367.767728,810.94 366.872728,810.045 366.872728,808.94 C366.872728,807.835 367.767728,806.94 368.872728,806.94 C369.977728,806.94 370.872728,807.835 370.872728,808.94 M381.441728,817 C381.441728,817 378.825728,816.257 377.018728,816.257 C375.544728,816.257 375.208728,816.518 373.957728,816.518 C369.877728,816.518 366.581728,813.508 366.075728,809.851 C365.403728,804.997 369.268728,800.999 373.957728,801 C377.900728,801 381.002728,803.703 381.732728,807.083 C382.000728,808.318 381.973728,809.544 381.654728,810.726 C381.274728,812.131 381.291728,813.711 381.703728,815.294 C381.914728,816.103 382.302728,817 381.441728,817 M383.917728,815.859 C383.917728,815.859 383.640728,814.794 383.639728,814.79 C383.336728,813.63 383.271728,812.405 383.584728,811.248 C383.970728,809.822 384.035728,808.268 383.687728,806.66 C382.767728,802.405 378.861728,799 373.957728,799 C367.999728,798.999 363.264728,804.127 364.094728,810.125 C364.736728,814.766 368.870728,818.518 373.957728,818.518 C375.426728,818.518 375.722728,818.257 377.019728,818.257 C378.583728,818.257 380.795728,818.919 380.795728,818.919 C382.683728,819.392 384.399728,817.71 383.917728,815.859"
        transform="translate(-364 -799)"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function MaintenanceFeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");
  const [theme, setTheme] = useState<MaintenanceTheme>("light");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

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

  useEffect(() => {
    const onOpenFromShortcut = () => {
      setOpen(true);
      window.requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    };

    const onGlobalKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key.toLowerCase() !== "f") return;

      const target = event.target as HTMLElement | null;
      const isTypingTarget =
        !!target &&
        (target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT");
      if (isTypingTarget) return;

      event.preventDefault();
      onOpenFromShortcut();
    };

    window.addEventListener("maintenance-feedback-open", onOpenFromShortcut as EventListener);
    window.addEventListener("keydown", onGlobalKeyDown);
    return () => {
      window.removeEventListener("maintenance-feedback-open", onOpenFromShortcut as EventListener);
      window.removeEventListener("keydown", onGlobalKeyDown);
    };
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
      setMessage("Feedback received. We will handle it shortly.");
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
        top: "18px",
        left: "18px",
        zIndex: 3,
        width: "fit-content",
        maxWidth: "calc(100% - 90px)",
      }}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            onClick={resetStatus}
            className="group inline-flex h-[41px] items-center gap-2 rounded-full px-3.5 text-zinc-100 transition-[transform] duration-150 hover:text-zinc-100 active:text-zinc-100 data-[state=open]:text-zinc-100 focus-visible:outline-none focus-visible:ring-0 focus-visible:text-zinc-100"
            style={{
              border: "1px solid rgba(255, 255, 255, 0.2)",
              background: "rgba(57, 61, 69, 0.76)",
              backdropFilter: "blur(12px) saturate(125%)",
              WebkitBackdropFilter: "blur(12px) saturate(125%)",
              boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 10px 24px rgba(0, 0, 0, 0.34)",
            }}
          >
            <FeedbackMessageIcon className="size-[17px] transition-transform duration-200 ease-out group-hover:scale-115 group-focus-visible:scale-115" />
            <span className="text-[14px] font-semibold leading-none">Feedback</span>
            <span className="ml-1 inline-flex h-[24px] min-w-[24px] items-center justify-center rounded-full border border-white/25 bg-[linear-gradient(170deg,rgba(255,255,255,0.16),rgba(255,255,255,0.08))] px-1 text-[12px] font-semibold leading-none text-[#f8fbff] shadow-[inset_0_1px_0_rgba(255,255,255,0.24),0_4px_10px_rgba(0,0,0,0.24)]">
              F
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={8}
          className={`w-[min(92vw,420px)] gap-0 rounded-[22px] p-3.5 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl ${
            isDark
              ? "border border-white/15 bg-[#181818]/95 text-zinc-100"
              : "border border-white/15 bg-[#181818]/95 text-zinc-100"
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
              ref={textareaRef}
              value={feedback}
              onChange={(event) => {
                setFeedback(event.target.value);
                resetStatus();
              }}
              onKeyDown={handleTextareaKeyDown}
              maxLength={MAX_FEEDBACK_CHARS}
              disabled={isBusy}
              placeholder="Have a suggestion or a feedback? We'll keep it in mind and make it happen. Our team will handle it"
              className="min-h-[112px] resize-none rounded-xl border border-[rgba(255,255,255,0.2)] bg-[rgba(57,61,69,0.76)] px-3 py-2.5 text-sm leading-relaxed text-zinc-100 placeholder:text-zinc-600 backdrop-blur-[12px] shadow-[inset_0_1px_0_rgba(255,255,255,0)] focus:!outline-none focus-visible:border-white/25 focus-visible:shadow-[inset_0_1px_0_rgba(255,255,255,0.24)] focus-visible:!ring-0 focus-visible:!outline-none"
            />

            <div className="w-full">
              <Button
                type="submit"
                disabled={!canSubmit}
                className="h-9 w-full justify-center gap-2 rounded-full border border-white/25 bg-[#222222] px-4 text-sm font-semibold text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.24)] hover:bg-[#222222] hover:text-zinc-100 active:bg-[#222222] active:text-zinc-100 focus-visible:border-white/25 focus-visible:bg-[#222222] focus-visible:text-zinc-100 focus-visible:shadow-[inset_0_1px_0_rgba(255,255,255,0.24)] focus-visible:ring-0 disabled:border-[rgba(255,255,255,0.12)] disabled:bg-[rgba(34,34,34,0.55)] disabled:text-zinc-400 disabled:shadow-none"
              >
                Send Feedback
                <span
                  className="inline-flex h-[24px] items-center justify-center gap-1 rounded-full border border-white/25 bg-[linear-gradient(170deg,rgba(255,255,255,0.16),rgba(255,255,255,0.08))] px-2 text-[11px] font-semibold leading-none text-[#f8fbff] shadow-[inset_0_1px_0_rgba(255,255,255,0.24),0_4px_10px_rgba(0,0,0,0.24)]"
                >
                  CTRL
                  <CornerLeftUp className="size-3.5" />
                </span>
              </Button>
            </div>

            {(state !== "idle" || message) && (
              <div
                role="status"
                aria-live="polite"
                className={`m-0 rounded-[12px] border px-3 py-2 text-xs leading-relaxed ${
                  state === "success"
                    ? isDark
                      ? "border-[rgba(16,185,129,0.45)] bg-[rgba(16,185,129,0.2)] text-[#c6f6d5]"
                      : "border-[rgba(22,101,52,0.35)] bg-[rgba(134,239,172,0.36)] text-[#134e29]"
                    : state === "error"
                      ? isDark
                        ? "border-[rgba(248,113,113,0.45)] bg-[rgba(239,68,68,0.2)] text-[#ffd4d4]"
                        : "border-[rgba(153,27,27,0.35)] bg-[rgba(252,165,165,0.38)] text-[#7f1d1d]"
                      : "border-transparent bg-transparent text-zinc-400"
                }`}
              >
                {message}
              </div>
            )}
          </form>
        </PopoverContent>
      </Popover>
    </div>
  );
}
