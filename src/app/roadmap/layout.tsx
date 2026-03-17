import type { Metadata } from "next";
import { buildIndexableMetadata } from "@/lib/seo";

export const metadata: Metadata = buildIndexableMetadata({
  title: "OpenlyMarket Product Roadmap and Upcoming Features",
  description:
    "Track OpenlyMarket roadmap priorities, upcoming releases, and planned improvements across trust, search, seller tooling, and marketplace automation.",
  path: "/roadmap",
});

export default function RoadmapLayout({ children }: { children: React.ReactNode }) {
  return children;
}

