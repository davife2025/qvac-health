"use client";

import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("[QVAC Health] Unhandled error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-calm-50 px-4">
        <div className="max-w-md w-full card text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <h1 className="text-lg font-bold text-gray-900">Something went wrong</h1>
          <p className="text-sm text-gray-500">
            {error.message ?? "An unexpected error occurred."}
          </p>
          {error.digest && (
            <p className="text-xs text-gray-300 font-mono">ref: {error.digest}</p>
          )}
          <div className="flex gap-3 justify-center pt-2">
            <button onClick={reset} className="btn-primary text-sm">
              Try again
            </button>
            <a href="/" className="btn-secondary text-sm">
              Go home
            </a>
          </div>
          <p className="text-xs text-gray-300">
            All your data remains safely on your device
          </p>
        </div>
      </body>
    </html>
  );
}
