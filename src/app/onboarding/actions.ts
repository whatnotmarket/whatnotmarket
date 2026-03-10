"use server";

import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";
import { createHash, randomBytes } from "crypto";

const DEMO_SELLER_VERIFICATION_ENABLED =
  process.env.ENABLE_DEMO_SELLER_VERIFICATION === "true" &&
  process.env.NODE_ENV !== "production";

function getSellerVerificationSecret() {
  const secret = process.env.SELLER_VERIFICATION_SECRET;
  if (!secret) {
    throw new Error("SELLER_VERIFICATION_SECRET is required");
  }
  return secret;
}

function normalizeSellerCode(code: string) {
  return code.trim().toUpperCase();
}

function hashSellerCode(code: string) {
  return createHash("sha256")
    .update(`${getSellerVerificationSecret()}:${normalizeSellerCode(code)}`)
    .digest("hex");
}

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

export async function generateMockTelegramCode() {
  if (!DEMO_SELLER_VERIFICATION_ENABLED) {
    return { error: "Demo verification is disabled in this environment." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const code = `TG-${randomBytes(4).toString("hex").toUpperCase()}`;
  const codeHash = hashSellerCode(code);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const { error: insertError } = await supabase.from("seller_verifications").insert({
    verification_code_hash: codeHash,
    expires_at: expiresAt,
    status: "issued",
    metadata: {
      source: "demo_ui",
      issued_for_user_id: user.id,
    },
  });

  if (insertError) {
    return { error: "Unable to generate verification code" };
  }

  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({ seller_status: "pending_telegram" })
    .eq("id", user.id);

  return { code };
}

export async function verifySellerCode(code: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const normalizedCode = normalizeSellerCode(code);
  if (!/^TG-[A-Z0-9]{6,32}$/.test(normalizedCode)) {
    return { error: "Invalid verification code" };
  }

  let codeHash: string;
  try {
    codeHash = hashSellerCode(normalizedCode);
  } catch {
    return { error: "Verification service is not configured" };
  }

  const { data: verification, error: verificationError } = await supabase
    .from("seller_verifications")
    .select("id,expires_at,status,metadata")
    .eq("verification_code_hash", codeHash)
    .eq("status", "issued")
    .maybeSingle<{
      id: string;
      expires_at: string;
      status: "issued" | "used" | "expired";
      metadata: { issued_for_user_id?: string } | null;
    }>();

  if (verificationError || !verification) {
    return { error: "Invalid verification code" };
  }

  if (new Date(verification.expires_at).getTime() < Date.now()) {
    await supabase
      .from("seller_verifications")
      .update({
        status: "expired",
      })
      .eq("id", verification.id);
    return { error: "Verification code expired" };
  }

  const issuedForUserId = String(verification.metadata?.issued_for_user_id || "");
  if (!issuedForUserId || issuedForUserId !== user.id) {
    return { error: "Verification code is not valid for this account" };
  }

  const { error: consumeError } = await supabase
    .from("seller_verifications")
    .update({
      status: "used",
      used_at: new Date().toISOString(),
      used_by_user_id: user.id,
    })
    .eq("id", verification.id)
    .eq("status", "issued");

  if (consumeError) {
    return { error: "Unable to consume verification code" };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({
      seller_status: "verified",
      onboarding_status: "completed",
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
