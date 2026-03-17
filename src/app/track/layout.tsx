import type { Metadata } from "next";
import { NOINDEX_METADATA } from "@/lib/seo";

export const metadata: Metadata = NOINDEX_METADATA;

export default function TrackLayout({ children }: { children: React.ReactNode }) {
  return children;
}

