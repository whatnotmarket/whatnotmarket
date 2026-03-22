"use client";

import dynamic from "next/dynamic";

const SellPageClient = dynamic(() => import("./SellPageClient"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-black text-zinc-400">
      Loading sell form...
    </div>
  ),
});

export default function SellPage() {
  return <SellPageClient />;
}
