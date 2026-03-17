"use client";

import { usePathname } from "next/navigation";
import { HomepagePrivacyCard } from "@/components/homepage/HomepagePrivacyCard";

export function PrivacyCardWrapper() {
  const pathname = usePathname();

  if (pathname === "/link") return null;

  return <HomepagePrivacyCard />;
}
