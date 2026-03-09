import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ensureBridgeUser, signInBridgeUserOnRoute } from "@/lib/auth/bridge";
import { createAdminClient } from "@/lib/supabase-admin";
import { getRedirectPath } from "@/lib/redirects";

type Payload = {
  code?: string;
  next?: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Payload;
  const code = String(body.code || "")
    .trim()
    .toUpperCase();

  if (code !== "ADMIN") {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 401 });
  }

  const bridgeIdentity = await ensureBridgeUser({
    subject: "invite:founder:whatnotmarket",
    provider: "walletconnect",
    email: "founder@whatnotmarket.app",
    fullName: "WhatnotMarket",
    avatarUrl: null,
  });

  const admin = createAdminClient();
  const { error: baseProfileError } = await admin
    .from("profiles")
    .update({
      full_name: "WhatnotMarket",
      role_preference: "seller",
    })
    .eq("id", bridgeIdentity.userId);

  if (baseProfileError) {
    return NextResponse.json(
      {
        error: `Unable to activate founder profile: ${baseProfileError.message}`,
      },
      { status: 500 }
    );
  }

  // Optional founder flags: keep auth bypass working even if target DB is missing
  // one of these columns or has stricter constraints.
  await admin
    .from("profiles")
    .update({
      onboarding_status: "completed",
      seller_status: "verified",
      is_admin: true,
    })
    .eq("id", bridgeIdentity.userId);

  const { error: usernameError } = await admin
    .from("profiles")
    .update({ username: "whatnotmarket" })
    .eq("id", bridgeIdentity.userId);

  if (usernameError && usernameError.code !== "23505") {
    return NextResponse.json(
      {
        error: `Unable to set founder handle: ${usernameError.message}`,
      },
      { status: 500 }
    );
  }

  // Backfill: all existing users auto-follow founder account.
  const { data: allProfiles } = await admin
    .from("profiles")
    .select("id")
    .neq("id", bridgeIdentity.userId);

  if (allProfiles?.length) {
    const rows = allProfiles.map((profile) => ({
      follower_id: profile.id,
      following_id: bridgeIdentity.userId,
    }));

    await admin.from("follows").upsert(rows, {
      onConflict: "follower_id,following_id",
      ignoreDuplicates: true,
    });
  }

  const redirectTo = getRedirectPath(body.next);
  const response = NextResponse.json({ ok: true, redirectTo });

  await signInBridgeUserOnRoute({
    request,
    response,
    email: bridgeIdentity.email,
    password: bridgeIdentity.password,
  });

  return response;
}
