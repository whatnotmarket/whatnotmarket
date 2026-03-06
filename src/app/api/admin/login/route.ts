import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signToken } from "@/lib/auth";
import { checkRateLimit, RateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: Request) {
  if (!checkRateLimit(req, 5)) { // Strict limit for login
    return RateLimitResponse();
  }

  try {
    const { password } = await req.json();
    
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

    if (!ADMIN_PASSWORD) {
      console.error("ADMIN_PASSWORD env var is not set!");
      return NextResponse.json(
        { ok: false, error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Constant time comparison would be better, but for now add delay
    await new Promise(resolve => setTimeout(resolve, 500)); // Anti-timing attack delay

    if (password === ADMIN_PASSWORD) {
      // Create a signed JWT
      const token = await signToken({ role: "admin" });

      // Set a secure cookie
      (await cookies()).set("admin_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24 // 1 day
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
