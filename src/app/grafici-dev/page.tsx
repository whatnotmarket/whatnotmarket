import type { Metadata } from "next";

import GraficiDevClient from "./GraficiDevClient";

export const metadata: Metadata = {
  title: "Grafici Dev",
  description: "Playground Lightweight Charts per sviluppo grafici",
};

export default function GraficiDevPage() {
  return <GraficiDevClient />;
}

