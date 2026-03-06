import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getAuth0Config } from "@/lib/auth/auth0";

export async function POST(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  const response = NextResponse.json({ ok: true, redirectTo: loginUrl.toString() });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  await supabase.auth.signOut();
  response.cookies.set("wm_auth0_tx", "", { path: "/", maxAge: 0 });
  response.cookies.set("wm_signup_context", "", { path: "/", maxAge: 0 });

  try {
    const auth0 = getAuth0Config();
    const returnTo = loginUrl.toString();
    const auth0Logout = new URL(`https://${auth0.domain}/v2/logout`);
    auth0Logout.searchParams.set("client_id", auth0.clientId);
    auth0Logout.searchParams.set("returnTo", returnTo);
    response.headers.set("x-auth0-logout-url", auth0Logout.toString());
  } catch {
    // Auth0 is optional in non-configured environments.
  }

  return response;
}

