"use client";

import { useEffect } from "react";

const isEnabled = (value: string | undefined) => value === "true";

type WindowWithIdle = Window & {
  requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
  cancelIdleCallback?: (handle: number) => void;
};

type ConsentState = {
  analytics?: boolean;
};

function hasAnalyticsConsent() {
  try {
    const raw = localStorage.getItem("cookie-consent");
    if (!raw) return false;
    const parsed = JSON.parse(raw) as ConsentState;
    return Boolean(parsed.analytics);
  } catch {
    return false;
  }
}

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
    let initialized = false;

    const init = async () => {
      if (cancelled || initialized || !hasAnalyticsConsent()) return;

      const posthogModule = await import("posthog-js");
      if (cancelled || initialized || !hasAnalyticsConsent()) return;

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
      initialized = true;
    };

    const scheduleInit = () => {
      if (initialized || !hasAnalyticsConsent()) return;
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

    const onConsentUpdate = () => {
      scheduleInit();
    };

    window.addEventListener("pointerdown", kickoff, { once: true, passive: true });
    window.addEventListener("keydown", kickoff, { once: true, passive: true });
    window.addEventListener("scroll", kickoff, { once: true, passive: true });
    window.addEventListener("cookie-consent-updated", onConsentUpdate);

    scheduleInit();

    return () => {
      cancelled = true;
      window.removeEventListener("pointerdown", kickoff);
      window.removeEventListener("keydown", kickoff);
      window.removeEventListener("scroll", kickoff);
      window.removeEventListener("cookie-consent-updated", onConsentUpdate);
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
