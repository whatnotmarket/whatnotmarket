import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signToken } from "@/lib/auth";
import { checkRateLimit, RateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: Request) {
  if (!checkRateLimit(req, 5)) { // Strict limit for login
    return RateLimitResponse();
  }

  try {
    const cookieStore = await cookies();
    const founderGate = cookieStore.get("founder_admin_gate")?.value;
    if (founderGate !== "1") {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { password } = await req.json();
    const ADMIN_PASSWORD = "admin123";

    // Constant time comparison would be better, but for now add delay
    await new Promise(resolve => setTimeout(resolve, 500)); // Anti-timing attack delay

    if (password === ADMIN_PASSWORD) {
      // Create a signed JWT
      const token = await signToken({ role: "admin" });

      // Set a secure cookie
      cookieStore.set("admin_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24 // 1 day
      });
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
