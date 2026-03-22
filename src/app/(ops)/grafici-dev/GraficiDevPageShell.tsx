"use client";

import dynamic from "next/dynamic";

const GraficiDevClient = dynamic(() => import("./GraficiDevClient"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-[#101113] text-zinc-400">
      Loading chart playground...
    </div>
  ),
});

export default function GraficiDevPageShell() {
  return <GraficiDevClient />;
}
