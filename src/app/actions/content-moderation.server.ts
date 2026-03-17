"use server";

import { moderateContent } from "@/lib/moderation/moderation.service";
import type { ModerationTargetType } from "@/lib/moderation/moderation.types";

type ServerActionModerationInput = {
  targetType: ModerationTargetType;
  text: string;
  entityId?: string;
  actorId?: string;
};

export async function moderatePublicContentAction(input: ServerActionModerationInput) {
  const moderation = await moderateContent({
    targetType: input.targetType,
    text: input.text,
    actorId: input.actorId || null,
    entityId: input.entityId || null,
    context: {
      pathname: "/server-actions/public-content",
      source: "server_action",
      endpointTag: "public_content_server_action",
    },
  });

  if (moderation.shouldBlock) {
    return {
      ok: false,
      status: "blocked",
      message: moderation.userMessage,
      reasonCodes: moderation.reasonCodes,
    };
  }

  if (moderation.shouldReview) {
    return {
      ok: true,
      status: "review",
      message: "Il contenuto è stato inviato e sarà verificato prima della pubblicazione.",
      sanitizedText: moderation.sanitizedText,
      reasonCodes: moderation.reasonCodes,
    };
  }

  return {
    ok: true,
    status: "allowed",
    message: "Operazione completata.",
    sanitizedText: moderation.sanitizedText,
    reasonCodes: moderation.reasonCodes,
  };
}
