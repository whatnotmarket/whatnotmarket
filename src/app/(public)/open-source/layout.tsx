import type { Metadata } from "next";
import { buildIndexableMetadata } from "@/lib/app/seo/seo";

export const metadata: Metadata = buildIndexableMetadata({
  title: "Open Source Projects and Community Resources",
  description:
    "Explore OpenlyMarket open source initiatives, developer resources, and community contributions that support transparent marketplace infrastructure.",
  path: "/open-source",
});

export default function OpenSourceLayout({ children }: { children: React.ReactNode }) {
  return children;
}

