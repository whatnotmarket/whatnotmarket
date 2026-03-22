import { MODERATION_CONFIG,truncateForModeration } from "@/lib/domains/moderation/moderation.config";
import { MODERATION_REASON_CODES } from "@/lib/domains/moderation/moderation.reason-codes";
import type {
ModerationDecision,
ModerationInput,
ModerationReasonCode,
ModerationRuleMatch,
ModerationSeverity,
RuleBasedModerationResult,
} from "@/lib/domains/moderation/moderation.types";

function normalizeText(raw: string) {
  return truncateForModeration(raw).replace(/\r\n/g, "\n").replace(/\s+/g, " ").trim();
}

function severityFromScore(score: number): ModerationSeverity {
  if (score <= 0) return "none";
  if (score < 15) return "low";
  if (score < 30) return "medium";
  if (score < 50) return "high";
  return "critical";
}

function decisionFromScore(score: number): ModerationDecision {
  if (score >= MODERATION_CONFIG.thresholds.blockScore) return "block";
  if (score >= MODERATION_CONFIG.thresholds.reviewScore) return "review";
  if (score >= MODERATION_CONFIG.thresholds.flagScore) return "flag";
  return "allow";
}

function countRegexMatches(text: string, regex: RegExp) {
  const flags = regex.flags.includes("g") ? regex.flags : `${regex.flags}g`;
  const globalRegex = new RegExp(regex.source, flags);
  return Array.from(text.matchAll(globalRegex)).length;
}

function redactSensitiveContent(text: string) {
  let output = text;
  output = output.replace(MODERATION_CONFIG.patterns.emailRegex, "[email-hidden]");
  output = output.replace(MODERATION_CONFIG.patterns.phoneRegex, "[phone-hidden]");
  output = output.replace(MODERATION_CONFIG.patterns.urlRegex, "[link-hidden]");
  output = output.replace(MODERATION_CONFIG.patterns.telegramRegex, "[handle-hidden]");
  output = output.replace(MODERATION_CONFIG.patterns.whatsappRegex, "[handle-hidden]");
  output = output.replace(MODERATION_CONFIG.patterns.discordRegex, "[handle-hidden]");
  output = output.replace(MODERATION_CONFIG.patterns.instagramRegex, "[handle-hidden]");
  return output;
}

function addMatch(
  matches: ModerationRuleMatch[],
  input: {
    id: string;
    label: string;
    severity: ModerationSeverity;
    scoreImpact: number;
    reasonCode: ModerationReasonCode;
  }
) {
  matches.push(input);
}

function uniqueReasonCodes(matches: ModerationRuleMatch[]) {
  return Array.from(new Set(matches.map((match) => match.reasonCode)));
}

