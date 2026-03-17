import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase-admin";
import { checkRateLimitDetailed, RateLimitResponse } from "@/lib/rate-limit";
import { AbuseGuardResponse, enforceAbuseGuard } from "@/lib/security/abuse-guards";
import { verifyOnboardingSessionProof } from "@/lib/internal-auth/onboarding-session";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function extFromType(type: string) {
  if (type === "image/jpeg") return "jpg";
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";
  return "bin";
}

function detectImageMimeFromMagic(bytes: Uint8Array) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  if (
    bytes.length >= 6 &&
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38 &&
    (bytes[4] === 0x37 || bytes[4] === 0x39) &&
    bytes[5] === 0x61
  ) {
    return "image/gif";
  }

  return null;
}

export async function POST(request: Request) {
  const rateLimit = checkRateLimitDetailed(request, { action: "internal_onboarding_avatar_upload" });
  if (!rateLimit.allowed) return RateLimitResponse(rateLimit);

  const abuseGuard = await enforceAbuseGuard({
    request,
    action: "internal_onboarding_avatar_upload",
    endpointGroup: "auth",
  });
  if (!abuseGuard.allowed) return AbuseGuardResponse(abuseGuard);

  const form = await request.formData().catch(() => null);
  const sessionId = String(form?.get("sessionId") || "").trim();
  const onboardingSessionToken = String(form?.get("onboardingSessionToken") || "").trim();
  const file = form?.get("file");

  if (!sessionId || !UUID_V4_REGEX.test(sessionId)) {
    return NextResponse.json({ ok: false, error: "Invalid session id." }, { status: 400 });
  }

  const validSessionProof = verifyOnboardingSessionProof({
    sessionId,
    token: onboardingSessionToken,
  });
  if (!validSessionProof) {
    return NextResponse.json({ ok: false, error: "Invalid onboarding session." }, { status: 403 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Missing file." }, { status: 400 });
  }

  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ ok: false, error: "Unsupported image type." }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ ok: false, error: "Image too large (max 5MB)." }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  const detectedMime = detectImageMimeFromMagic(new Uint8Array(buffer));
  if (!detectedMime || detectedMime !== file.type || !ALLOWED_MIME.has(detectedMime)) {
    return NextResponse.json({ ok: false, error: "Invalid image payload." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: existingLead, error: leadReadError } = await admin
    .from("onboarding_leads")
    .select("avatar_url")
    .eq("session_id", sessionId)
    .maybeSingle<{ avatar_url: string | null }>();
  if (leadReadError) {
    return NextResponse.json({ ok: false, error: "Unable to verify avatar state." }, { status: 500 });
  }
  if (existingLead?.avatar_url) {
    return NextResponse.json({ ok: false, error: "Avatar already uploaded for this session." }, { status: 409 });
  }

  const ext = extFromType(detectedMime);
  const path = `onboarding/${sessionId}/avatar-${Date.now()}-${randomUUID()}.${ext}`;

  const { error: uploadError } = await admin.storage
    .from("avatars")
    .upload(path, buffer, {
      contentType: detectedMime,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ ok: false, error: "Unable to upload avatar." }, { status: 500 });
  }

  const { data } = admin.storage.from("avatars").getPublicUrl(path);
  return NextResponse.json({ ok: true, avatarUrl: data.publicUrl });
}
