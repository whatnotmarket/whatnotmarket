"use client";

import { Squircle } from "@/components/ui/Squircle";
import { useEffect } from "react";

const HOMEPAGE_LAYOUT_SCROLL_CLASS = "homepage-layout-scrollbar-match";
const SHELL_GAP = "clamp(24px, 4vw, 60px)";

export default function Homepage() {
  useEffect(() => {
    const appRootShell = document.getElementById("app-root-shell");
    document.documentElement.classList.add(HOMEPAGE_LAYOUT_SCROLL_CLASS);
    document.body.classList.add(HOMEPAGE_LAYOUT_SCROLL_CLASS);
    appRootShell?.classList.add(HOMEPAGE_LAYOUT_SCROLL_CLASS);

    return () => {
      document.documentElement.classList.remove(HOMEPAGE_LAYOUT_SCROLL_CLASS);
      document.body.classList.remove(HOMEPAGE_LAYOUT_SCROLL_CLASS);
      appRootShell?.classList.remove(HOMEPAGE_LAYOUT_SCROLL_CLASS);
    };
  }, []);

  return (
    <main className="min-h-screen w-full" style={{ backgroundColor: "#15191D", padding: `${SHELL_GAP} ${SHELL_GAP} 0` }}>
      <Squircle
        className="w-full"
        innerClassName="w-full"
        radius={44}
        smoothing={1}
        corners="top"
        style={{
          minHeight: `calc(100dvh - ${SHELL_GAP})`,
        }}
      >
        <div className="min-h-[inherit] w-full bg-[rgb(30_36_40_/_43%)]" />
      </Squircle>
    </main>
  );
}
