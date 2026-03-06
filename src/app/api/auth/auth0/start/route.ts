import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  buildAuth0AuthorizeUrl,
  createAuthState,
  generatePkcePair,
} from "@/lib/auth/auth0";
import {
  getAuth0ConnectionForProvider,
  isAuthProviderId,
  type AuthMode,
} from "@/lib/auth/provider-catalog";
import { resolveInviteCode } from "@/lib/invite-codes";

type StartAuthPayload = {
  provider?: string;
  mode?: AuthMode;
  next?: string;
  email?: string;
  inviteCode?: string;
};

function normalizeNext(raw: string | undefined) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/market";
  }
  return raw;
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as StartAuthPayload;
  const providerRaw = payload.provider ?? "";
  const mode = payload.mode === "signup" ? "signup" : "signin";

  if (!isAuthProviderId(providerRaw)) {
    return NextResponse.json({ error: "Unsupported auth provider" }, { status: 400 });
  }

  const provider = providerRaw;
  const connection = getAuth0ConnectionForProvider(provider);

  if (!connection) {
    return NextResponse.json(
      {
        error: `${provider} provider is not configured`,
      },
      { status: 400 }
    );
  }

  const nextPath = normalizeNext(payload.next);
  const loginHint = payload.email?.trim().toLowerCase() || null;
  const inviteCode = payload.inviteCode?.trim().toUpperCase() || null;

  let desiredRole: "buyer" | "seller" = "buyer";

  if (mode === "signup") {
    const inviteResolution = resolveInviteCode(inviteCode);
    if (!inviteResolution.isValid) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 400 });
    }
    desiredRole = inviteResolution.role;
  }

  const state = createAuthState();
  const pkce = generatePkcePair();
  let redirectUrl = "";
  try {
    redirectUrl = buildAuth0AuthorizeUrl({
      connection,
      state,
      codeChallenge: pkce.challenge,
      mode,
      loginHint,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Auth0 configuration error" },
      { status: 500 }
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(
    "wm_auth0_tx",
    JSON.stringify({
      state,
      verifier: pkce.verifier,
      mode,
      nextPath,
      provider,
      loginHint,
      desiredRole,
      inviteCode,
    }),
    {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 10,
    }
  );

  return NextResponse.json({
    redirectUrl,
  });
}
