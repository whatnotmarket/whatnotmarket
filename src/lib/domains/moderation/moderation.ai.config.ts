import type { ModerationAIProvider } from "@/lib/domains/moderation/moderation.ai.types";
import type { ModerationReasonCode,ModerationTargetType } from "@/lib/domains/moderation/moderation.types";

const DEFAULT_ENABLED_TARGETS: ModerationTargetType[] = [
  "listing_title",
  "listing_description",
  "profile_bio",
  "username",
  "comment",
  "review",
  "public_form",
  "report_text",
  "marketplace_content",
  "generic_public_text",
];

function parseTargetList(rawValue: string | undefined): ModerationTargetType[] {
  const raw = String(rawValue || "").trim();
  if (!raw) return DEFAULT_ENABLED_TARGETS;

  const parsed = raw
    .split(",")
    .map((target) => target.trim())
    .filter(Boolean) as ModerationTargetType[];

  return parsed.length > 0 ? parsed : DEFAULT_ENABLED_TARGETS;
}

function parseStringList(rawValue: string | undefined, fallback: string[]): string[] {
  const raw = String(rawValue || "").trim();
  if (!raw) return fallback;

  const values = raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  return values.length > 0 ? values : fallback;
}

export const MODERATION_AI_CONFIG = {
  enabled: process.env.MODERATION_AI_ENABLED !== "false",
  provider: (process.env.MODERATION_PROVIDER || "none").toLowerCase() as ModerationAIProvider,
  model: process.env.MODERATION_OPENAI_MODEL || "gpt-4.1-mini",
  aiTimeoutMs: Number(process.env.MODERATION_AI_TIMEOUT_MS || 6000),
  retries: Number(process.env.MODERATION_AI_RETRIES || 1),
  minTextLengthForAI: Number(process.env.MODERATION_AI_MIN_TEXT_LENGTH || 24),
  aiConfidenceThreshold: Number(process.env.MODERATION_AI_CONFIDENCE_THRESHOLD || 0.62),
  reviewThreshold: Number(process.env.MODERATION_AI_REVIEW_THRESHOLD || 45),
  blockThreshold: Number(process.env.MODERATION_AI_BLOCK_THRESHOLD || 78),
  enabledTargets: new Set(parseTargetList(process.env.MODERATION_AI_ENABLED_TARGETS)),
  excludedRoutes: parseStringList(process.env.MODERATION_AI_EXCLUDED_ROUTES, [
    "/inbox",
    "/api/inbox",
    "/api/chat/messages",
    "/api/dm",
    "/api/messages/private",
  ]),
  openai: {
    apiKey: process.env.OPENAI_API_KEY || "",
    endpoint: process.env.MODERATION_OPENAI_ENDPOINT || "https://api.openai.com/v1/chat/completions",
  },
  perspective: {
    apiKey: process.env.PERSPECTIVE_API_KEY || "",
    endpoint:
      process.env.PERSPECTIVE_ENDPOINT || "https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze",
  },
  custom: {
    endpoint: process.env.MODERATION_CUSTOM_PROVIDER_URL || "",
    apiKey: process.env.MODERATION_CUSTOM_PROVIDER_API_KEY || "",
  },
  hardRuleBlockReasonCodes: new Set<ModerationReasonCode>([
    "HATE_SPEECH_SIGNAL",
    "THREAT_SIGNAL",
    "SEXUAL_CONTENT_SIGNAL",
    "BANNED_KEYWORD",
    "PUBLIC_CONTENT_POLICY_VIOLATION",
  ]),
} as const;

