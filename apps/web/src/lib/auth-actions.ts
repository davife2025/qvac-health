"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@qvac-health/types";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const next = (formData.get("next") as string) || "/";

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return redirect(`/auth/login?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as "patient" | "clinician";

  // Validate role server-side — never trust client input alone
  if (role !== "patient" && role !== "clinician") {
    return redirect(`/auth/signup?error=${encodeURIComponent("Invalid role selected")}`);
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role }, // stored in auth.users.raw_user_meta_data → in JWT
    },
  });

  if (error) {
    return redirect(`/auth/signup?error=${encodeURIComponent(error.message)}`);
  }

  if (data.user) {
    // Create profile row — trigger 002 also does this, upsert is idempotent
    await supabase.from("users").upsert({
      id: data.user.id,
      email: data.user.email!,
      role,
    });

    await supabase.from("user_preferences").upsert({
      user_id: data.user.id,
      preferred_model: role === "clinician" ? "SOAP_LLM" : "COMPANION_LLM",
    });
  }

  revalidatePath("/", "layout");
  redirect(role === "clinician" ? "/clinician" : "/journal");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/auth/login");
}

/**
 * Returns the raw Supabase auth user — use when you need the full User object.
 */
export async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Returns a lightweight profile built from the JWT — zero DB calls.
 * Role is read from user_metadata (set at signup, part of signed JWT).
 *
 * Falls back to a DB query only for legacy accounts created before
 * user_metadata.role was introduced.
 */
export async function getUserProfile(): Promise<User | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const metaRole = user.user_metadata?.role as string | undefined;

  // Fast path — role in JWT, no DB needed
  if (metaRole === "patient" || metaRole === "clinician") {
    return {
      id: user.id,
      email: user.email ?? "",
      role: metaRole,
      createdAt: user.created_at,
    };
  }

  // Legacy fallback — single DB lookup
  const { data } = await supabase
    .from("users")
    .select("id, email, role, created_at")
    .eq("id", user.id)
    .single();

  if (!data) return null;

  return {
    id: data.id,
    email: data.email,
    role: data.role as "patient" | "clinician",
    createdAt: data.created_at,
  };
}
