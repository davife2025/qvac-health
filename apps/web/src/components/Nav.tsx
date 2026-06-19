import Link from "next/link";
import { logout } from "@/lib/auth-actions";
import type { User } from "@qvac-health/types";

interface NavProps {
  user: User | null;
}

export function Nav({ user }: NavProps) {
  return (
    <nav className="border-b border-gray-100 bg-white px-4 py-3 sticky top-0 z-10 backdrop-blur-sm bg-white/90">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold text-gray-900"
        >
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-calm-600 text-white text-xs font-bold shrink-0">
            Q
          </span>
          <span className="hidden sm:inline">QVAC Health</span>
        </Link>

        {/* Right nav */}
        <div className="flex items-center gap-1 sm:gap-3">
          {user ? (
            <>
              {user.role === "patient" && (
                <Link
                  href="/journal"
                  className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                  Journal
                </Link>
              )}
              {user.role === "clinician" && (
                <Link
                  href="/clinician"
                  className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                  SOAP Notes
                </Link>
              )}
              <Link
                href="/models"
                className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors hidden sm:block"
              >
                Models
              </Link>
              <Link
                href="/settings"
                className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                title="Settings"
              >
                <span className="sm:hidden">⚙️</span>
                <span className="hidden sm:inline">Settings</span>
              </Link>
              <form action={logout}>
                <button
                  type="submit"
                  className="rounded-lg px-3 py-1.5 text-sm text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                >
                  <span className="sm:hidden">↩</span>
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Sign in
              </Link>
              <Link href="/auth/signup" className="btn-primary text-xs py-1.5 px-3">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
