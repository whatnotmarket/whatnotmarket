import type { Metadata } from "next";
import { NewHomePageClient } from "./NewHomePageClient";

export const metadata: Metadata = {
  title: "New Homepage Draft",
  description: "Work-in-progress redesign for the OpenlyMarket homepage.",
};

export default function NewHomePage() {
  return <NewHomePageClient />;
}
