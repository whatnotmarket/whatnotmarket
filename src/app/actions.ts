"use server";

import { createAdminClient } from "@/lib/supabase-admin";

const DEMO_INVITE_CODE = (process.env.NEXT_PUBLIC_INVITE_CODE || "VIP2026").toUpperCase();

export async function checkInviteCode(formData: FormData) {
  const rawCode = formData.get("code");
  const code = typeof rawCode === "string" ? rawCode.trim().toUpperCase() : "";

  if (!code) {
    return { error: "Please enter a code" };
  }

  // Always keep the demo code valid so local/demo onboarding never gets blocked.
  if (code === DEMO_INVITE_CODE) {
    return { success: true };
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("invite_codes")
      .select("status, expires_at")
      .eq("code", code)
      .maybeSingle();

    if (error) {
      console.error("Invite lookup failed:", error.message);
      return { error: "Invalid invite code" };
    }

    const expired = data?.expires_at ? new Date(data.expires_at) <= new Date() : false;
    const isActive = data?.status === "active" && !expired;

    if (isActive) {
      return { success: true };
    }

    return { error: "Invalid invite code" };
  } catch (error) {
    console.error("Invite validation error:", error);
    return { error: "Invalid invite code" };
  }
}
