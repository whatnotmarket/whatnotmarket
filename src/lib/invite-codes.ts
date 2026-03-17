import "server-only";

import { createAdminClient } from "@/lib/supabase-admin";
import { enforceRequiredInvite } from "@/lib/security/invite-guards";

export type InviteRole = "buyer" | "seller";
export type InviteCodeType = InviteRole | "founder";

export type InviteSource = "none" | "environment" | "database";

export type InviteResolution = {
  isValid: boolean;
  role: InviteRole;
  normalizedCode: string | null;
  requiresSellerClaim: boolean;
  source: InviteSource;
  inviteType: InviteCodeType | null;
  reason:
    | "ok"
    | "missing"
    | "invalid"
    | "expired"
    | "limit_reached"
    | "inactive"
    | "type_mismatch";
};

type DbInviteRow = {
  code: string;
  type: InviteCodeType | null;
  status: string | null;
  single_use: boolean | null;
  usage_limit: number | null;
  usage_count: number | null;
  expires_at: string | null;
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

function fallbackResolution(normalizedCode: string): InviteResolution {
  const sellerCodes = getSellerCodes();
  if (sellerCodes.has(normalizedCode)) {
    return {
      isValid: true,
      role: "seller",
      normalizedCode,
      requiresSellerClaim: true,
      source: "environment",
      inviteType: "seller",
      reason: "ok",
    };
  }

  const buyerCodes = getBuyerCodes();
  if (buyerCodes.has(normalizedCode)) {
    return {
      isValid: true,
      role: "buyer",
      normalizedCode,
      requiresSellerClaim: false,
      source: "environment",
      inviteType: "buyer",
      reason: "ok",
    };
  }

  return {
    isValid: false,
    role: "buyer",
    normalizedCode,
    requiresSellerClaim: false,
    source: "none",
    inviteType: null,
    reason: "invalid",
  };
}

function mapInviteRole(type: InviteCodeType | null | undefined): InviteRole {
  return type === "seller" ? "seller" : "buyer";
}

function validateDbInvite(row: DbInviteRow): InviteResolution {
  const normalizedCode = normalizeInviteCode(row.code);
  const role = mapInviteRole(row.type);
  const expiresAtTs = row.expires_at ? new Date(row.expires_at).getTime() : null;
  const usageLimit = typeof row.usage_limit === "number" ? row.usage_limit : null;
  const usageCount = typeof row.usage_count === "number" ? row.usage_count : 0;
  const singleUse = Boolean(row.single_use);
  const status = String(row.status || "active").toLowerCase();

  if (status !== "active") {
    return {
      isValid: false,
      role,
      normalizedCode,
      requiresSellerClaim: false,
      source: "database",
      inviteType: row.type || role,
      reason: "inactive",
    };
  }

  if (expiresAtTs && Number.isFinite(expiresAtTs) && Date.now() > expiresAtTs) {
    return {
      isValid: false,
      role,
      normalizedCode,
      requiresSellerClaim: false,
      source: "database",
      inviteType: row.type || role,
      reason: "expired",
    };
  }

  const limitReached = (usageLimit !== null && usageLimit >= 0 && usageCount >= usageLimit) || (singleUse && usageCount >= 1);
  if (limitReached) {
    return {
      isValid: false,
      role,
      normalizedCode,
      requiresSellerClaim: false,
      source: "database",
      inviteType: row.type || role,
      reason: "limit_reached",
    };
  }

  return {
    isValid: true,
    role,
    normalizedCode,
    requiresSellerClaim: role === "seller",
    source: "database",
    inviteType: row.type || role,
    reason: "ok",
  };
}

export async function resolveInviteCode(rawCode: string | null | undefined): Promise<InviteResolution> {
  const normalizedCode = normalizeInviteCode(rawCode);

  if (!normalizedCode) {
    return {
      isValid: true,
      role: "buyer",
      normalizedCode: null,
      requiresSellerClaim: false,
      source: "none",
      inviteType: null,
      reason: "missing",
    };
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("invite_codes")
      .select("code,type,status,single_use,usage_limit,usage_count,expires_at")
      .eq("code", normalizedCode)
      .maybeSingle<DbInviteRow>();

    if (!error && data) {
      return validateDbInvite(data);
    }
  } catch {
    // Fall through to environment-based invite handling.
  }

  return fallbackResolution(normalizedCode);
}

export async function resolveRequiredInviteCode(
  rawCode: string | null | undefined,
  options?: { allowedTypes?: InviteCodeType[] }
): Promise<InviteResolution> {
  const resolution = await resolveInviteCode(rawCode);
  return enforceRequiredInvite(resolution, {
    allowedTypes: options?.allowedTypes,
  });
}

export async function registerInviteUsage(input: {
  code: string | null | undefined;
  userId: string;
  email: string | null;
  source?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  const normalizedCode = normalizeInviteCode(input.code);
  if (!normalizedCode) return;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("invite_codes")
      .select("code,status,single_use,usage_limit,usage_count")
      .eq("code", normalizedCode)
      .maybeSingle<{
        code: string;
        status: string | null;
        single_use: boolean | null;
        usage_limit: number | null;
        usage_count: number | null;
      }>();

    if (error || !data) return;

    const nowIso = new Date().toISOString();
    const currentCount = Number.isFinite(Number(data.usage_count)) ? Number(data.usage_count) : 0;
    const nextCount = currentCount + 1;
    const usageLimit = data.usage_limit === null ? null : Number(data.usage_limit);

    let status = String(data.status || "active").toLowerCase();
    if (Boolean(data.single_use) && nextCount >= 1) {
      status = "used";
    }
    if (usageLimit !== null && usageLimit >= 0 && nextCount >= usageLimit) {
      status = "exhausted";
    }

    await admin
      .from("invite_codes")
      .update({
        usage_count: nextCount,
        status,
        last_used_at: nowIso,
        last_used_by: input.userId,
      })
      .eq("code", normalizedCode);

    await admin.from("invite_code_usages").insert({
      code: normalizedCode,
      user_id: input.userId,
      email: input.email,
      source: input.source || "auth_flow",
      ip_address: input.ipAddress || null,
      user_agent: input.userAgent || null,
      used_at: nowIso,
    });
  } catch {
    // Invite usage tracking is best-effort and must not block signup.
  }
}
