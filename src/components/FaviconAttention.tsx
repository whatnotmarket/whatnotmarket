"use client";

import { useEffect } from "react";

const DARK_BACKGROUND_FAVICON = "/images/ico/faviconbase.ico";
const LIGHT_BACKGROUND_FAVICON = "/images/ico/faviconbianco.ico";
const FAVICON_TOGGLE_MS = 900;
const FAVICON_VERSION = "v1";

function withVersion(path: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${FAVICON_VERSION}`;
}

function ensureManagedLink(rel: "icon" | "shortcut icon") {
  const existing = document.querySelector<HTMLLinkElement>(
    `link[data-managed-favicon="${rel}"]`
  );

  if (existing) return existing;

  const link = document.createElement("link");
  link.rel = rel;
  link.type = "image/x-icon";
  link.dataset.managedFavicon = rel;
  document.head.appendChild(link);
  return link;
}

function setFavicon(path: string) {
  const href = withVersion(path);
  ensureManagedLink("icon").href = href;
  ensureManagedLink("shortcut icon").href = href;
}

function isDarkSchemeActive() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function getActiveThemeFavicon() {
  return isDarkSchemeActive() ? LIGHT_BACKGROUND_FAVICON : DARK_BACKGROUND_FAVICON;
}

function getAlternateThemeFavicon() {
  return isDarkSchemeActive() ? DARK_BACKGROUND_FAVICON : LIGHT_BACKGROUND_FAVICON;
}

export function FaviconAttention() {
  useEffect(() => {
    let toggleTimer: number | null = null;
    const colorSchemeMedia = window.matchMedia("(prefers-color-scheme: dark)");

    const stopAttention = () => {
      if (toggleTimer !== null) {
        window.clearInterval(toggleTimer);
        toggleTimer = null;
      }
    };

    const startAttention = () => {
      stopAttention();
      let showAlternate = true;
      setFavicon(getAlternateThemeFavicon());

      toggleTimer = window.setInterval(() => {
        setFavicon(showAlternate ? getActiveThemeFavicon() : getAlternateThemeFavicon());
        showAlternate = !showAlternate;
      }, FAVICON_TOGGLE_MS);
    };

    const applyForCurrentState = () => {
      if (document.hidden) {
        startAttention();
        return;
      }

      stopAttention();
      setFavicon(getActiveThemeFavicon());
    };

    applyForCurrentState();
    document.addEventListener("visibilitychange", applyForCurrentState);

    if (typeof colorSchemeMedia.addEventListener === "function") {
      colorSchemeMedia.addEventListener("change", applyForCurrentState);
    } else {
      colorSchemeMedia.addListener(applyForCurrentState);
    }

    return () => {
      stopAttention();
      document.removeEventListener("visibilitychange", applyForCurrentState);
      if (typeof colorSchemeMedia.removeEventListener === "function") {
        colorSchemeMedia.removeEventListener("change", applyForCurrentState);
      } else {
        colorSchemeMedia.removeListener(applyForCurrentState);
      }
      setFavicon(getActiveThemeFavicon());
    };
  }, []);

  return null;
}
