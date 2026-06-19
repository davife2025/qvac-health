/**
 * Fastify auth middleware — verifies Supabase JWT on every protected route.
 *
 * The web app sends the user's access token in the Authorization header:
 *   Authorization: Bearer <supabase-access-token>
 *
 * We verify it server-side using the Supabase service role client.
 * This ensures the API never trusts a userId from the request body.
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { getSupabaseClient } from "../lib/supabase.js";
import type { Env } from "../config/env.js";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: "patient" | "clinician";
}

// Augment FastifyRequest to carry the verified user
declare module "fastify" {
  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
}

export function requireAuth(app: FastifyInstance, env: Env) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return reply.code(401).send({ ok: false, error: "Missing auth token" });
    }

    const token = authHeader.slice(7);
    const supabase = getSupabaseClient(env);

    // Verify the JWT by calling getUser — this hits Supabase Auth server
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return reply.code(401).send({ ok: false, error: "Invalid or expired token" });
    }

    // Fetch the user's role from public.users
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", data.user.id)
      .single();

    request.user = {
      id: data.user.id,
      email: data.user.email ?? "",
      role: (profile?.role ?? "patient") as "patient" | "clinician",
    };
  };
}

/**
 * Role guard — call after requireAuth.
 * Returns a preHandler that rejects requests from the wrong role.
 */
export function requireRole(role: "patient" | "clinician") {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (request.user?.role !== role) {
      return reply.code(403).send({
        ok: false,
        error: `This endpoint requires the '${role}' role`,
      });
    }
  };
}
