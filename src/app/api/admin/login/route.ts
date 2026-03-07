import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { timingSafeEqual, createHash } from "crypto";
import { signToken } from "@/lib/auth";
import { checkRateLimit, RateLimitResponse } from "@/lib/rate-limit";

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
    // Removed founderGate check as it relied on client-side cookies which can be manipulated.
    // The admin password is the primary defense.
    
    const { password } = await req.json();
    
    // Only use the environment variable password. Removed insecure fallback 'admin123'.
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.error("ADMIN_PASSWORD environment variable is not set.");
      return NextResponse.json(
        { ok: false, error: "Admin login is not configured" },
        { status: 500 }
      );
    }

    // Artificial delay to mitigate brute-force attacks
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (typeof password === "string" && safePasswordEquals(password, adminPassword)) {
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
      
      // Clear any legacy gate cookies
      cookieStore.set("founder_admin_gate", "", {
        path: "/",
        maxAge: 0,
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
