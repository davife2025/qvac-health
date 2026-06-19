import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  // Fix #5: use NEXT_PUBLIC_SITE_URL as the redirect base so we always
  // get the public-facing HTTPS URL, not the internal http://localhost
  // origin that Next.js may report when behind a reverse proxy.
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(".supabase.co", "") ?? // fallback
    new URL(request.url).origin; // last resort

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const role = data.user.user_metadata?.role ?? "patient";

      // Ensure profile row exists (idempotent — trigger 002 also handles this)
      await supabase.from("users").upsert({
        id: data.user.id,
        email: data.user.email!,
        role,
      });

      return NextResponse.redirect(`${siteUrl}${next}`);
    }
  }

  return NextResponse.redirect(
    `${siteUrl}/auth/login?error=${encodeURIComponent("Email confirmation failed")}`
  );
}
