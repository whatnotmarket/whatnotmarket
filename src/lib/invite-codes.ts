import "server-only";

export type InviteRole = "buyer" | "seller";

export type InviteResolution =
  | {
      isValid: true;
      role: InviteRole;
      normalizedCode: string | null;
      requiresSellerClaim: boolean;
    }
  | {
      isValid: false;
      role: "buyer";
      normalizedCode: string | null;
      requiresSellerClaim: false;
    };

function normalizeInviteCode(rawCode: string | null | undefined) {
  return String(rawCode ?? "")
    .trim()
    .toUpperCase();
}

function parseCodeSet(raw: string | undefined) {
  if (!raw) return new Set<string>();
  const entries = raw
    .split(",")
    .map((entry) => normalizeInviteCode(entry))
    .filter(Boolean);
  return new Set(entries);
}

function getSellerCodes() {
  return parseCodeSet(process.env.SELLER_INVITE_CODES);
}

function getBuyerCodes() {
  return parseCodeSet(process.env.BUYER_INVITE_CODES);
}

export function resolveInviteCode(rawCode: string | null | undefined): InviteResolution {
  const normalizedCode = normalizeInviteCode(rawCode);

  if (!normalizedCode) {
    return {
      isValid: true,
      role: "buyer",
      normalizedCode: null,
      requiresSellerClaim: false,
    };
  }

  const sellerCodes = getSellerCodes();
  if (sellerCodes.has(normalizedCode)) {
    return {
      isValid: true,
      role: "seller",
      normalizedCode,
      requiresSellerClaim: true,
    };
  }

  const buyerCodes = getBuyerCodes();
  if (buyerCodes.has(normalizedCode)) {
    return {
      isValid: true,
      role: "buyer",
      normalizedCode,
      requiresSellerClaim: false,
    };
  }

  return {
    isValid: false,
    role: "buyer",
    normalizedCode,
    requiresSellerClaim: false,
  };
}

