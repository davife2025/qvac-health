/**
 * auth.ts — Fastify JWT verification middleware.
 *
 * S8 fix: role now read from JWT user_metadata (set at signup),
 * eliminating the second DB round-trip to public.users on every request.
 *
 * The role in user_metadata is set server-side by Supabase Auth and cannot
 * be forged by the client — it comes from the signed JWT payload.
 * We keep a fallback DB lookup only if user_metadata.role is missing
 * (e.g. legacy accounts created before S3).
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { getSupabaseClient } from "../lib/supabase.js";
import type { Env } from "../config/env.js";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: "patient" | "clinician";
}

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

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return reply.code(401).send({ ok: false, error: "Invalid or expired token" });
    }

    // Primary: read role from signed JWT metadata — zero extra DB calls
    const metaRole = data.user.user_metadata?.role as string | undefined;

    let role: "patient" | "clinician";

    if (metaRole === "patient" || metaRole === "clinician") {
      role = metaRole;
    } else {
      // Fallback for legacy accounts: single DB lookup, then done
      app.log.warn({ userId: data.user.id }, "Role missing from JWT metadata, falling back to DB");
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", data.user.id)
        .single();
      role = (profile?.role ?? "patient") as "patient" | "clinician";
    }

    request.user = {
      id: data.user.id,
      email: data.user.email ?? "",
      role,
    };
  };
}

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
