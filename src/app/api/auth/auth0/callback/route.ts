import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { applyRoleAssignmentForUser } from "@/lib/auth/role-assignment";
import { ensureBridgeUser, signInBridgeUserOnRoute } from "@/lib/auth/bridge";
import { exchangeCodeForTokens, fetchAuth0UserInfo } from "@/lib/auth/auth0";

type TxCookie = {
  state: string;
  verifier: string;
  mode: "signin" | "signup";
  nextPath: string;
  provider: string;
  desiredRole: "buyer" | "seller";
  inviteCode: string | null;
};

function parseTx(raw: string | undefined): TxCookie | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TxCookie;
  } catch {
    return null;
  }
}

function redirectToLogin(request: NextRequest, params: Record<string, string>) {
  const url = new URL("/login", request.url);
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  return url;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const authError = request.nextUrl.searchParams.get("error");
  const authErrorDescription = request.nextUrl.searchParams.get("error_description");

  const tx = parseTx(request.cookies.get("wm_auth0_tx")?.value);

  if (!tx) {
    return NextResponse.redirect(
      redirectToLogin(request, {
        auth_status: "error",
        auth_message: "Missing auth transaction context.",
      })
    );
  }

  if (authError) {
    const response = NextResponse.redirect(
      redirectToLogin(request, {
        auth_status: "cancelled",
        auth_message: authErrorDescription || authError,
      })
    );
    response.cookies.set("wm_auth0_tx", "", { path: "/", maxAge: 0 });
    return response;
  }

  if (!code || !state || state !== tx.state) {
    const response = NextResponse.redirect(
      redirectToLogin(request, {
        auth_status: "error",
        auth_message: "Auth callback state mismatch.",
      })
    );
    response.cookies.set("wm_auth0_tx", "", { path: "/", maxAge: 0 });
    return response;
  }

  try {
    const tokenResponse = await exchangeCodeForTokens({
      code,
      codeVerifier: tx.verifier,
    });
    const userInfo = await fetchAuth0UserInfo(tokenResponse.access_token);

    const bridgeIdentity = await ensureBridgeUser({
      subject: userInfo.sub,
      provider: tx.provider,
      email: userInfo.email ?? null,
      fullName: userInfo.name ?? userInfo.nickname ?? null,
      avatarUrl: userInfo.picture ?? null,
    });

    let roleMessage: string | null = null;
    if (tx.mode === "signup") {
      const assignment = await applyRoleAssignmentForUser({
        userId: bridgeIdentity.userId,
        email: bridgeIdentity.email,
        desiredRole: tx.desiredRole,
        inviteCode: tx.inviteCode,
      });
      roleMessage = assignment.message;
    }

    const nextUrl = new URL("/login", request.url);
    nextUrl.searchParams.set("next", tx.nextPath || "/market");
    nextUrl.searchParams.set("auth_status", "success");
    if (roleMessage) {
      nextUrl.searchParams.set("auth_message", roleMessage);
    }

    const response = NextResponse.redirect(nextUrl);
    await signInBridgeUserOnRoute({
      request,
      response,
      email: bridgeIdentity.email,
      password: bridgeIdentity.password,
    });

    response.cookies.set("wm_auth0_tx", "", { path: "/", maxAge: 0 });
    return response;
  } catch (error) {
    const response = NextResponse.redirect(
      redirectToLogin(request, {
        auth_status: "error",
        auth_message: error instanceof Error ? error.message : "Auth callback failed",
      })
    );
    response.cookies.set("wm_auth0_tx", "", { path: "/", maxAge: 0 });
    return response;
  }
}
