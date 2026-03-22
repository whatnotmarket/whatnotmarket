export type ModerationDecision = "allow" | "flag" | "review" | "block";

export type ModerationSeverity = "none" | "low" | "medium" | "high" | "critical";

export type ModerationTargetType =
  | "listing_title"
  | "listing_description"
  | "profile_bio"
  | "username"
  | "comment"
  | "review"
  | "public_form"
  | "report_text"
  | "marketplace_content"
  | "generic_public_text";

export type ModerationReasonCode =
  | "SPAM_LINK_PATTERN"
  | "TOO_MANY_LINKS"
  | "EXTERNAL_CONTACT"
  | "PHONE_NUMBER_DETECTED"
  | "EMAIL_DETECTED"
  | "TELEGRAM_HANDLE_DETECTED"
  | "WHATSAPP_REFERENCE"
  | "OFF_PLATFORM_PAYMENT"
  | "SCAM_KEYWORDS"
  | "HATE_SPEECH_SIGNAL"
  | "HARASSMENT_SIGNAL"
  | "THREAT_SIGNAL"
  | "SEXUAL_CONTENT_SIGNAL"
  | "DUPLICATE_TEXT_PATTERN"
  | "BANNED_KEYWORD"
  | "SUSPICIOUS_MARKETING_PATTERN"
  | "AI_MODERATION_FLAGGED"
  | "AI_MODERATION_BLOCKED"
  | "AI_SCAM_SIGNAL"
  | "AI_SPAM_SIGNAL"
  | "AI_HARASSMENT_SIGNAL"
  | "AI_HATE_SIGNAL"
  | "AI_THREAT_SIGNAL"
  | "AI_SEXUAL_TEXT_SIGNAL"
  | "AI_OFF_PLATFORM_CONTACT_SIGNAL"
  | "AI_OFF_PLATFORM_PAYMENT_SIGNAL"
  | "AI_PHISHING_SIGNAL"
  | "AI_SUSPICIOUS_LISTING_LANGUAGE"
  | "AI_BORDERLINE_REVIEW"
  | "AI_CONFIDENCE_LOW"
  | "AI_PROVIDER_ERROR"
  | "AI_SKIPPED_INBOX_ROUTE"
  | "PUBLIC_CONTENT_POLICY_VIOLATION"
  | "INBOX_ROUTE_EXCLUDED";

export type ModerationContext = {
  pathname?: string | null;
  source?: "route_handler" | "server_action" | "service" | "unknown";
  endpointTag?: string | null;
  isPrivateMessage?: boolean;
  routeGroup?: string | null;
};

export type ModerationInput = {
  targetType: ModerationTargetType;
  text: string;
  actorId?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  context?: ModerationContext;
};

export type ModerationRuleMatch = {
  id: string;
  label: string;
  severity: ModerationSeverity;
  scoreImpact: number;
  reasonCode: ModerationReasonCode;
};

export type ModerationResult = {
  decision: ModerationDecision;
  severity: ModerationSeverity;
  score: number;
  matchedRules: string[];
  reasonCodes: ModerationReasonCode[];
  sanitizedText: string;
  shouldBlock: boolean;
  shouldReview: boolean;
  shouldLog: boolean;
  skippedBecauseInbox: boolean;
  providerName: string;
  route: string | null;
  userMessage: string;
  ai: {
    invoked: boolean;
    providerName: string;
    categories: string[];
    confidence: number;
    explanation: string;
    providerError: string | null;
    skippedBecauseInbox: boolean;
    skippedByPolicy: boolean;
    skippedReason:
      | "disabled"
      | "target_not_enabled"
      | "text_too_short"
      | "hard_rule_block"
      | "excluded_route"
      | "inbox_route"
      | null;
  };
};

export type RuleBasedModerationResult = {
  score: number;
  severity: ModerationSeverity;
  matchedRules: ModerationRuleMatch[];
  reasonCodes: ModerationReasonCode[];
  sanitizedText: string;
  suggestedDecision: ModerationDecision;
};
