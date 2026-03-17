import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { checkRateLimitDetailed, RateLimitResponse } from "@/lib/rate-limit";

const ONBOARDING_GATE_COOKIE = "onboarding_gate_access";

function getGatePassword() {
  return String(process.env.ONBOARDING_GATE_PASSWORD || "").trim();
}

function safeEqual(input: string, expected: string) {
  const left = Buffer.from(input, "utf8");
  const right = Buffer.from(expected, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export async function POST(request: Request) {
  const rateLimit = checkRateLimitDetailed(request, { action: "onboarding_gate_access" });
  if (!rateLimit.allowed) {
    return RateLimitResponse(rateLimit);
  }

  const body = (await request.json().catch(() => ({}))) as { password?: string };
  const candidate = String(body.password || "");
  const expected = getGatePassword();

  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "Onboarding gate password is not configured." },
      { status: 503 },
    );
  }

  // Small fixed delay to reduce brute-force signal quality.
  await new Promise((resolve) => setTimeout(resolve, 250));

  if (!safeEqual(candidate, expected)) {
    return NextResponse.json({ ok: false, error: "Invalid password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ONBOARDING_GATE_COOKIE, "1", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 12,
  });
  return response;
}
