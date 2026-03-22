import { TRUST_SAFETY_CONFIG } from "@/lib/domains/trust/config";
import { normalizeWhitespace } from "@/lib/domains/trust/utils";

type MatchScan = {
  count: number;
  matches: string[];
};

function scanRegex(text: string, regex: RegExp): MatchScan {
  const source = normalizeWhitespace(text);
  const flags = regex.flags.includes("g") ? regex.flags : `${regex.flags}g`;
  const globalRegex = new RegExp(regex.source, flags);
  const matches = Array.from(source.matchAll(globalRegex))
    .map((match) => match[0])
    .filter(Boolean) as string[];
  return {
    count: matches.length,
    matches,
  };
}

export type ChatPatternSignals = {
  containsExternalLink: boolean;
  containsEmail: boolean;
  containsPhone: boolean;
  containsExternalHandle: boolean;
  offPlatformRedirectSignal: boolean;
  depositOrAdvancePaymentSignal: boolean;
  urgencyManipulationSignal: boolean;
  phishingSignal: boolean;
  externalContactCount: number;
  suspiciousKeywordHits: number;
};

export function detectChatPatternSignals(message: string): ChatPatternSignals {
  const normalized = normalizeWhitespace(message).toLowerCase();
  const urlMatches = scanRegex(normalized, TRUST_SAFETY_CONFIG.patterns.urlRegex);
  const emailMatches = scanRegex(normalized, TRUST_SAFETY_CONFIG.patterns.emailRegex);
  const phoneMatches = scanRegex(normalized, TRUST_SAFETY_CONFIG.patterns.phoneRegex);
  const telegramMatches = scanRegex(normalized, TRUST_SAFETY_CONFIG.patterns.telegramRegex);
  const whatsappMatches = scanRegex(normalized, TRUST_SAFETY_CONFIG.patterns.whatsappRegex);
  const discordMatches = scanRegex(normalized, TRUST_SAFETY_CONFIG.patterns.discordRegex);
  const instagramMatches = scanRegex(normalized, TRUST_SAFETY_CONFIG.patterns.instagramRegex);
  const suspiciousKeywordMatches = scanRegex(normalized, TRUST_SAFETY_CONFIG.patterns.suspiciousKeywordRegex);
  const externalPaymentMatches = scanRegex(normalized, TRUST_SAFETY_CONFIG.patterns.externalPaymentRegex);
  const urgencyMatches = scanRegex(normalized, TRUST_SAFETY_CONFIG.patterns.urgencyRegex);
  const phishingMatches = scanRegex(normalized, TRUST_SAFETY_CONFIG.patterns.phishingRegex);

  const externalHandles =
    telegramMatches.count + whatsappMatches.count + discordMatches.count + instagramMatches.count;
  const externalContactCount =
    urlMatches.count + emailMatches.count + phoneMatches.count + externalHandles;

  return {
    containsExternalLink: urlMatches.count > 0,
    containsEmail: emailMatches.count > 0,
    containsPhone: phoneMatches.count > 0,
    containsExternalHandle: externalHandles > 0,
    offPlatformRedirectSignal: externalHandles > 0 || externalPaymentMatches.count > 0,
    depositOrAdvancePaymentSignal: suspiciousKeywordMatches.count > 0 || externalPaymentMatches.count > 0,
    urgencyManipulationSignal: urgencyMatches.count > 0,
    phishingSignal: phishingMatches.count > 0,
    externalContactCount,
    suspiciousKeywordHits: suspiciousKeywordMatches.count + externalPaymentMatches.count,
  };
}

export type ListingPatternSignals = {
  hasExternalContact: boolean;
  requestsOffPlatformPayment: boolean;
  suspiciousKeywordHits: number;
  vagueDescriptionSignal: boolean;
};

export function detectListingPatternSignals(input: { title: string; description: string }): ListingPatternSignals {
  const merged = `${input.title} ${input.description}`;
  const chatSignals = detectChatPatternSignals(merged);
  const normalizedDescription = normalizeWhitespace(input.description).toLowerCase();
  const vagueDescriptionSignal = TRUST_SAFETY_CONFIG.keywords.vagueListing.some((keyword) =>
    normalizedDescription.includes(keyword)
  );

  return {
    hasExternalContact:
      chatSignals.containsExternalLink ||
      chatSignals.containsEmail ||
      chatSignals.containsPhone ||
      chatSignals.containsExternalHandle,
    requestsOffPlatformPayment: chatSignals.depositOrAdvancePaymentSignal || chatSignals.offPlatformRedirectSignal,
    suspiciousKeywordHits: chatSignals.suspiciousKeywordHits,
    vagueDescriptionSignal,
  };
}

export function redactExternalContact(text: string) {
  let output = normalizeWhitespace(text);
  output = output.replace(TRUST_SAFETY_CONFIG.patterns.emailRegex, "[email-hidden]");
  output = output.replace(TRUST_SAFETY_CONFIG.patterns.phoneRegex, "[phone-hidden]");
  output = output.replace(TRUST_SAFETY_CONFIG.patterns.urlRegex, "[link-hidden]");
  output = output.replace(TRUST_SAFETY_CONFIG.patterns.telegramRegex, "[external-handle-hidden]");
  output = output.replace(TRUST_SAFETY_CONFIG.patterns.whatsappRegex, "[external-handle-hidden]");
  output = output.replace(TRUST_SAFETY_CONFIG.patterns.discordRegex, "[external-handle-hidden]");
  output = output.replace(TRUST_SAFETY_CONFIG.patterns.instagramRegex, "[external-handle-hidden]");
  return output;
}

