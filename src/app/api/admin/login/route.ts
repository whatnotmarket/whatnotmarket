import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signToken } from "@/lib/auth";
import { checkRateLimitDetailed, RateLimitResponse } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { hasCanonicalAdminAccess } from "@/lib/security/admin-guards";

export async function POST(req: Request) {
  const rateLimit = checkRateLimitDetailed(req, { action: "admin_login" });
  if (!rateLimit.allowed) {
    return RateLimitResponse(rateLimit);
  }

  try {
    const isProduction = process.env.NODE_ENV === "production";
    const cookieStore = await cookies();
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { password } = await req.json();
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle<{ is_admin: boolean | null }>();

    if (!hasCanonicalAdminAccess(profile)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Artificial delay to mitigate brute-force attacks
    await new Promise((resolve) => setTimeout(resolve, 500));

    const admin = createAdminClient();
    const { data: isValid, error: verifyError } = await admin.rpc("verify_admin_password", {
      p_password: typeof password === "string" ? password : "",
    });
    if (verifyError) {
      return NextResponse.json(
        { ok: false, error: "Admin password verification is unavailable" },
        { status: 500 }
      );
    }

    if (isValid === true) {
      // Create a signed JWT with reduced lifespan
      const token = await signToken({ role: "admin", sub: user.id });

      // Set a secure cookie
      cookieStore.set("admin_token", token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 // 1 hour (reduced from 24h)
      });

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      { ok: false, error: "Invalid password" },
      { status: 401 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { ok: false, error: "Login failed" },
      { status: 500 }
    );
  }
}
