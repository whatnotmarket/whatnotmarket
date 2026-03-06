import "server-only";

import { createAdminClient } from "@/lib/supabase-admin";
import { resolveInviteCode } from "@/lib/invite-codes";

export type DesiredRole = "buyer" | "seller";

export type RoleAssignmentResult = {
  role: DesiredRole;
  message: string | null;
};

async function claimSellerInviteCode(code: string, userId: string, email: string) {
  const admin = createAdminClient();

  const { data: existingClaim, error: selectError } = await admin
    .from("seller_invite_code_claims")
    .select("user_id")
    .eq("code", code)
    .maybeSingle<{ user_id: string }>();

  if (selectError && selectError.code !== "PGRST116") {
    return {
      claimed: false,
      message: "Unable to verify seller invite code. Account set as buyer.",
    };
  }

  if (existingClaim) {
    if (existingClaim.user_id === userId) {
      return {
        claimed: true,
        message: null,
      };
    }

    return {
      claimed: false,
      message: "Seller invite code already used. Account set as buyer.",
    };
  }

  const { error: insertError } = await admin.from("seller_invite_code_claims").insert({
    code,
    user_id: userId,
    email,
  });

  if (!insertError) {
    return {
      claimed: true,
      message: null,
    };
  }

  if (insertError.code === "23505") {
    return {
      claimed: false,
      message: "Seller invite code already used. Account set as buyer.",
    };
  }

  return {
    claimed: false,
    message: "Unable to claim seller invite code. Account set as buyer.",
  };
}

async function upsertProfileRole(userId: string, email: string | null, role: DesiredRole) {
  const admin = createAdminClient();
  const onboardingStatus = role === "buyer" ? "completed" : "started";

  const { error: updateError } = await admin
    .from("profiles")
    .update({
      role_preference: role,
      onboarding_status: onboardingStatus,
      email: email ?? undefined,
    })
    .eq("id", userId);

  if (!updateError) {
    return;
  }

  const { error: insertError } = await admin.from("profiles").insert({
    id: userId,
    email,
    role_preference: role,
    onboarding_status: onboardingStatus,
  });

  if (insertError && insertError.code !== "23505") {
    throw new Error("Unable to persist profile role");
  }
}

export async function applyRoleAssignmentForUser(input: {
  userId: string;
  email: string | null;
  desiredRole: DesiredRole;
  inviteCode: string | null;
}): Promise<RoleAssignmentResult> {
  let finalRole: DesiredRole = "buyer";
  let message: string | null = null;

  if (input.desiredRole === "seller") {
    const inviteResolution = resolveInviteCode(input.inviteCode);

    if (
      inviteResolution.isValid &&
      inviteResolution.role === "seller" &&
      inviteResolution.normalizedCode
    ) {
      const claimResult = await claimSellerInviteCode(
        inviteResolution.normalizedCode,
        input.userId,
        input.email ?? ""
      );

      finalRole = claimResult.claimed ? "seller" : "buyer";
      message = claimResult.message;
    } else {
      finalRole = "buyer";
      message = "Invalid seller invite code. Account set as buyer.";
    }
  }

  await upsertProfileRole(input.userId, input.email, finalRole);

  return {
    role: finalRole,
    message,
  };
}

