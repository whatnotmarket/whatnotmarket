"use client";

import { useEffect } from "react";

const isEnabled = (value: string | undefined) => value === "true";

type WindowWithIdle = Window & {
  requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
  cancelIdleCallback?: (handle: number) => void;
};

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

    if (!key || !host) {
      return;
    }

    const win = window as WindowWithIdle;
    let cancelled = false;
    let idleTimer: number | null = null;

    const init = async () => {
      if (cancelled) return;

      const posthogModule = await import("posthog-js");
      if (cancelled) return;

      const posthog = posthogModule.default;
      posthog.init(key, {
        api_host: host,
        person_profiles: "identified_only",
        capture_pageview: false,
        capture_pageleave: true,
        autocapture: true,
        disable_session_recording: !isEnabled(process.env.NEXT_PUBLIC_POSTHOG_ENABLE_SESSION_RECORDING),
        disable_surveys: !isEnabled(process.env.NEXT_PUBLIC_POSTHOG_ENABLE_SURVEYS),
        capture_dead_clicks: isEnabled(process.env.NEXT_PUBLIC_POSTHOG_ENABLE_DEAD_CLICKS),
        capture_performance: isEnabled(process.env.NEXT_PUBLIC_POSTHOG_ENABLE_WEB_VITALS),
      });
    };

    const scheduleInit = () => {
      if (typeof win.requestIdleCallback === "function") {
        idleTimer = win.requestIdleCallback(
          () => {
            void init();
          },
          { timeout: 3000 }
        );
      } else {
        idleTimer = window.setTimeout(() => {
          void init();
        }, 1800);
      }
    };

    const kickoff = () => {
      scheduleInit();
      window.removeEventListener("pointerdown", kickoff);
      window.removeEventListener("keydown", kickoff);
      window.removeEventListener("scroll", kickoff);
    };

    window.addEventListener("pointerdown", kickoff, { once: true, passive: true });
    window.addEventListener("keydown", kickoff, { once: true, passive: true });
    window.addEventListener("scroll", kickoff, { once: true, passive: true });

    scheduleInit();

    return () => {
      cancelled = true;
      window.removeEventListener("pointerdown", kickoff);
      window.removeEventListener("keydown", kickoff);
      window.removeEventListener("scroll", kickoff);
      if (idleTimer !== null) {
        if (typeof win.cancelIdleCallback === "function") {
          win.cancelIdleCallback(idleTimer);
        } else {
          clearTimeout(idleTimer);
        }
      }
    };
  }, []);

  return <>{children}</>;
}
