import { submitToIndexNow } from "@/lib/app/seo/indexnow";
import { moderateContent } from "@/lib/domains/moderation/moderation.service";
import { AbuseGuardResponse,enforceAbuseGuard } from "@/lib/domains/security/abuse-guards";
import { isReservedProfileHandle,normalizeProfileHandle } from "@/lib/domains/security/identity-guards";
import { checkRateLimitDetailed,RateLimitResponse } from "@/lib/infra/security/rate-limit";
import { createClient } from "@/lib/infra/supabase/supabase-server";
import { NextResponse } from "next/server";
import { z } from "zod";

const updatePublicProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  username: z.string().trim().min(3).max(30).optional(),
  bio: z.string().trim().max(500).optional(),
});

export async function POST(request: Request) {
  const rateLimit = checkRateLimitDetailed(request, { action: "profile_public_update" });
  if (!rateLimit.allowed) {
    return RateLimitResponse(rateLimit);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const abuseGuard = await enforceAbuseGuard({
    request,
    action: "profile_public_update",
    endpointGroup: "profile",
    userId: user.id,
  });
  if (!abuseGuard.allowed) {
    return AbuseGuardResponse(abuseGuard);
  }

  const parsed = updatePublicProfileSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid profile payload" }, { status: 400 });
  }

  const payload = parsed.data;
  const normalizedUsername =
    typeof payload.username === "string" && payload.username.trim()
      ? normalizeProfileHandle(payload.username)
      : null;

  if (normalizedUsername && isReservedProfileHandle(normalizedUsername)) {
    return NextResponse.json(
      {
        ok: false,
        code: "PUBLIC_CONTENT_POLICY_VIOLATION",
        error: "Alcuni elementi del testo non sono consentiti.",
      },
      { status: 400 }
    );
  }

  const moderationChecks = await Promise.all([
    payload.fullName
      ? moderateContent({
          targetType: "generic_public_text",
          text: payload.fullName,
          actorId: user.id,
          entityId: user.id,
          context: {
            pathname: "/api/profile/public/update",
            source: "route_handler",
            endpointTag: "profile_public_update",
          },
        })
      : null,
    normalizedUsername
      ? moderateContent({
          targetType: "username",
          text: normalizedUsername,
          actorId: user.id,
          entityId: user.id,
          context: {
            pathname: "/api/profile/public/update",
            source: "route_handler",
            endpointTag: "profile_public_update",
          },
        })
      : null,
    payload.bio
      ? moderateContent({
          targetType: "profile_bio",
          text: payload.bio,
          actorId: user.id,
          entityId: user.id,
          context: {
            pathname: "/api/profile/public/update",
            source: "route_handler",
            endpointTag: "profile_public_update",
          },
        })
      : null,
  ]);

  const filteredChecks = moderationChecks.filter(Boolean);
  const blockResult = filteredChecks.find((result) => result?.shouldBlock);
  if (blockResult) {
    return NextResponse.json(
      {
        ok: false,
        code: "PUBLIC_CONTENT_POLICY_VIOLATION",
        error: blockResult.userMessage,
        reasonCodes: blockResult.reasonCodes,
      },
      { status: 400 }
    );
  }

  const reviewResult = filteredChecks.find((result) => result?.shouldReview);
  if (reviewResult) {
    return NextResponse.json(
      {
        ok: true,
        reviewRequired: true,
        message: "Il contenuto Ã¨ stato inviato e sarÃ  verificato prima della pubblicazione.",
        reasonCodes: reviewResult.reasonCodes,
      },
      { status: 202 }
    );
  }

  const updatePayload: Record<string, unknown> = {};
  if (payload.fullName) {
    const fullNameCheck = moderationChecks[0];
    updatePayload.full_name = fullNameCheck?.sanitizedText || payload.fullName;
  }
  if (normalizedUsername) {
    const usernameCheck = moderationChecks[1];
    updatePayload.username = usernameCheck?.sanitizedText || normalizedUsername;
  }
  if (payload.bio !== undefined) {
    const bioCheck = moderationChecks[2];
    updatePayload.bio = bioCheck?.sanitizedText || payload.bio || null;
  }

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({ ok: false, error: "Nothing to update" }, { status: 400 });
  }

  const { error } = await supabase.from("profiles").update(updatePayload).eq("id", user.id);
  if (error) {
    return NextResponse.json({ ok: false, error: "Unable to update profile" }, { status: 500 });
  }

  // Submit to IndexNow if username changed or public profile updated
  if (user.id) {
    submitToIndexNow(`/profile/${user.id}`).catch((err) =>
      console.error("IndexNow background submit error:", err)
    );
    // Also submit handle-based URL if username exists
    if (updatePayload.username) {
        const handle = String(updatePayload.username).replace(/^@+/, "");
        submitToIndexNow(`/seller/@${handle}`).catch((err) =>
            console.error("IndexNow background submit error (handle):", err)
        );
    }
  }

  return NextResponse.json({
    ok: true,
    message: "Operazione completata.",
  });
}

