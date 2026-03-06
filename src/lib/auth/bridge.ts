import "server-only";

import { createHash } from "crypto";
import type { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase-admin";

type BridgeIdentityInput = {
  subject: string;
  provider: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
};

type BridgeIdentityRow = {
  auth_subject: string;
  provider: string;
  supabase_user_id: string;
  email: string | null;
};

function getBridgeSecret() {
  const value = process.env.AUTH_BRIDGE_SECRET;
  if (!value) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_BRIDGE_SECRET is missing");
    }
    return "dev-bridge-secret";
  }
  return value;
}

function normalizeEmail(raw: string | null) {
  const value = String(raw ?? "")
    .trim()
    .toLowerCase();

  return value || null;
}

function subjectToSyntheticEmail(subject: string) {
  const domain = process.env.AUTH_BRIDGE_EMAIL_DOMAIN || "auth.local";
  const local = subject
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 52);

  return `${local || "user"}@${domain}`;
}

export function deriveBridgePassword(subject: string) {
  const digest = createHash("sha256")
    .update(`${getBridgeSecret()}:${subject}`)
    .digest("hex");

  return `${digest.slice(0, 28)}Aa!9`;
}

async function resolveSupabaseUserIdByEmail(email: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (error) {
    return null;
  }

  return data?.id ?? null;
}

async function upsertBridgeIdentity(row: {
  authSubject: string;
  provider: string;
  supabaseUserId: string;
  email: string | null;
}) {
  const admin = createAdminClient();
  const { error } = await admin.from("auth_bridge_identities").upsert(
    {
      auth_subject: row.authSubject,
      provider: row.provider,
      supabase_user_id: row.supabaseUserId,
      email: row.email,
    },
    {
      onConflict: "auth_subject",
    }
  );

  if (error) {
    throw new Error("Unable to persist identity mapping");
  }
}

async function updateProfileDetails(params: {
  userId: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
}) {
  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({
      email: params.email,
      full_name: params.fullName ?? undefined,
      avatar_url: params.avatarUrl ?? undefined,
    })
    .eq("id", params.userId);
}

export async function ensureBridgeUser(identity: BridgeIdentityInput) {
  const admin = createAdminClient();
  const email = normalizeEmail(identity.email) ?? subjectToSyntheticEmail(identity.subject);
  const password = deriveBridgePassword(identity.subject);

  const { data: mapping } = await admin
    .from("auth_bridge_identities")
    .select("auth_subject,provider,supabase_user_id,email")
    .eq("auth_subject", identity.subject)
    .maybeSingle<BridgeIdentityRow>();

  if (mapping?.supabase_user_id) {
    await admin.auth.admin.updateUserById(mapping.supabase_user_id, {
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: identity.fullName ?? undefined,
        avatar_url: identity.avatarUrl ?? undefined,
        bridge_subject: identity.subject,
        bridge_provider: identity.provider,
      },
    });

    await upsertBridgeIdentity({
      authSubject: identity.subject,
      provider: identity.provider,
      supabaseUserId: mapping.supabase_user_id,
      email,
    });

    await updateProfileDetails({
      userId: mapping.supabase_user_id,
      email,
      fullName: identity.fullName,
      avatarUrl: identity.avatarUrl,
    });

    return {
      userId: mapping.supabase_user_id,
      email,
      password,
    };
  }

  let supabaseUserId = await resolveSupabaseUserIdByEmail(email);

  if (!supabaseUserId) {
    const { data: createdUser, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: identity.fullName ?? undefined,
        avatar_url: identity.avatarUrl ?? undefined,
        bridge_subject: identity.subject,
        bridge_provider: identity.provider,
      },
    });

    if (createError || !createdUser.user?.id) {
      throw new Error(createError?.message || "Unable to create bridge user");
    }

    supabaseUserId = createdUser.user.id;
  } else {
    await admin.auth.admin.updateUserById(supabaseUserId, {
      password,
      email,
      email_confirm: true,
      user_metadata: {
        full_name: identity.fullName ?? undefined,
        avatar_url: identity.avatarUrl ?? undefined,
        bridge_subject: identity.subject,
        bridge_provider: identity.provider,
      },
    });
  }

  await upsertBridgeIdentity({
    authSubject: identity.subject,
    provider: identity.provider,
    supabaseUserId,
    email,
  });

  await updateProfileDetails({
    userId: supabaseUserId,
    email,
    fullName: identity.fullName,
    avatarUrl: identity.avatarUrl,
  });

  return {
    userId: supabaseUserId,
    email,
    password,
  };
}

export async function signInBridgeUserOnRoute(params: {
  request: NextRequest;
  response: NextResponse;
  email: string;
  password: string;
}) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => params.request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            params.response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.signInWithPassword({
    email: params.email,
    password: params.password,
  });

  if (error) {
    throw new Error(error.message);
  }
}

