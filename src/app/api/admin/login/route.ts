import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { timingSafeEqual } from "crypto";
import { signToken } from "@/lib/auth";
import { checkRateLimit, RateLimitResponse } from "@/lib/rate-limit";

function safePasswordEquals(input: string, expected: string) {
  const left = Buffer.from(input);
  const right = Buffer.from(expected);

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

export async function POST(req: Request) {
  if (!checkRateLimit(req, 5)) { // Strict limit for login
    return RateLimitResponse();
  }

  try {
    const isProduction = process.env.NODE_ENV === "production";
    const cookieStore = await cookies();
    const founderGate = cookieStore.get("founder_admin_gate")?.value;
    if (isProduction && founderGate !== "1") {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { password } = await req.json();
    const passwordCandidates = [
      process.env.ADMIN_PASSWORD || "",
      ...(isProduction ? [] : ["admin123"]),
    ].filter(Boolean);

    if (passwordCandidates.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Admin login is not configured" },
        { status: 500 }
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 500)); // Small fixed delay to reduce brute-force speed.

    const isValidPassword =
      typeof password === "string" &&
      passwordCandidates.some((candidate) => safePasswordEquals(password, candidate));

    if (isValidPassword) {
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
