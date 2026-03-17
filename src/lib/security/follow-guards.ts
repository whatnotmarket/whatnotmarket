export type FollowAction = "follow" | "unfollow";

export type FollowToggleValidationInput = {
  actorUserId: string;
  targetUserId: string;
  action: FollowAction;
};

export type FollowToggleValidationResult =
  | { allowed: true }
  | { allowed: false; reason: string };

export function evaluateFollowToggle(input: FollowToggleValidationInput): FollowToggleValidationResult {
  const actor = String(input.actorUserId || "").trim();
  const target = String(input.targetUserId || "").trim();

  if (!actor || !target) {
    return {
      allowed: false,
      reason: "Actor and target user are required.",
    };
  }

  if (actor === target) {
    return {
      allowed: false,
      reason: "Self-follow is not allowed.",
    };
  }

  if (input.action !== "follow" && input.action !== "unfollow") {
    return {
      allowed: false,
      reason: "Unsupported follow action.",
    };
  }

  return { allowed: true };
}
