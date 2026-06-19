import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/auth-actions";

export default async function JournalPage() {
  const user = await getUserProfile();

  if (!user) redirect("/auth/login?next=/journal");
  if (user.role !== "patient") redirect("/clinician");

  return (
    <main className="min-h-full p-6 max-w-2xl mx-auto space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">Your Journal</h1>
        <p className="text-gray-500 text-sm">
          Private reflections. AI responses generated on your device.
        </p>
      </header>

      {/* Placeholder — full implementation in Session 4 */}
      <div className="card text-center py-16 text-gray-400">
        <p className="text-4xl mb-4">🌱</p>
        <p className="font-medium text-gray-600">Welcome, {user.email}</p>
        <p className="text-sm mt-1">Full journal experience coming in Session 4</p>
      </div>
    </main>
  );
}
