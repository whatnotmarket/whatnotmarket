import { validateMnemonic } from "bip39";
import { z } from "zod";
import { isReservedProfileHandle, normalizeProfileHandle } from "@/lib/security/identity-guards";

const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 24;
const PASSWORD_MIN_LENGTH = 10;
const PASSWORD_MAX_LENGTH = 128;
const BIO_MAX_LENGTH = 280;
const X_HANDLE_MAX_LENGTH = 15;
const DISCOVERY_SOURCE_MAX_LENGTH = 64;
const CATEGORY_MAX_LENGTH = 80;
const SELLER_NAME_MAX_LENGTH = 80;
const REVIEWS_CHANNEL_MAX_LENGTH = 120;
const ESCROW_EXPERIENCE_MAX_LENGTH = 120;
const SELLER_NOTES_MAX_LENGTH = 600;
const AVATAR_URL_MAX_LENGTH = 500;

export const recoveryPhraseWordCount = 12;
export const userIntentEnum = z.enum(["buy", "sell", "both"]);
export const accessMethodEnum = z.enum(["recovery_phrase", "google_mock", "apple_mock"]);

export type UserIntent = z.infer<typeof userIntentEnum>;
export type AccessMethod = z.infer<typeof accessMethodEnum>;

export function normalizeInternalUsername(raw: string) {
  return normalizeProfileHandle(raw).replace(/\./g, "_");
}

export function normalizeRecoveryPhrase(raw: string) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .join(" ");
}

export function splitRecoveryPhrase(raw: string) {
  return normalizeRecoveryPhrase(raw).split(" ").filter(Boolean);
}

export function isValidRecoveryPhrase(raw: string) {
  const normalized = normalizeRecoveryPhrase(raw);
  const words = splitRecoveryPhrase(normalized);

  if (words.length !== recoveryPhraseWordCount) {
    return false;
  }

  return validateMnemonic(normalized);
}

