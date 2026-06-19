import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/auth-actions";
import { JournalView } from "@/components/journal/JournalView";

export default async function JournalPage() {
  const user = await getUserProfile();

  if (!user) redirect("/auth/login?next=/journal");
  if (user.role !== "patient") redirect("/clinician");

  return <JournalView userId={user.id} />;
}
