"use client";

import dynamic from "next/dynamic";

const AdminDashboardClient = dynamic(() => import("./AdminDashboardClient"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-black text-zinc-400">
      Loading admin dashboard...
    </div>
  ),
});

export default function AdminTestPage() {
  return <AdminDashboardClient />;
}
