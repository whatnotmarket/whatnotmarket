"use client";

import { HomepagePrivacyCard } from "@/components/features/homepage/HomepagePrivacyCard";
import { usePathname } from "next/navigation";

export function PrivacyCardWrapper() {
  const pathname = usePathname();

  if (pathname === "/link") return null;

  return <HomepagePrivacyCard />;
}

