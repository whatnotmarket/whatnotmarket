"use client";

import { useEffect } from "react";

const SHORTCUT_LINKS: Record<string, string> = {
  x: "https://x.com/openlymarket",
  g: "https://github.com/openlymarket",
  r: "https://www.reddit.com/",
  p: "https://paragraph.xyz/",
};

export default function MaintenanceSocialShortcuts() {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const isTypingTarget =
        !!target &&
        (target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT");
      if (isTypingTarget) return;

      const key = event.key.toLowerCase();
      const href = SHORTCUT_LINKS[key];
      if (!href) return;

      event.preventDefault();
      window.open(href, "_blank", "noopener,noreferrer");
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return null;
}

