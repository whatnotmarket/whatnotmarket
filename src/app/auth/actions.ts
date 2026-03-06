"use server";

import { createClient } from "@/lib/supabase-server"; // I need to implement this
import { createAdminClient } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
  const code = formData.get("code") as string;
  const fullName = formData.get("full_name") as string;

  if (!code) {
    return { error: "Invite code required" };
  }

  // MVP: Validate code hardcoded check or DB check
  if (code !== "VIP2026") {
     // In real app, check DB:
     /*
     const admin = createAdminClient();
     const { data: invite } = await admin.from('invite_codes').select('*').eq('code', code).single();
     if (!invite || invite.status !== 'active') return { error: 'Invalid code' };
     */
     // For MVP with no DB connected yet, we skip real validation if it's the demo code
     // But if we want to be strict, we can fail if it's not VIP2026
     return { error: "Invalid invite code" };
  }

  const supabase = await createClient();

  // Standard signup
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

  if (data.user) {
    // Mark invite as used (best effort for MVP without DB)
    // const admin = createAdminClient();
    // await admin.from('invite_codes').update({ status: 'used', used_by: data.user.id }).eq('code', code);
  }

  revalidatePath("/", "layout");
  redirect("/market");
}
