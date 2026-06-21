import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        // Fix: explicit type on cookiesToSet — TypeScript's strict mode
        // (enforced fully in `next build`, more lenient in `next dev`)
        // requires every parameter to be typed. The array elements match
        // the shape @supabase/ssr expects: name, value, and cookie options.
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: CookieOptions;
          }[]
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — must NOT use this result alone to gate routes
  // (use getUser() in the guard below for security)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes
  const path = request.nextUrl.pathname;
  const isProtected =
    path.startsWith("/journal") || path.startsWith("/clinician");
  const isAuthPage =
    path.startsWith("/auth/login") || path.startsWith("/auth/signup");

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