function normalizeOptionalText(value: string | undefined) {
  const trimmed = String(value || "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeXHandle(raw: string | undefined) {
  const value = String(raw || "")
    .trim()
    .replace(/^@+/, "")
    .toLowerCase();

  if (!value) return null;
  return value;
}

export const onboardingRegistrationSchema = z
  .object({
    username: z.string().trim().min(USERNAME_MIN_LENGTH).max(USERNAME_MAX_LENGTH),
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`)
      .max(PASSWORD_MAX_LENGTH),
    discoverySource: z.string().trim().min(1).max(DISCOVERY_SOURCE_MAX_LENGTH),
    userIntent: userIntentEnum,
    sellerCategory: z.string().trim().max(CATEGORY_MAX_LENGTH).optional(),
    buyerInterest: z.string().trim().max(CATEGORY_MAX_LENGTH).optional(),
    sellerName: z.string().trim().max(SELLER_NAME_MAX_LENGTH).optional(),
    reviewsChannel: z.string().trim().max(REVIEWS_CHANNEL_MAX_LENGTH).optional(),
    escrowExperience: z.string().trim().max(ESCROW_EXPERIENCE_MAX_LENGTH).optional(),
    sellerNotes: z.string().trim().max(SELLER_NOTES_MAX_LENGTH).optional(),
    bio: z.string().max(BIO_MAX_LENGTH).optional(),
    xHandle: z.string().max(X_HANDLE_MAX_LENGTH + 1).optional(),
    avatarUrl: z.string().url().max(AVATAR_URL_MAX_LENGTH).optional(),
    recoveryPhrase: z.string().min(1),
    next: z.string().optional(),
    onboardingSessionId: z.string().trim().min(8).max(128).optional(),
    onboardingSessionToken: z.string().trim().min(32).max(2048).optional(),
    accessMethod: accessMethodEnum.optional(),
  })
  .transform((raw) => {
    const username = normalizeInternalUsername(raw.username);
    const discoverySource = String(raw.discoverySource || "").trim();
    const sellerCategory = normalizeOptionalText(raw.sellerCategory);
    const buyerInterest = normalizeOptionalText(raw.buyerInterest);
    const sellerName = normalizeOptionalText(raw.sellerName);
    const reviewsChannel = normalizeOptionalText(raw.reviewsChannel);
    const escrowExperience = normalizeOptionalText(raw.escrowExperience);
    const sellerNotes = normalizeOptionalText(raw.sellerNotes);
    const bio = normalizeOptionalText(raw.bio);
    const xHandle = normalizeXHandle(raw.xHandle);
    const avatarUrl = String(raw.avatarUrl || "").trim() || null;
    const recoveryPhrase = normalizeRecoveryPhrase(raw.recoveryPhrase);

    return {
      username,
      password: raw.password,
      discoverySource,
      userIntent: raw.userIntent,
      sellerCategory,
      buyerInterest,
      sellerName,
      reviewsChannel,
      escrowExperience,
      sellerNotes,
      bio,
      xHandle,
      avatarUrl,
      recoveryPhrase,
      next: raw.next,
      onboardingSessionId: raw.onboardingSessionId,
      onboardingSessionToken: raw.onboardingSessionToken,
      accessMethod: raw.accessMethod || "recovery_phrase",
    };
  })
  .superRefine((value, ctx) => {
    if (!/^[a-z0-9_-]+$/.test(value.username)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Username can only include lowercase letters, numbers, hyphen, and underscore.",
        path: ["username"],
      });
    }

    if (isReservedProfileHandle(value.username)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "This username is not available.",
        path: ["username"],
      });
    }

    if (!value.discoverySource) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Discovery source is required.",
        path: ["discoverySource"],
      });
    }

    if ((value.userIntent === "sell" || value.userIntent === "both") && !value.sellerCategory) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Seller category is required.",
        path: ["sellerCategory"],
      });
    }
    if ((value.userIntent === "buy" || value.userIntent === "both") && !value.buyerInterest) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Buyer interest is required.",
        path: ["buyerInterest"],
      });
    }

    if (value.xHandle && !/^[a-z0-9_]{1,15}$/.test(value.xHandle)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "X handle can only include letters, numbers, and underscore.",
        path: ["xHandle"],
      });
    }

    if (!isValidRecoveryPhrase(value.recoveryPhrase)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid recovery phrase.",
        path: ["recoveryPhrase"],
      });
    }
  });

export const usernameAvailabilitySchema = z.object({
  username: z.string().trim().min(USERNAME_MIN_LENGTH).max(USERNAME_MAX_LENGTH),
});

export const onboardingProgressSchema = z
  .object({
    sessionId: z.string().trim().min(8).max(128),
    onboardingSessionToken: z.string().trim().min(32).max(2048),
    discoverySource: z.string().trim().max(DISCOVERY_SOURCE_MAX_LENGTH).optional(),
    userIntent: userIntentEnum.optional(),
    sellerCategory: z.string().trim().max(CATEGORY_MAX_LENGTH).optional(),
    buyerInterest: z.string().trim().max(CATEGORY_MAX_LENGTH).optional(),
    sellerName: z.string().trim().max(SELLER_NAME_MAX_LENGTH).optional(),
    reviewsChannel: z.string().trim().max(REVIEWS_CHANNEL_MAX_LENGTH).optional(),
    escrowExperience: z.string().trim().max(ESCROW_EXPERIENCE_MAX_LENGTH).optional(),
    sellerNotes: z.string().trim().max(SELLER_NOTES_MAX_LENGTH).optional(),
    bio: z.string().trim().max(BIO_MAX_LENGTH).optional(),
    xHandle: z.string().trim().max(X_HANDLE_MAX_LENGTH + 1).optional(),
    avatarUrl: z.string().trim().url().max(AVATAR_URL_MAX_LENGTH).optional(),
    selectedAccessMethod: accessMethodEnum.optional(),
    completedIdentity: z.boolean().optional(),
  })
  .transform((raw) => ({
    sessionId: raw.sessionId,
    onboardingSessionToken: raw.onboardingSessionToken,
    discoverySource: raw.discoverySource ? String(raw.discoverySource).trim() : undefined,
    userIntent: raw.userIntent,
    sellerCategory: normalizeOptionalText(raw.sellerCategory),
    buyerInterest: normalizeOptionalText(raw.buyerInterest),
    sellerName: normalizeOptionalText(raw.sellerName),
    reviewsChannel: normalizeOptionalText(raw.reviewsChannel),
    escrowExperience: normalizeOptionalText(raw.escrowExperience),
    sellerNotes: normalizeOptionalText(raw.sellerNotes),
    bio: normalizeOptionalText(raw.bio),
    xHandle: normalizeXHandle(raw.xHandle) || undefined,
    avatarUrl: raw.avatarUrl ? String(raw.avatarUrl).trim() : undefined,
    selectedAccessMethod: raw.selectedAccessMethod,
    completedIdentity: raw.completedIdentity,
  }));

export type OnboardingRegistrationInput = z.infer<typeof onboardingRegistrationSchema>;

