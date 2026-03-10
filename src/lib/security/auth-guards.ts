export type AuthMode = "signin" | "signup";

export function shouldAllowBridgeUserCreation(mode: AuthMode) {
  return mode === "signup";
}

export function isInviteCodeDirectLoginEnabled() {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  return process.env.ENABLE_INVITE_CODE_LOGIN === "true";
}
