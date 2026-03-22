import { MODERATION_REASON_CODES } from "@/lib/domains/moderation/moderation.reason-codes";
import type { ModerationInput, ModerationReasonCode } from "@/lib/domains/moderation/moderation.types";

function normalizeRoute(pathname: string | null | undefined) {
  return String(pathname || "").trim().toLowerCase();
}

export function isInboxRoute(pathname: string): boolean {
  const normalized = normalizeRoute(pathname);
  if (!normalized) return false;

  return (
    normalized === "/inbox" ||
    normalized.startsWith("/inbox/") ||
    normalized.startsWith("/api/inbox") ||
    normalized.startsWith("/api/chat/messages") ||
    normalized.startsWith("/api/dm") ||
    normalized.startsWith("/api/messages/private")
  );
}

export function shouldSkipModeration(input: ModerationInput): {
  skip: boolean;
  skippedBecauseInbox: boolean;
  reasonCode: ModerationReasonCode | null;
} {
  const routePath = normalizeRoute(input.context?.pathname || "");
  const endpointTag = normalizeRoute(input.context?.endpointTag || "");
  const routeGroup = normalizeRoute(input.context?.routeGroup || "");

  const inboxRoute =
    isInboxRoute(routePath) ||
    endpointTag.includes("inbox") ||
    endpointTag.includes("private") ||
    routeGroup === "inbox";

  if (inboxRoute || input.context?.isPrivateMessage === true) {
    return {
      skip: true,
      skippedBecauseInbox: true,
      reasonCode: MODERATION_REASON_CODES.INBOX_ROUTE_EXCLUDED,
    };
  }

  return {
    skip: false,
    skippedBecauseInbox: false,
    reasonCode: null,
  };
}

