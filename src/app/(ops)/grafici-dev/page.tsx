import type { Metadata } from "next";
import GraficiDevPageShell from "./GraficiDevPageShell";

export const metadata: Metadata = {
  title: "Grafici Dev",
  description: "Playground Lightweight Charts per sviluppo grafici",
};

export default function GraficiDevPage() {
  return <GraficiDevPageShell />;
}
