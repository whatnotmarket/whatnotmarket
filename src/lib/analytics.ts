
"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

type EventProperties = Record<string, string | number | boolean | null | undefined>;

/**
 * Standardized analytics wrapper.
 * Currently logs to console in development and can be extended to support
 * Vercel Analytics custom events, PostHog, Segment, or Google Analytics.
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

    // TODO: Integrate with Vercel Analytics or other providers here
    // Example: va.track(eventName, properties);
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
    
    // TODO: Integrate with Vercel Analytics or other providers here
  }

  /**
   * Track a page view.
   * Note: Next.js / Vercel Analytics handles this automatically for route changes,
   * but manual tracking might be needed for virtual views or modals.
   */
  static page(name: string, properties?: EventProperties) {
    if (this.isDev) {
      console.groupCollapsed(`[Analytics] Page: ${name}`);
      console.log(properties);
      console.groupEnd();
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
