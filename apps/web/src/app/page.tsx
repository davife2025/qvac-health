import Link from "next/link";
import { getUserProfile } from "@/lib/auth-actions";

export default async function HomePage() {
  const user = await getUserProfile();
  const destination = user
    ? user.role === "clinician"
      ? "/clinician"
      : "/journal"
    : null;

  return (
    <main className="flex min-h-full flex-col items-center justify-center px-4 py-12">
      <div className="max-w-xl w-full space-y-10 text-center">

        {/* Hero */}
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-calm-600 text-white text-2xl font-bold shadow-lg">
            Q
          </div>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
            Mental health AI that<br />
            <span className="text-calm-600">never leaves your device</span>
          </h1>
          <p className="text-gray-500 text-base leading-relaxed max-w-md mx-auto">
            On-device LLM inference, semantic memory, and clinical documentation —
            powered by the QVAC SDK. Zero cloud. Zero cost per inference.
            Complete privacy.
          </p>
        </div>

        {/* Privacy badge strip */}
        <div className="flex flex-wrap justify-center gap-2">
          {[
            "🔒 On-device inference",
            "🧠 MedPsy-tuned models",
            "🔍 Local semantic search",
            "☁️ Metadata-only cloud",
          ].map((badge) => (
            <span
              key={badge}
              className="inline-flex items-center rounded-full bg-calm-50 px-3 py-1 text-xs font-medium text-calm-700 ring-1 ring-calm-100"
            >
              {badge}
            </span>
          ))}
        </div>

        {/* CTA */}
        {destination ? (
          <div className="space-y-3">
            <Link href={destination} className="btn-primary text-base px-8 py-3 w-full sm:w-auto inline-flex justify-center">
              {user?.role === "clinician" ? "Open SOAP Notes →" : "Open Journal →"}
            </Link>
            <p className="text-xs text-gray-400">
              Signed in as {user?.email}
            </p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/signup" className="btn-primary text-base px-8 py-3">
              Get started — free
            </Link>
            <Link href="/auth/login" className="btn-secondary text-base px-8 py-3">
              Sign in
            </Link>
          </div>
        )}

        {/* Feature cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-left pt-4">
          <div className="card space-y-2 hover:shadow-md transition-shadow">
            <div className="text-2xl">📔</div>
            <h2 className="font-semibold text-gray-900">Patient Journal</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Write freely. Get compassionate AI reflections from MedPsy-1.7B.
              Semantic memory surfaces related past entries as you type.
              Mood trend chart over time.
            </p>
          </div>
          <div className="card space-y-2 hover:shadow-md transition-shadow">
            <div className="text-2xl">🩺</div>
            <h2 className="font-semibold text-gray-900">Clinician SOAP Notes</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Paste raw session notes. MedPsy-4B generates structured S/O/A/P
              documentation in seconds. Semantic search across all patient notes
              by clinical concept.
            </p>
          </div>
        </div>

        {/* Tech stack note */}
        <div className="rounded-2xl bg-gray-50 px-6 py-5 text-left space-y-3 ring-1 ring-gray-100">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
            Built for QVAC Hackathon I — Unleash Edge AI
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500">
            {[
              ["LLM", "MedPsy-1.7B / 4B (Q4_K_M)"],
              ["Embeddings", "GTE-Large (local RAG)"],
              ["Inference", "@qvac/sdk — on-device"],
              ["Storage", "IndexedDB + SQLite-vec"],
              ["Auth", "Supabase (metadata only)"],
              ["License", "MIT — fully open source"],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-1">
                <span className="font-medium text-gray-600 shrink-0">{k}:</span>
                <span>{v}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-300">
          Powered by{" "}
          <a href="https://qvac.tether.io" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-500">
            QVAC SDK
          </a>{" "}
          by Tether · MIT License ·{" "}
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-500">
            Open source
          </a>
        </p>
      </div>
    </main>
  );
}
