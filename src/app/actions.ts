"use server";

import { redirect } from "next/navigation";

export async function checkInviteCode(formData: FormData) {
  const code = formData.get("code") as string;

  if (!code) {
    return { error: "Please enter a code" };
  }

  // MVP: Hardcoded check for demo if DB not ready
  // In production, query Supabase
  if (code === "VIP2026") {
    return { success: true };
  }

  return { error: "Invalid invite code" };
}
