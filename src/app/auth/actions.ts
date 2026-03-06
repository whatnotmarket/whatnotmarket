"use server";

import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const DEMO_INVITE_CODE = (process.env.NEXT_PUBLIC_INVITE_CODE || "VIP2026").toUpperCase();

type InviteValidation = {
  isValid: boolean;
  code: string;
  shouldMarkAsUsed: boolean;
};

async function validateInviteCode(rawCode: string): Promise<InviteValidation> {
  const code = rawCode.trim().toUpperCase();

  if (!code) {
    return { isValid: false, code, shouldMarkAsUsed: false };
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
      if (code === DEMO_INVITE_CODE) {
        return { isValid: true, code, shouldMarkAsUsed: false };
      }
      return { isValid: false, code, shouldMarkAsUsed: false };
    }

    const expired = data?.expires_at ? new Date(data.expires_at) <= new Date() : false;
    const isActive = data?.status === "active" && !expired;

    if (isActive) {
      return { isValid: true, code, shouldMarkAsUsed: true };
    }

    if (!data && code === DEMO_INVITE_CODE) {
      return { isValid: true, code, shouldMarkAsUsed: false };
    }

    return { isValid: false, code, shouldMarkAsUsed: false };
  } catch (error) {
    console.error("Invite validation error:", error);
    if (code === DEMO_INVITE_CODE) {
      return { isValid: true, code, shouldMarkAsUsed: false };
    }
    return { isValid: false, code, shouldMarkAsUsed: false };
  }
}

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/market");
}

export async function signup(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const code = (formData.get("code") as string) || "";
  const fullName = formData.get("full_name") as string;

  const inviteValidation = await validateInviteCode(code);
  if (!inviteValidation.isValid) {
    return { error: "Invalid invite code" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user && inviteValidation.shouldMarkAsUsed) {
    try {
      const admin = createAdminClient();
      const { error: inviteError } = await admin
        .from("invite_codes")
        .update({ status: "used", used_by: data.user.id })
        .eq("code", inviteValidation.code)
        .eq("status", "active");

      if (inviteError) {
        console.error("Failed to mark invite as used:", inviteError.message);
      }
    } catch (markUsedError) {
      console.error("Unexpected invite update error:", markUsedError);
    }
  }

  revalidatePath("/", "layout");
  redirect("/market");
}
