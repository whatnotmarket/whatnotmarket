"use client";

import dynamic from "next/dynamic";
import type { CopyWebsite } from "@/types/copy-website";

const CopyAdminClient = dynamic(() => import("./client").then((mod) => mod.CopyAdminClient), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[300px] items-center justify-center text-zinc-500">
      Loading copy admin...
    </div>
  ),
});

export function CopyAdminClientShell({ items }: { items: CopyWebsite[] }) {
  return <CopyAdminClient items={items} />;
}
