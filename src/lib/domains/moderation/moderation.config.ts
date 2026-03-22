import type { ModerationDecision,ModerationReasonCode,ModerationSeverity } from "@/lib/domains/moderation/moderation.types";

export const MODERATION_CONFIG = {
  thresholds: {
    flagScore: 10,
    reviewScore: 25,
    blockScore: 50,
  },
  limits: {
    maxTextLength: 8000,
    maxAllowedLinks: 2,
  },
  patterns: {
    urlRegex: /\b(?:https?:\/\/|www\.)[^\s]+/gi,
    emailRegex: /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi,
    phoneRegex: /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}/g,
    telegramRegex: /\b(?:telegram|t\.me|@[\w\d_]{4,})\b/gi,
    whatsappRegex: /\b(?:whatsapp|wa\.me)\b/gi,
    discordRegex: /\b(?:discord|discord\.gg)\b/gi,
    instagramRegex: /\b(?:instagram|ig:|insta)\b/gi,
    scamRegex:
      /\b(?:caparra|anticipo|deposito|pagamento esterno|fuori piattaforma|bonifico diretto|gift card|western union|crypto direct)\b/gi,
    phishingRegex:
      /\b(?:seed phrase|private key|wallet recovery|verifica wallet|account sospeso clicca|claim airdrop)\b/gi,
    suspiciousMarketingRegex:
      /\b(?:guadagno garantito|soldi facili|profitto certo|opportunita irripetibile|100% legit)\b/gi,
    threatRegex:
      /\b(?:ti trovo|ti vengo a prendere|ti ammazzo|te la faccio pagare|minaccia)\b/gi,
    harassmentRegex:
      /\b(?:idiota|stupido|vergognati|sei un fallito|ti segnalo ovunque)\b/gi,
    sexualExplicitRegex:
      /\b(?:prestazione sessuale|contenuto esplicito|servizio hot|nudo integrale)\b/gi,
    hateSpeechRegex:
      /\b(?:odio (?:verso|contro)|pulizia etnica|razza inferiore)\b/gi,
    duplicateTokenRegex: /\b(\w{3,})\b(?:[\s,.;:!?-]+\1\b){3,}/gi,
  },
  keywords: {
    banned: ["truffa garantita", "drop shipping scam", "passa su whatsapp", "no escrow"],
  },
  decisionMessages: {
    allow: "Operazione completata.",
    flag: "Operazione completata.",
    review: "Il contenuto e stato inviato e sara verificato prima della pubblicazione.",
    block: "Il contenuto inviato non rispetta le linee guida della piattaforma.",
    blockPartial: "Alcuni elementi del testo non sono consentiti.",
  } as Record<ModerationDecision | "blockPartial", string>,
  severityRank: {
    none: 0,
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
  } as Record<ModerationSeverity, number>,
  blockReasonCodes: new Set<ModerationReasonCode>([
    "AI_MODERATION_BLOCKED",
    "AI_HATE_SIGNAL",
    "AI_THREAT_SIGNAL",
    "AI_SEXUAL_TEXT_SIGNAL",
    "AI_PHISHING_SIGNAL",
    "BANNED_KEYWORD",
    "HATE_SPEECH_SIGNAL",
    "THREAT_SIGNAL",
    "SEXUAL_CONTENT_SIGNAL",
    "PUBLIC_CONTENT_POLICY_VIOLATION",
  ]),
  reviewReasonCodes: new Set<ModerationReasonCode>([
    "AI_MODERATION_FLAGGED",
    "AI_BORDERLINE_REVIEW",
    "AI_OFF_PLATFORM_CONTACT_SIGNAL",
    "AI_OFF_PLATFORM_PAYMENT_SIGNAL",
    "AI_SCAM_SIGNAL",
    "AI_SPAM_SIGNAL",
    "AI_SUSPICIOUS_LISTING_LANGUAGE",
    "EXTERNAL_CONTACT",
    "OFF_PLATFORM_PAYMENT",
    "SCAM_KEYWORDS",
    "SPAM_LINK_PATTERN",
    "TOO_MANY_LINKS",
  ]),
} as const;

export function truncateForModeration(rawText: string) {
  return String(rawText || "").slice(0, MODERATION_CONFIG.limits.maxTextLength);
}

