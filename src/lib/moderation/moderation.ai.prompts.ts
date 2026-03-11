import type { ModerationClassifierInput } from "@/lib/moderation/moderation.ai.types";

export function buildModerationSystemPrompt() {
  return [
    "Sei un classificatore di contenuti per la moderazione di un marketplace con contenuti pubblici o semi-pubblici.",
    "Analizza solo il testo fornito e classifica il rischio.",
    "Non riscrivere il testo, non fare conversazione.",
    "Rispondi esclusivamente con JSON valido e senza testo extra.",
    'Il JSON deve contenere: decision ("allow"|"flag"|"review"|"block"), score (0-100), severity ("low"|"medium"|"high"|"critical"), categories (array), reasonCodes (array), confidence (0-1), explanation (string breve), sanitizedText opzionale, shouldReview boolean, shouldBlock boolean.',
    "Rileva: spam, scam, tentativi di contatto esterno, richieste di pagamento fuori piattaforma, phishing, harassment, hate speech, minacce, contenuti sessuali testuali, promozione abusiva, linguaggio sospetto/fraudolento.",
    "Gestisci italiano, inglese, slang e tentativi di evasione con parole spezzate/simboli.",
    "Se ci sono inviti a uscire dalla piattaforma o pagamenti esterni, considera rischio alto.",
    "Se il contenuto e chiaramente abusivo o illecito, block.",
    "Se ambiguo ma sospetto, review.",
    "Non inserire markdown, commenti, backticks o testo libero.",
  ].join("\n");
}

export function buildModerationUserPrompt(input: ModerationClassifierInput) {
  const payload = {
    targetType: input.targetType,
    route: input.route,
    context: "public_or_semi_public_content",
    language: input.language || "unknown",
    text: input.text,
    metadata: input.metadata || {},
    allowedCategories: [
      "spam",
      "scam",
      "off_platform_contact_attempt",
      "off_platform_payment_request",
      "phishing",
      "harassment",
      "hate_speech",
      "threat",
      "sexual_textual_content",
      "abusive_promotion",
      "suspicious_listing_language",
      "suspicious_public_profile_content",
      "risky_but_uncertain",
    ],
  };

  return JSON.stringify(payload);
}
