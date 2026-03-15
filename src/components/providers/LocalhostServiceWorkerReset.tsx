"use client";

import { useEffect } from "react";

const LOCALHOST_NAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);
const RESET_MARKER_KEY = "openlymarket-localhost-sw-reset-v1";

async function resetLocalhostCaches() {
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(registrations.map((registration) => registration.unregister()));

  if ("caches" in window) {
    const cacheKeys = await caches.keys();
    await Promise.allSettled(cacheKeys.map((cacheKey) => caches.delete(cacheKey)));
  }
}

export function LocalhostServiceWorkerReset() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!LOCALHOST_NAMES.has(window.location.hostname)) return;
    if (window.sessionStorage.getItem(RESET_MARKER_KEY) === "1") return;
    if (!("serviceWorker" in navigator)) return;

    void resetLocalhostCaches()
      .catch(() => {
        // Ignore cleanup failures in development.
      })
      .finally(() => {
        window.sessionStorage.setItem(RESET_MARKER_KEY, "1");
      });
  }, []);

  return null;
}
