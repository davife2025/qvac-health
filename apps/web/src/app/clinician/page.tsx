import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/auth-actions";
import { ClinicianView } from "@/components/clinician/ClinicianView";

export default async function ClinicianPage() {
  const user = await getUserProfile();

  if (!user) redirect("/auth/login?next=/clinician");
  if (user.role !== "clinician") redirect("/journal");

  return <ClinicianView clinicianId={user.id} />;
}
