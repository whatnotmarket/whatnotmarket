"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ProfileClient } from "@/components/profile/ProfileClient";

function ProfileSearchPageContent() {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");
  const routeRole = roleParam === "buyer" || roleParam === "seller" ? roleParam : null;

  return (
    <ProfileClient
      targetProfileId={searchParams.get("id")}
      targetHandle={searchParams.get("handle")}
      routeRole={routeRole}
    />
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white" />}>
      <ProfileSearchPageContent />
    </Suspense>
  );
}
