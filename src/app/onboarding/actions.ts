"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

export async function updateRolePreference(role: "buyer" | "seller" | "both") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("profiles")
    .update({ 
      role_preference: role,
      // If buyer only, we mark onboarding as completed immediately
      onboarding_status: role === "buyer" ? "completed" : "started"
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/onboarding");
  return { success: true };
}

export async function submitPayoutInfo(data: {
  address: string;
  network: string;
  currency: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("profiles")
    .update({
      payout_address: data.address,
      payout_network: data.network,
      payout_currency: data.currency,
      fee_acknowledged_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  return { success: true };
}

// Mock function to simulate Telegram bot generating a code
// In production, this would be handled by a separate bot service
export async function generateMockTelegramCode() {
  const code = "TG-" + Math.random().toString(36).substring(2, 8).toUpperCase();
  // In a real app, we would store this code in the DB associated with a temporary session or telegram ID
  // For this MVP demo, we'll return it to the client to simulate "receiving it on Telegram"
  return { code }; 
}

export async function verifySellerCode(code: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // MVP: Accept any code that starts with "TG-"
  if (!code.startsWith("TG-")) {
    return { error: "Invalid verification code" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      seller_status: "verified",
      onboarding_status: "completed",
      telegram_username: "demo_user", // Mock
      telegram_user_id: "123456789" // Mock
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { success: true };
}

export async function getOnboardingStatus() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("role_preference, onboarding_status, seller_status")
    .eq("id", user.id)
    .single();

  return data;
}
