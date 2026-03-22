"use client";

import dynamic from "next/dynamic";

const PromoteListingsPageClient = dynamic(() => import("./PromoteListingsPageClient"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-black text-zinc-400">
      Loading promotion tools...
    </div>
  ),
});

export default function PromoteListingsPage() {
  return <PromoteListingsPageClient />;
}
