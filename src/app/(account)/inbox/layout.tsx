import { NOINDEX_METADATA } from "@/lib/app/seo/seo";
import type { Metadata } from "next";

export const metadata: Metadata = NOINDEX_METADATA;

export default function InboxLayout({ children }: { children: React.ReactNode }) {
  return children;
}


