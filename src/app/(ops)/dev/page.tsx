import type { Metadata } from "next";
import DevPageShell from "./DevPageShell";

export const metadata: Metadata = {
  title: "New Homepage Draft",
  description: "Work-in-progress redesign for the OpenlyMarket homepage.",
};

export default function NewHomePage() {
  return <DevPageShell />;
}
