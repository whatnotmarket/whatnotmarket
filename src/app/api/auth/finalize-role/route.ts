import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase-server";
import { applyRoleAssignmentForUser, type DesiredRole } from "@/lib/auth/role-assignment";

type PendingSignupContext = {
  desiredRole?: DesiredRole;
  inviteCode?: string | null;
};

function parsePendingContext(raw: string | undefined): PendingSignupContext | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PendingSignupContext;
    const desiredRole = parsed.desiredRole === "seller" ? "seller" : "buyer";
    return {
      desiredRole,
      inviteCode: parsed.inviteCode ?? null,
    };
  } catch {
    return null;
  }
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cookieStore = await cookies();
  const pendingContext = parsePendingContext(cookieStore.get("wm_signup_context")?.value);

  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const metadataDesiredRole = metadata.role_preference === "seller" ? "seller" : "buyer";
  const metadataInviteCode = typeof metadata.invite_code === "string" ? metadata.invite_code : null;

  const desiredRole = pendingContext?.desiredRole ?? metadataDesiredRole;
  const inviteCode = pendingContext?.inviteCode ?? metadataInviteCode;

  const roleResult = await applyRoleAssignmentForUser({
    userId: user.id,
    email: user.email ?? null,
    desiredRole,
    inviteCode,
  });

  const response = NextResponse.json({
    role: roleResult.role,
    message: roleResult.message,
  });

  response.cookies.set("wm_signup_context", "", {
    path: "/",
    maxAge: 0,
  });

  return response;
}

