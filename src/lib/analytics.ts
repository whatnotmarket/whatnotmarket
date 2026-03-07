
"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import posthog from "posthog-js";

type EventProperties = Record<string, string | number | boolean | null | undefined>;

/**
 * Standardized analytics wrapper using PostHog.
 */
class Analytics {
  private static isDev = process.env.NODE_ENV === "development";

  /**
   * Track a specific user action or event.
   */
  static track(eventName: string, properties?: EventProperties) {
    if (this.isDev) {
      console.groupCollapsed(`[Analytics] Track: ${eventName}`);
      console.log(properties);
      console.groupEnd();
    }

    if (typeof window !== "undefined") {
      posthog.capture(eventName, properties);
    }
  }

  /**
   * Identify a user to associate events with their identity.
   */
  static identify(userId: string, traits?: EventProperties) {
    if (this.isDev) {
      console.groupCollapsed(`[Analytics] Identify: ${userId}`);
      console.log(traits);
      console.groupEnd();
    }
    
    if (typeof window !== "undefined") {
      posthog.identify(userId, traits);
    }
  }

  /**
   * Track a page view.
   * Note: PostHog handles this automatically if configured, 
   * but this can be used for virtual views or modals.
   */
  static page(name: string, properties?: EventProperties) {
    if (this.isDev) {
      console.groupCollapsed(`[Analytics] Page: ${name}`);
      console.log(properties);
      console.groupEnd();
    }
    
    if (typeof window !== "undefined") {
      posthog.capture("$pageview", { ...properties, title: name });
    }
  }
}

/**
 * React hook to track page views automatically on route change.
 * Useful if automatic tracking is insufficient or needs custom properties.
 */
export function usePageTracking() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const url = `${pathname}?${searchParams.toString()}`;
    Analytics.page(pathname, { url, search: searchParams.toString() });
  }, [pathname, searchParams]);
}

export const analytics = Analytics;
