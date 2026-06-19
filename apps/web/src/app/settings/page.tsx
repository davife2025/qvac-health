import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/auth-actions";
import { logout } from "@/lib/auth-actions";

export default async function SettingsPage() {
  const user = await getUserProfile();
  if (!user) redirect("/auth/login");

  return (
    <main className="min-h-full p-6 max-w-lg mx-auto space-y-8 pb-16">
      <header className="space-y-1 pt-2">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm">Account and privacy preferences</p>
      </header>

      {/* Account */}
      <section className="card space-y-4">
        <h2 className="font-semibold text-gray-900">Account</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center py-2 border-b border-gray-50">
            <span className="text-gray-500">Email</span>
            <span className="text-gray-900 font-medium">{user.email}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-50">
            <span className="text-gray-500">Role</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-calm-100 px-3 py-0.5 text-xs font-medium text-calm-700 capitalize">
              {user.role === "patient" ? "📔" : "🩺"} {user.role}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-500">Member since</span>
            <span className="text-gray-900 font-medium">
              {new Date(user.createdAt).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="card space-y-4">
        <h2 className="font-semibold text-gray-900">Privacy architecture</h2>
        <div className="space-y-3 text-sm text-gray-600">
          {[
            { icon: "🔒", label: "Health content", value: "IndexedDB — your device only" },
            { icon: "🧠", label: "AI inference", value: "QVAC SDK — no cloud calls" },
            { icon: "🔍", label: "Semantic vectors", value: "SQLite-vec — local only" },
            { icon: "☁️", label: "Cloud storage", value: "Metadata only (IDs, timestamps, hashes)" },
          ].map(({ icon, label, value }) => (
            <div key={label} className="flex justify-between items-start py-2 border-b border-gray-50 last:border-0">
              <span className="flex items-center gap-2 text-gray-500">
                <span>{icon}</span>
                {label}
              </span>
              <span className="text-right text-xs font-medium text-gray-700 max-w-[180px]">
                {value}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Local data */}
      <section className="card space-y-4">
        <h2 className="font-semibold text-gray-900">Local data</h2>
        <p className="text-sm text-gray-500">
          Your journal entries, SOAP notes, and AI responses are stored in your
          browser&apos;s IndexedDB. They persist across sessions on this device.
          Clearing your browser data will remove them permanently.
        </p>
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-700 ring-1 ring-amber-200">
          ⚠️ There is no cloud backup for health content by design. Export
          important notes before clearing browser data.
        </div>
      </section>

      {/* Danger zone */}
      <section className="card space-y-4 ring-red-100">
        <h2 className="font-semibold text-red-700">Sign out</h2>
        <p className="text-sm text-gray-500">
          Your local data is not affected. All health content remains on this
          device.
        </p>
        <form action={logout}>
          <button type="submit" className="rounded-xl bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors ring-1 ring-red-200">
            Sign out
          </button>
        </form>
      </section>
    </main>
  );
}
