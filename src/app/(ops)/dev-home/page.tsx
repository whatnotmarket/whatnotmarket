import type { Metadata } from "next";
import DevHomeNoSSR from "./DevHomeNoSSR";

export const metadata: Metadata = {
  title: "Dev Home Sidebar",
  description: "Sidebar-only development surface.",
};

export default function DevHomePage() {
  return <DevHomeNoSSR />;
}
