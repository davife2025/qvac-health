import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Env } from "../config/env.js";

let client: SupabaseClient | null = null;

export function getSupabaseClient(env: Env): SupabaseClient {
  if (!client) {
    client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return client;
}
