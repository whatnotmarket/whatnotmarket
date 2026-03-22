export type InviteValidationShape = {
  isValid: boolean;
  normalizedCode: string | null;
  inviteType: string | null;
  reason: string;
};

export function enforceRequiredInvite<T extends InviteValidationShape>(
  resolution: T,
  options?: { allowedTypes?: string[] }
): T {
  if (!resolution.normalizedCode) {
    return {
      ...resolution,
      isValid: false,
      reason: "missing",
    };
  }

  if (!resolution.isValid) {
    return resolution;
  }

  const allowedTypes = options?.allowedTypes;
  if (allowedTypes?.length) {
    if (!resolution.inviteType || !allowedTypes.includes(resolution.inviteType)) {
      return {
        ...resolution,
        isValid: false,
        reason: "type_mismatch",
      };
    }
  }

  return resolution;
}
