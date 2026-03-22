"use client";

import dynamic from "next/dynamic";

const BecomeSellerPageClient = dynamic(() => import("./BecomeSellerPageClient"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-black text-zinc-400">
      Loading seller onboarding...
    </div>
  ),
});

export default function BecomeSellerPage() {
  return <BecomeSellerPageClient />;
}
