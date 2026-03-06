import { NextResponse } from "next/server";
import { resolveInviteCode } from "@/lib/invite-codes";

type InviteRolePayload = {
  code?: string;
};

export async function POST(request: Request) {
  let payload: InviteRolePayload = {};

  try {
    payload = (await request.json()) as InviteRolePayload;
  } catch {
    // Keep default empty payload.
  }

  const resolution = resolveInviteCode(payload.code ?? "");
  if (!resolution.isValid) {
    return NextResponse.json(
      {
        error: "Invalid invite code",
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    role: resolution.role,
    normalizedCode: resolution.normalizedCode,
  });
}

