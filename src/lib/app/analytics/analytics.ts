"use client";

import { usePathname,useSearchParams } from "next/navigation";
import { useEffect } from "react";

type EventProperties = Record<string, string | number | boolean | null | undefined>;

type PostHogClient = {
  capture: (eventName: string, properties?: EventProperties) => void;
  identify: (userId: string, traits?: EventProperties) => void;
};

let clientPromise: Promise<PostHogClient | null> | null = null;

async function getPosthogClient(): Promise<PostHogClient | null> {
  if (typeof window === "undefined") return null;
  if (!clientPromise) {
    clientPromise = import("posthog-js")
      .then((mod) => mod.default as unknown as PostHogClient)
      .catch(() => null);
  }
  return clientPromise;
}

class Analytics {
  private static isDev = process.env.NODE_ENV === "development";

  static async track(eventName: string, properties?: EventProperties) {
    if (this.isDev) {
      console.groupCollapsed(`[Analytics] Track: ${eventName}`);
      console.log(properties);
      console.groupEnd();
    }

    const client = await getPosthogClient();
    client?.capture(eventName, properties);
  }

  static async identify(userId: string, traits?: EventProperties) {
    if (this.isDev) {
      console.groupCollapsed(`[Analytics] Identify: ${userId}`);
      console.log(traits);
      console.groupEnd();
    }

    const client = await getPosthogClient();
    client?.identify(userId, traits);
  }

  static async page(name: string, properties?: EventProperties) {
    if (this.isDev) {
      console.groupCollapsed(`[Analytics] Page: ${name}`);
      console.log(properties);
      console.groupEnd();
    }

    const client = await getPosthogClient();
    client?.capture("$pageview", { ...properties, title: name });
  }
}

export function usePageTracking() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const url = `${pathname}?${searchParams.toString()}`;
    void Analytics.page(pathname, { url, search: searchParams.toString() });
  }, [pathname, searchParams]);
}

export const analytics = Analytics;
