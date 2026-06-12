import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full text-center space-y-8">
        {/* Logo / brand */}
        <div className="space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-calm-600 text-white text-2xl font-bold shadow-lg">
            Q
          </div>
          <h1 className="text-3xl font-bold text-gray-900">QVAC Health</h1>
          <p className="text-gray-500 text-base leading-relaxed">
            A private mental health companion powered by{" "}
            <span className="font-medium text-calm-700">local AI</span>.
            <br />
            Your thoughts never leave your device.
          </p>
        </div>

        {/* Privacy badge */}
        <div className="inline-flex items-center gap-2 rounded-full bg-sage-50 px-4 py-2 text-sm text-sage-700 ring-1 ring-sage-200">
          <span>🔒</span>
          <span>100% on-device — zero cloud inference</span>
        </div>

        {/* Role selection */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link href="/journal" className="card hover:shadow-md transition-shadow group text-left">
            <div className="text-2xl mb-3">📔</div>
            <h2 className="font-semibold text-gray-900 group-hover:text-calm-700 transition-colors">
              Patient
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Journal, track your mood, and get compassionate AI reflections
            </p>
          </Link>

          <Link href="/clinician" className="card hover:shadow-md transition-shadow group text-left">
            <div className="text-2xl mb-3">🩺</div>
            <h2 className="font-semibold text-gray-900 group-hover:text-calm-700 transition-colors">
              Clinician
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Generate structured SOAP notes from session transcripts locally
            </p>
          </Link>
        </div>

        {/* Powered by QVAC */}
        <p className="text-xs text-gray-400">
          Powered by{" "}
          <a
            href="https://qvac.tether.io"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gray-600"
          >
            QVAC SDK
          </a>{" "}
          · MIT License · Open Source
        </p>
      </div>
    </main>
  );
}
