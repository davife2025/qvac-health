import { createServerClient } from "@supabase/ssr";
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
        setAll(cookiesToSet) {
          // Fix #11: Server Components cannot set cookies — this is expected
          // and should be silent. But Server Actions CAN set cookies, and
          // swallowing their errors would hide real auth failures.
          //
          // Next.js sets request.type internally. We detect the context by
          // checking if cookies().set() throws — in RSC it throws because the
          // response headers are already sent; in Server Actions it succeeds.
          // The original blanket try/catch was hiding Server Action failures.
          //
          // The @supabase/ssr pattern is: attempt the set, catch the RSC
          // "Cannot modify headers" error specifically, re-throw everything else.
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (err) {
            // Only swallow the specific Next.js "headers already sent" error
            // that occurs in Server Components. All other errors propagate.
            if (
              err instanceof Error &&
              err.message.includes("Cannot modify headers")
            ) {
              // Expected in RSC context — middleware handles session refresh
              return;
            }
            throw err;
          }
        },
      },
    }
  );
}
