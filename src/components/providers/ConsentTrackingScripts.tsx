"use client";

import { useEffect } from "react";

type ConsentState = {
  analytics?: boolean;
  marketing?: boolean;
};

function readConsent(): ConsentState {
  try {
    const raw = localStorage.getItem("cookie-consent");
    if (!raw) return {};
    return JSON.parse(raw) as ConsentState;
  } catch {
    return {};
  }
}

function loadGtag(gaId: string) {
  if (document.querySelector(`script[data-om-ga="${gaId}"]`)) return;

  const script = document.createElement("script");
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  script.async = true;
  script.dataset.omGa = gaId;
  document.head.appendChild(script);

  const init = () => {
    const w = window as Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
    w.dataLayer = w.dataLayer || [];
    w.gtag = w.gtag || function gtag(...args: unknown[]) { w.dataLayer?.push(args); };
    w.gtag("js", new Date());
    w.gtag("config", gaId, { send_page_view: true });
  };

  const idleWindow = window as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  };

  if (typeof idleWindow.requestIdleCallback === "function") {
    idleWindow.requestIdleCallback(init, { timeout: 4000 });
  } else {
    setTimeout(init, 1800);
  }
}

function loadXPixel() {
  if (navigator.doNotTrack === "1") return;
  if (document.querySelector('script[data-om-x-pixel="1"]')) return;

  const script = document.createElement("script");
  script.async = true;
  script.dataset.omXPixel = "1";
  script.text = `
    !function(e,t,n,s,u,a){
      e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);},
      s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,
      u.src='https://static.ads-twitter.com/uwt.js',a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))
    }(window,document,'script');
    twq('config','pl5u0');
    twq('track','PageView');
  `;
  document.head.appendChild(script);
}

export function ConsentTrackingScripts() {
  useEffect(() => {
    const gaId = process.env.NEXT_PUBLIC_GA_ID || "G-6VVJS4Z32J";

    const applyConsent = () => {
      const consent = readConsent();
      if (consent.analytics) {
        loadGtag(gaId);
      }
      if (consent.marketing) {
        loadXPixel();
      }
    };

    applyConsent();
    window.addEventListener("cookie-consent-updated", applyConsent);

    return () => {
      window.removeEventListener("cookie-consent-updated", applyConsent);
    };
  }, []);

  return null;
}
