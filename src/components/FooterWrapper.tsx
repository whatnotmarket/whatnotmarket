"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/Footer";

export function FooterWrapper() {
  const pathname = usePathname();
  
  if (pathname === "/link") {
    return null;
  }

  return <Footer />;
}
