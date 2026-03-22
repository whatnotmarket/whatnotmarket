"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ProfileClient } from "@/components/features/profile/ProfileClient";

function normalizeHandleParam(raw: string | null) {
  if (!raw) return null;
  let value = raw.trim();

  for (let i = 0; i < 2; i += 1) {
    try {
      const decoded = decodeURIComponent(value);
      if (decoded === value) break;
      value = decoded;
    } catch {
      break;
    }
  }

  value = value.replace(/^@+/, "");
  value = value.replace(/[^a-zA-Z0-9._-]/g, "");
  return value || null;
}

function ProfileSearchPageContent() {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");
  const routeRole = roleParam === "buyer" || roleParam === "seller" ? roleParam : null;
  const normalizedHandle = normalizeHandleParam(searchParams.get("handle"));

  return (
    <ProfileClient
      key={searchParams.get("id") || normalizedHandle || "default"}
      targetProfileId={searchParams.get("id")}
      targetHandle={normalizedHandle}
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

