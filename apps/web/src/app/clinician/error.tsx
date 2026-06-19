"use client";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RouteError({ error, reset }: ErrorProps) {
  return (
    <div className="max-w-lg mx-auto mt-16 card text-center space-y-4 p-8">
      <div className="text-3xl">😔</div>
      <h2 className="font-bold text-gray-900">Something went wrong</h2>
      <p className="text-sm text-gray-500">{error.message}</p>
      <div className="flex gap-3 justify-center">
        <button onClick={reset} className="btn-primary text-sm">Try again</button>
        <a href="/" className="btn-secondary text-sm">Go home</a>
      </div>
    </div>
  );
}
