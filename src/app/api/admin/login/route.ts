import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { timingSafeEqual, createHash } from "crypto";
import { signToken } from "@/lib/auth";
import { checkRateLimit, RateLimitResponse } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase-server";

/**
 * Constant-time comparison using SHA-256 hashes.
 * This prevents timing attacks that could leak password length or content.
 */
function safePasswordEquals(input: string, expected: string): boolean {
  try {
    const inputHash = createHash("sha256").update(input).digest();
    const expectedHash = createHash("sha256").update(expected).digest();
    
    // Both hashes will always be 32 bytes long, so timingSafeEqual works safely.
    return timingSafeEqual(inputHash, expectedHash);
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  if (!checkRateLimit(req, 5)) { // Strict limit for login
    return RateLimitResponse();
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
      .select("username")
      .eq("id", user.id)
      .maybeSingle<{ username: string | null }>();
    const username = String(profile?.username || "").trim().toLowerCase();
    if (username !== "whatnotmarket") {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Artificial delay to mitigate brute-force attacks
    await new Promise((resolve) => setTimeout(resolve, 500));

    const { data: isValid } = await supabase.rpc("verify_admin_password", {
      p_password: typeof password === "string" ? password : "",
    });

    if (isValid === true) {
      // Create a signed JWT with reduced lifespan
      const token = await signToken({ role: "admin" });

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
