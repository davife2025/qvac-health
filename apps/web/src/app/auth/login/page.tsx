import Link from "next/link";
import { login } from "@/lib/auth-actions";

interface LoginPageProps {
  searchParams: Promise<{ error?: string; next?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = params.next ?? "/";

  return (
    <main className="flex min-h-full flex-col items-center justify-center px-4 py-8 sm:py-16">
      <div className="w-full max-w-sm space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center w-12 h-12 rounded-xl
              bg-calm-600 text-white text-xl font-bold shadow-md
              active:scale-95 transition-transform"
          >
            Q
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-500 text-sm">Sign in to your private health space</p>
        </div>

        {/* Error */}
        {params.error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
            {decodeURIComponent(params.error)}
          </div>
        )}

        {/* Form */}
        <form action={login} className="space-y-4">
          <input type="hidden" name="next" value={next} />

          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              autoFocus
              required
              className="input"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="input"
              placeholder="••••••••"
            />
          </div>

          {/* Full-width, min 48px tall for touch */}
          <button
            type="submit"
            className="btn-primary w-full mt-2 min-h-[48px] text-base"
          >
            Sign in
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/signup"
            className="font-medium text-calm-600 hover:text-calm-700 underline-offset-2 hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
