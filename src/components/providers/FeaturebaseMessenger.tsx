"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";

const FEATUREBASE_APP_ID = "69b30ec8f7bdc95c4df9518f";

type FeaturebaseBootPayload = {
  appId: string;
  theme?: "light" | "dark";
  language?: string;
};

type FeaturebaseFn = ((...args: unknown[]) => void) & {
  q?: unknown[][];
  _booted?: boolean;
};

declare global {
  interface Window {
    Featurebase?: FeaturebaseFn;
  }
}

export function FeaturebaseMessenger() {
  const pathname = usePathname();
  const isGlobalChatRoute = pathname === "/global-chat";

  useEffect(() => {
    if (isGlobalChatRoute) return;

    const win = window;

    if (typeof win.Featurebase !== "function") {
      const stub: FeaturebaseFn = (...args: unknown[]) => {
        stub.q = stub.q || [];
        stub.q.push(args);
      };
      win.Featurebase = stub;
    }

    if (win.Featurebase._booted) return;

    const language = document.documentElement.lang?.split("-")[0] || "en";
    const payload: FeaturebaseBootPayload = {
      appId: FEATUREBASE_APP_ID,
      theme: "dark",
      language,
    };

    win.Featurebase("boot", payload);
    win.Featurebase._booted = true;
  }, [isGlobalChatRoute]);

  if (isGlobalChatRoute) {
    return null;
  }

  return <Script src="https://do.featurebase.app/js/sdk.js" id="featurebase-sdk" strategy="afterInteractive" />;
}
