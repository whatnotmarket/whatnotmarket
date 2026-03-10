"use client";

import { useEffect, useMemo, useRef } from "react";
import * as ackeeTracker from "ackee-tracker";
import { usePathname, useSearchParams } from "next/navigation";

export default function AckeeTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const trackerRef = useRef<ReturnType<typeof ackeeTracker.create> | null>(null);

  const domainId = process.env.NEXT_PUBLIC_ACKEE_DOMAIN_ID || "";
  const serverUrl = process.env.NEXT_PUBLIC_ACKEE_SERVER_URL || "";
  const detailed = (process.env.NEXT_PUBLIC_ACKEE_DETAILED || "false").toLowerCase() === "true";

  const pageUrl = useMemo(() => {
    const query = searchParams?.toString();
    return query ? `${pathname}?${query}` : pathname || "/";
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!domainId || !serverUrl) return;
    if (trackerRef.current) return;

    trackerRef.current = ackeeTracker.create(
      serverUrl,
      {
        detailed,
        ignoreLocalhost: true,
        ignoreOwnVisits: true,
      },
      { key: domainId }
    );
    try {
      const location = typeof window !== "undefined" ? window.location.href : pageUrl;
      const referrer = typeof document !== "undefined" ? document.referrer : "";
      trackerRef.current.record({ siteLocation: location, siteReferrer: referrer });
    } catch {}
  }, [domainId, serverUrl, detailed]);

  useEffect(() => {
    if (!trackerRef.current) return;
    try {
      const location = typeof window !== "undefined" ? window.location.href : pageUrl;
      const referrer = typeof document !== "undefined" ? document.referrer : "";
      trackerRef.current.record({ siteLocation: location, siteReferrer: referrer });
    } catch {}
  }, [pageUrl]);

  return null;
}
