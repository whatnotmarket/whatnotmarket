import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: NextRequest) {
  const marketUrl = new URL("/market", request.url);
  const response = NextResponse.json({ ok: true, redirectTo: marketUrl.toString() });

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
  response.cookies.set("wm_signup_context", "", { path: "/", maxAge: 0 });
  response.cookies.set("admin_token", "", { path: "/", maxAge: 0 });

  return response;
}
