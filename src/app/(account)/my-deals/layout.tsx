import type { Metadata } from "next";
import { NOINDEX_METADATA } from "@/lib/app/seo/seo";

export const metadata: Metadata = NOINDEX_METADATA;

export default function MyDealsLayout({ children }: { children: React.ReactNode }) {
  return children;
}


