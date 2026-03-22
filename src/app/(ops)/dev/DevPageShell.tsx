"use client";

import dynamic from "next/dynamic";

const NewHomePageClient = dynamic(
  () => import("./NewHomePageClient").then((mod) => mod.NewHomePageClient),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-[#111111] text-zinc-400">
        Loading dev preview...
      </div>
    ),
  }
);

export default function DevPageShell() {
  return <NewHomePageClient />;
}
