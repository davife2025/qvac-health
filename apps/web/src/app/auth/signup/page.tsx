import Link from "next/link";
import { signup } from "@/lib/auth-actions";

interface SignupPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;

  return (
    <main className="flex min-h-full flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-calm-600 text-white text-xl font-bold shadow-md"
          >
            Q
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-gray-500 text-sm">
            Private by design. Your data stays on your device.
          </p>
        </div>

        {/* Error */}
        {params.error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
            {decodeURIComponent(params.error)}
          </div>
        )}

        {/* Form */}
        <form action={signup} className="space-y-4">
          {/* Role selection */}
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-gray-700">I am a…</legend>
            <div className="grid grid-cols-2 gap-3">
              <label className="relative flex cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="patient"
                  defaultChecked
                  className="peer sr-only"
                />
                <div className="flex w-full flex-col items-center gap-1 rounded-xl border-2 border-gray-200 px-4 py-3 text-center transition-colors peer-checked:border-calm-500 peer-checked:bg-calm-50">
                  <span className="text-xl">📔</span>
                  <span className="text-sm font-medium text-gray-700">Patient</span>
                </div>
              </label>

              <label className="relative flex cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="clinician"
                  className="peer sr-only"
                />
                <div className="flex w-full flex-col items-center gap-1 rounded-xl border-2 border-gray-200 px-4 py-3 text-center transition-colors peer-checked:border-calm-500 peer-checked:bg-calm-50">
                  <span className="text-xl">🩺</span>
                  <span className="text-sm font-medium text-gray-700">Clinician</span>
                </div>
              </label>
            </div>
          </fieldset>

          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
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
              autoComplete="new-password"
              minLength={8}
              required
              className="input"
              placeholder="8+ characters"
            />
          </div>

          <button type="submit" className="btn-primary w-full mt-2">
            Create account
          </button>
        </form>

        {/* Privacy note */}
        <div className="rounded-xl bg-sage-50 px-4 py-3 text-xs text-sage-700 space-y-1">
          <p className="font-medium">🔒 Privacy-first architecture</p>
          <p>
            Only your email and account metadata are stored in our database.
            All health content stays on your device.
          </p>
        </div>

        <p className="text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-calm-600 hover:text-calm-700"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
