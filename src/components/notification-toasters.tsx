"use client";

import { useEffect } from "react";
import { Toaster } from "sileo";

export default function NotificationToasters() {
  useEffect(() => {
    void import("sileo/styles.css");
  }, []);

  return (
    <Toaster
      position="top-center"
      offset={{ top: 20, right: 20, bottom: 20, left: 20 }}
      options={{
        roundness: 16,
        fill: "#111827",
        duration: 4200,
        autopilot: { expand: 180, collapse: 3000 },
      }}
    />
  );
}
