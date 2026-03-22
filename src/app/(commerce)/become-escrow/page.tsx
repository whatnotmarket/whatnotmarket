"use client";

import dynamic from "next/dynamic";

const BecomeEscrowPageClient = dynamic(() => import("./BecomeEscrowPageClient"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-black text-zinc-400">
      Loading escrow onboarding...
    </div>
  ),
});

export default function BecomeEscrowPage() {
  return <BecomeEscrowPageClient />;
}
