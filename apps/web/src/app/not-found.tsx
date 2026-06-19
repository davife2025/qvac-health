import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center px-4 py-16">
      <div className="text-center space-y-4 max-w-sm">
        <p className="text-6xl font-bold text-calm-200">404</p>
        <h1 className="text-xl font-bold text-gray-900">Page not found</h1>
        <p className="text-sm text-gray-500">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link href="/" className="btn-primary inline-flex">
          Go home
        </Link>
      </div>
    </main>
  );
}
