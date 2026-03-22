"use client";

import dynamic from "next/dynamic";

const CreateRequestPageClient = dynamic(() => import("./CreateRequestPageClient"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-black text-zinc-400">
      Loading request form...
    </div>
  ),
});

export default function CreateRequestPage() {
  return <CreateRequestPageClient />;
}
