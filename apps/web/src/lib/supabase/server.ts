import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        // Explicit type — same fix as middleware.ts, applied preemptively
        // here since this file has the identical setAll(cookiesToSet) shape.
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: CookieOptions;
          }[]
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (err) {
            // Only swallow the specific Next.js "headers already sent" error
            // that occurs in Server Component (RSC) context. All other
            // errors propagate — Server Actions need to know if this fails.
            if (
              err instanceof Error &&
              err.message.includes("Cannot modify headers")
            ) {
              return;
            }
            throw err;
          }
        },
      },
    }
  );
}
