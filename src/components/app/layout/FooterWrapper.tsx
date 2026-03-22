"use client";

import { Footer } from "@/components/app/layout/Footer";
import { usePathname } from "next/navigation";

export function FooterWrapper() {
  const pathname = usePathname();
  
  if (pathname === "/link") {
    return null;
  }

  return <Footer />;
}

