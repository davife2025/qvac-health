"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role }, // stored in auth.users.raw_user_meta_data
    },
  });

  if (error) {
    return redirect(`/auth/signup?error=${encodeURIComponent(error.message)}`);
  }

  // Create user profile row in public.users
  if (data.user) {
    await supabase.from("users").upsert({
      id: data.user.id,
      email: data.user.email!,
      role,
    });

    // Seed default preferences
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

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getUserProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return data;
}
