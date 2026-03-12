"use client";

import { usePathname } from "next/navigation";
import { PrivacyCard } from "@/components/global-chat/PrivacyCard";

export function PrivacyCardWrapper() {
  const pathname = usePathname();

  if (pathname === "/link") return null;

  return <PrivacyCard />;
}

