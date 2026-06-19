import Link from "next/link";
import { logout } from "@/lib/auth-actions";
import type { User } from "@qvac-health/types";

interface NavProps {
  user: User | null;
}

export function Nav({ user }: NavProps) {
  return (
    <nav className="border-b border-gray-100 bg-white px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold text-gray-900"
        >
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-calm-600 text-white text-xs font-bold">
            Q
          </span>
          QVAC Health
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              {user.role === "patient" && (
                <Link
                  href="/journal"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Journal
                </Link>
              )}
              {user.role === "clinician" && (
                <Link
                  href="/clinician"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  SOAP Notes
                </Link>
              )}
              <Link
                href="/models"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Models
              </Link>
              <form action={logout}>
                <button
                  type="submit"
                  className="text-sm text-gray-400 hover:text-gray-700"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-sm text-gray-600 hover:text-gray-900"
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
