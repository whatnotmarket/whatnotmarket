import type { RiskLevel } from "@/lib/domains/trust/types";

export const TRUST_SAFETY_CONFIG = {
  scoring: {
    user: {
      riskLevels: {
        lowMax: 24,
        mediumMax: 49,
        highMax: 74,
      },
    },
    listing: {
      riskLevels: {
        lowMax: 24,
        mediumMax: 49,
        highMax: 74,
      },
    },
    conversation: {
      riskLevels: {
        lowMax: 24,
        mediumMax: 49,
        highMax: 74,
      },
    },
  },
  policies: {
    user: {
      warnAt: 25,
      limitAt: 40,
      reviewAt: 60,
      suspendAt: 85,
    },
    listing: {
      warningAt: 25,
      pendingReviewAt: 45,
      restrictedAt: 70,
      removedAt: 90,
    },
    conversation: {
      warningAt: 20,
      softBlockAt: 45,
      hardBlockAt: 70,
    },
  },
  onboarding: {
    newAccountWindowHours: 72,
    strictWindowHours: 24,
    dailyMessageLimitForNewAccount: 30,
    dailyListingLimitForNewAccount: 2,
    dailyOfferLimitForNewAccount: 8,
    blockExternalContactsForNewAccounts: true,
    requirePhoneForHighRiskActions: true,
  },
  patterns: {
    urlRegex: /\b(?:https?:\/\/|www\.)[^\s]+/gi,
    emailRegex: /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi,
    phoneRegex: /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}/g,
    telegramRegex: /\b(?:telegram|t\.me|@[\w\d_]{4,})\b/gi,
    whatsappRegex: /\b(?:whatsapp|wa\.me)\b/gi,
    discordRegex: /\b(?:discord|discord\.gg)\b/gi,
    instagramRegex: /\b(?:instagram|insta|ig:)\b/gi,
    suspiciousKeywordRegex:
      /\b(?:deposito|caparra|anticipo|western union|gift card|ricarica|fuori piattaforma|bonifico diretto|crypto only outside)\b/gi,
    urgencyRegex:
      /\b(?:subito|urgente|solo oggi|ultima occasione|devi pagare ora|decidi adesso|immediatamente)\b/gi,
    phishingRegex:
      /\b(?:verifica account qui|reset wallet|seed phrase|private key|collega wallet qui|claim airdrop)\b/gi,
    externalPaymentRegex:
      /\b(?:paypal friends|bonifico privato|usdt diretto|crypto direct|pagamento esterno|off platform payment)\b/gi,
  },
  keywords: {
    vagueListing: [
      "contattami",
      "scrivimi in privato",
      "info in chat",
      "prezzo in dm",
      "details later",
      "no perditempo",
    ],
  },
  defaults: {
    newAccountStartingTrustScore: 20,
    establishedStartingTrustScore: 55,
  },
  microcopy: {
    chatWarning: "Non inviare pagamenti fuori piattaforma. Segnala subito se il comportamento e sospetto.",
    externalContactBlocked: "Per sicurezza non puoi condividere contatti esterni in questa fase.",
    listingPendingReview: "Annuncio in verifica di sicurezza. Ti avvisiamo appena completata la review.",
    accountStepUpRequired: "Per continuare serve una verifica aggiuntiva del tuo account.",
    temporaryBlock: "Attivita temporaneamente limitata per proteggere la community.",
  },
} as const;

type RiskThresholdSet = {
  lowMax: number;
  mediumMax: number;
  highMax: number;
};

export function scoreToRiskLevel(score: number, thresholds: RiskThresholdSet): RiskLevel {
  if (score <= thresholds.lowMax) return "low";
  if (score <= thresholds.mediumMax) return "medium";
  if (score <= thresholds.highMax) return "high";
  return "critical";
}

