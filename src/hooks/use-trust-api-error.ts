"use client";

import { useMemo } from "react";

type TrustApiLikeError = {
  error?: string;
  reason?: string;
  code?: string;
  message?: string;
};

const defaultText = "Operazione non disponibile per motivi di sicurezza.";

const codeToMessage: Record<string, string> = {
  ACCOUNT_SUSPENDED: "Account temporaneamente sospeso per verifiche di sicurezza.",
  EMAIL_VERIFICATION_REQUIRED: "Verifica la tua email per continuare.",
  NEW_ACCOUNT_LISTING_LIMIT: "Hai raggiunto il limite annunci giornaliero per account nuovi.",
  NEW_ACCOUNT_MESSAGE_LIMIT: "Hai raggiunto il limite messaggi giornaliero per account nuovi.",
  NEW_ACCOUNT_OFFER_LIMIT: "Hai raggiunto il limite offerte giornaliero per account nuovi.",
  CONVERSATION_MESSAGE_BLOCKED: "Messaggio bloccato: non condividere contatti esterni o pagamenti fuori piattaforma.",
  LISTING_BLOCKED: "Annuncio bloccato dal sistema Trust & Safety.",
  LISTING_REVIEW_REQUIRED: "Annuncio in verifica manuale prima della pubblicazione.",
  UNDER_REVIEW_RESTRICTION: "Account in revisione sicurezza: alcune azioni sono temporaneamente limitate.",
};

export function useTrustApiError(errorPayload: TrustApiLikeError | null | undefined) {
  return useMemo(() => {
    if (!errorPayload) return null;

    const code = String(errorPayload.code || "").trim();
    const fromCode = code ? codeToMessage[code] : null;
    if (fromCode) return fromCode;

    const parts = [errorPayload.error, errorPayload.reason, errorPayload.message]
      .map((value) => String(value || "").trim())
      .filter(Boolean);

    if (parts.length > 0) return parts[0];
    return defaultText;
  }, [errorPayload]);
}
