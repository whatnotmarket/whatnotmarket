"use client";

import dynamic from "next/dynamic";

const FeeCalculatorClient = dynamic(
  () => import("./FeeCalculatorClient").then((mod) => mod.FeeCalculatorClient),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-black text-zinc-400">
        Loading fee calculator...
      </div>
    ),
  }
);

export function FeeCalculatorPageShell() {
  return <FeeCalculatorClient />;
}