export function evaluateRuleBasedModeration(input: ModerationInput): RuleBasedModerationResult {
  const text = normalizeText(input.text);
  const lower = text.toLowerCase();
  const matches: ModerationRuleMatch[] = [];

  const linksCount = countRegexMatches(lower, MODERATION_CONFIG.patterns.urlRegex);
  if (linksCount > 0) {
    addMatch(matches, {
      id: "rule_links_detected",
      label: "Link esterni rilevati",
      severity: linksCount > MODERATION_CONFIG.limits.maxAllowedLinks ? "high" : "medium",
      scoreImpact: linksCount > MODERATION_CONFIG.limits.maxAllowedLinks ? 20 : 10,
      reasonCode: linksCount > MODERATION_CONFIG.limits.maxAllowedLinks ? "TOO_MANY_LINKS" : "SPAM_LINK_PATTERN",
    });
  }

  const emailCount = countRegexMatches(lower, MODERATION_CONFIG.patterns.emailRegex);
  if (emailCount > 0) {
    addMatch(matches, {
      id: "rule_email_detected",
      label: "Email rilevata",
      severity: "high",
      scoreImpact: 18,
      reasonCode: MODERATION_REASON_CODES.EMAIL_DETECTED,
    });
  }

  const phoneCount = countRegexMatches(lower, MODERATION_CONFIG.patterns.phoneRegex);
  if (phoneCount > 0) {
    addMatch(matches, {
      id: "rule_phone_detected",
      label: "Numero di telefono rilevato",
      severity: "high",
      scoreImpact: 18,
      reasonCode: MODERATION_REASON_CODES.PHONE_NUMBER_DETECTED,
    });
  }

  const telegramCount = countRegexMatches(lower, MODERATION_CONFIG.patterns.telegramRegex);
  if (telegramCount > 0) {
    addMatch(matches, {
      id: "rule_telegram_reference",
      label: "Riferimento Telegram",
      severity: "high",
      scoreImpact: 20,
      reasonCode: MODERATION_REASON_CODES.TELEGRAM_HANDLE_DETECTED,
    });
  }

  const whatsappCount = countRegexMatches(lower, MODERATION_CONFIG.patterns.whatsappRegex);
  if (whatsappCount > 0) {
    addMatch(matches, {
      id: "rule_whatsapp_reference",
      label: "Riferimento WhatsApp",
      severity: "high",
      scoreImpact: 20,
      reasonCode: MODERATION_REASON_CODES.WHATSAPP_REFERENCE,
    });
  }

  if (emailCount + phoneCount + telegramCount + whatsappCount > 0) {
    addMatch(matches, {
      id: "rule_external_contact",
      label: "Contatto esterno in contenuto pubblico",
      severity: "high",
      scoreImpact: 22,
      reasonCode: MODERATION_REASON_CODES.EXTERNAL_CONTACT,
    });
  }

  const scamCount = countRegexMatches(lower, MODERATION_CONFIG.patterns.scamRegex);
  if (scamCount > 0) {
    addMatch(matches, {
      id: "rule_scam_keywords",
      label: "Keyword scam/off-platform payment",
      severity: "high",
      scoreImpact: 24,
      reasonCode: MODERATION_REASON_CODES.SCAM_KEYWORDS,
    });
    addMatch(matches, {
      id: "rule_off_platform_payment",
      label: "Richiesta pagamento esterno",
      severity: "high",
      scoreImpact: 22,
      reasonCode: MODERATION_REASON_CODES.OFF_PLATFORM_PAYMENT,
    });
  }

  const phishingCount = countRegexMatches(lower, MODERATION_CONFIG.patterns.phishingRegex);
  if (phishingCount > 0) {
    addMatch(matches, {
      id: "rule_phishing_detected",
      label: "Pattern phishing",
      severity: "critical",
      scoreImpact: 35,
      reasonCode: MODERATION_REASON_CODES.PUBLIC_CONTENT_POLICY_VIOLATION,
    });
  }

  const hateCount = countRegexMatches(lower, MODERATION_CONFIG.patterns.hateSpeechRegex);
  if (hateCount > 0) {
    addMatch(matches, {
      id: "rule_hate_speech_detected",
      label: "Possibile hate speech",
      severity: "critical",
      scoreImpact: 45,
      reasonCode: MODERATION_REASON_CODES.HATE_SPEECH_SIGNAL,
    });
  }

  const threatCount = countRegexMatches(lower, MODERATION_CONFIG.patterns.threatRegex);
  if (threatCount > 0) {
    addMatch(matches, {
      id: "rule_threat_detected",
      label: "Possibile minaccia",
      severity: "critical",
      scoreImpact: 45,
      reasonCode: MODERATION_REASON_CODES.THREAT_SIGNAL,
    });
  }

  const harassmentCount = countRegexMatches(lower, MODERATION_CONFIG.patterns.harassmentRegex);
  if (harassmentCount > 0) {
    addMatch(matches, {
      id: "rule_harassment_detected",
      label: "Possibile harassment",
      severity: "high",
      scoreImpact: 25,
      reasonCode: MODERATION_REASON_CODES.HARASSMENT_SIGNAL,
    });
  }

  const sexualCount = countRegexMatches(lower, MODERATION_CONFIG.patterns.sexualExplicitRegex);
  if (sexualCount > 0) {
    addMatch(matches, {
      id: "rule_sexual_content_detected",
      label: "Contenuto sessuale esplicito testuale",
      severity: "critical",
      scoreImpact: 45,
      reasonCode: MODERATION_REASON_CODES.SEXUAL_CONTENT_SIGNAL,
    });
  }

  const duplicateCount = countRegexMatches(lower, MODERATION_CONFIG.patterns.duplicateTokenRegex);
  if (duplicateCount > 0) {
    addMatch(matches, {
      id: "rule_duplicate_text_detected",
      label: "Pattern testo duplicato",
      severity: "medium",
      scoreImpact: 12,
      reasonCode: MODERATION_REASON_CODES.DUPLICATE_TEXT_PATTERN,
    });
  }

  const marketingCount = countRegexMatches(lower, MODERATION_CONFIG.patterns.suspiciousMarketingRegex);
  if (marketingCount > 0) {
    addMatch(matches, {
      id: "rule_suspicious_marketing",
      label: "Pattern marketing sospetto",
      severity: "medium",
      scoreImpact: 12,
      reasonCode: MODERATION_REASON_CODES.SUSPICIOUS_MARKETING_PATTERN,
    });
  }

  const bannedKeywordsMatched = MODERATION_CONFIG.keywords.banned.filter((keyword) =>
    lower.includes(keyword.toLowerCase())
  );
  if (bannedKeywordsMatched.length > 0) {
    addMatch(matches, {
      id: "rule_banned_keyword_detected",
      label: "Keyword vietata",
      severity: "critical",
      scoreImpact: 35,
      reasonCode: MODERATION_REASON_CODES.BANNED_KEYWORD,
    });
  }

  if (text.length >= 20 && text.length <= 65 && /(?:contattami|scrivimi|solo seri|no perditempo)/i.test(text)) {
    addMatch(matches, {
      id: "rule_vague_listing_pattern",
      label: "Testo sospetto/vago",
      severity: "medium",
      scoreImpact: 10,
      reasonCode: MODERATION_REASON_CODES.SCAM_KEYWORDS,
    });
  }

  const score = Math.min(100, matches.reduce((sum, match) => sum + match.scoreImpact, 0));
  const severity = severityFromScore(score);
  const suggestedDecision = decisionFromScore(score);
  const reasonCodes = uniqueReasonCodes(matches);
  const sanitizedText = redactSensitiveContent(text);

  return {
    score,
    severity,
    matchedRules: matches,
    reasonCodes,
    sanitizedText,
    suggestedDecision,
  };
}

