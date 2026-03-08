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
  try {
    const body = (await request.json().catch(() => ({}))) as Payload;
    const code = String(body.code || "")
      .trim()
      .toUpperCase();

    if (code !== "TEST") {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 401 });
    }

    const bridgeIdentity = await ensureBridgeUser({
      subject: "invite:test:buyer",
      provider: "walletconnect", // Simulate wallet login
      email: "test-buyer@whatnotmarket.app",
      fullName: "Test Buyer",
      avatarUrl: null,
    });

    const admin = createAdminClient();
    const { error: baseProfileError } = await admin
      .from("profiles")
      .update({
        full_name: "Test Buyer",
        role_preference: "buyer",
      })
      .eq("id", bridgeIdentity.userId);

    if (baseProfileError) {
      console.error("Profile update error:", baseProfileError);
      return NextResponse.json(
        {
          error: `Unable to activate test buyer profile: ${baseProfileError.message}`,
        },
        { status: 500 }
      );
    }

    // Ensure onboarding is completed so they can use the app
    await admin
      .from("profiles")
      .update({
        onboarding_status: "completed",
        is_admin: false,
      })
      .eq("id", bridgeIdentity.userId);

    const { error: usernameError } = await admin
      .from("profiles")
      .update({ username: "testbuyer" })
      .eq("id", bridgeIdentity.userId);

    // Ignore unique violation for username if it's already set (e.g. from previous run)
    if (usernameError && usernameError.code !== "23505") {
      console.error("Username update error:", usernameError);
      return NextResponse.json(
        {
          error: `Unable to set test buyer handle: ${usernameError.message}`,
        },
        { status: 500 }
      );
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
  } catch (error) {
    console.error("Invite buyer error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown server error",
      },
      { status: 500 }
    );
  }
}
