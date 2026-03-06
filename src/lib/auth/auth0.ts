import "server-only";

import { createHash, randomBytes } from "crypto";

type Auth0Config = {
  domain: string;
  clientId: string;
  clientSecret: string;
  baseUrl: string;
  audience: string | null;
};

type AuthorizeUrlInput = {
  connection: string;
  state: string;
  codeChallenge: string;
  mode: "signin" | "signup";
  loginHint?: string | null;
};

export type Auth0TokenResponse = {
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
};

export type Auth0UserInfo = {
  sub: string;
  email?: string;
  name?: string;
  nickname?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
};

function required(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is missing`);
  }
  return value;
}

export function getAuth0Config(): Auth0Config {
  const domain = required("AUTH0_DOMAIN");
  const clientId = required("AUTH0_CLIENT_ID");
  const clientSecret = required("AUTH0_CLIENT_SECRET");
  const baseUrl =
    process.env.AUTH0_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";

  return {
    domain,
    clientId,
    clientSecret,
    baseUrl,
    audience: process.env.AUTH0_AUDIENCE ?? null,
  };
}

function toBase64Url(input: Buffer) {
  return input
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function generatePkcePair() {
  const verifier = toBase64Url(randomBytes(32));
  const challenge = toBase64Url(createHash("sha256").update(verifier).digest());

  return {
    verifier,
    challenge,
  };
}

export function createAuthState() {
  return toBase64Url(randomBytes(24));
}

export function buildAuth0AuthorizeUrl(input: AuthorizeUrlInput) {
  const config = getAuth0Config();
  const authorizeUrl = new URL(`https://${config.domain}/authorize`);
  const redirectUri = `${config.baseUrl}/api/auth/auth0/callback`;

  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", config.clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("scope", "openid profile email");
  authorizeUrl.searchParams.set("state", input.state);
  authorizeUrl.searchParams.set("code_challenge", input.codeChallenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");
  authorizeUrl.searchParams.set("connection", input.connection);

  if (config.audience) {
    authorizeUrl.searchParams.set("audience", config.audience);
  }

  if (input.mode === "signup") {
    authorizeUrl.searchParams.set("screen_hint", "signup");
  }

  if (input.loginHint) {
    authorizeUrl.searchParams.set("login_hint", input.loginHint);
  }

  return authorizeUrl.toString();
}

export async function exchangeCodeForTokens(params: {
  code: string;
  codeVerifier: string;
}): Promise<Auth0TokenResponse> {
  const config = getAuth0Config();
  const redirectUri = `${config.baseUrl}/api/auth/auth0/callback`;

  const response = await fetch(`https://${config.domain}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code: params.code,
      code_verifier: params.codeVerifier,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Auth0 token exchange failed: ${text}`);
  }

  return (await response.json()) as Auth0TokenResponse;
}

export async function fetchAuth0UserInfo(accessToken: string): Promise<Auth0UserInfo> {
  const config = getAuth0Config();
  const response = await fetch(`https://${config.domain}/userinfo`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Auth0 userinfo failed: ${text}`);
  }

  return (await response.json()) as Auth0UserInfo;
}
