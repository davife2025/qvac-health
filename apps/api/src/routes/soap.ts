/**
 * SOAP note metadata routes.
 *
 * Same privacy pattern as journal:
 *   - Generated SOAP JSON lives in IndexedDB on device
 *   - Supabase only stores: id, clinician_id, patient_ref, content_hash, created_at
 *
 * GET  /soap/notes           — list metadata for authed clinician
 * POST /soap/notes           — save new note metadata
 * DELETE /soap/notes/:id     — delete metadata record
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getSupabaseClient } from "../lib/supabase.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import type { Env } from "../config/env.js";

const createSchema = z.object({
  patientRef: z.string().min(1).max(100),
  contentHash: z.string().length(64),
});

export async function soapRoutes(app: FastifyInstance, { env }: { env: Env }) {
  const auth = requireAuth(app, env);
  const clinicianOnly = requireRole("clinician");
  const guards = [auth, clinicianOnly];

  const sb = () => getSupabaseClient(env);

  /** GET /soap/notes — list metadata, newest first */
  app.get("/soap/notes", { preHandler: guards }, async (req, reply) => {
    const { data, error } = await sb()
      .from("soap_notes")
      .select("id, patient_ref, content_hash, created_at")
      .eq("clinician_id", req.user!.id)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      app.log.error(error, "Failed to fetch SOAP notes");
      return reply.code(500).send({ ok: false, error: "Database error" });
    }

    return reply.send({ ok: true, data });
  });

  /** POST /soap/notes — create metadata record */
  app.post("/soap/notes", { preHandler: guards }, async (req, reply) => {
    const body = createSchema.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ ok: false, error: "Invalid body" });
    }

    const { data, error } = await sb()
      .from("soap_notes")
      .insert({
        clinician_id: req.user!.id,
        patient_ref: body.data.patientRef,
        content_hash: body.data.contentHash,
      })
      .select()
      .single();

    if (error) {
      app.log.error(error, "Failed to create SOAP note");
      return reply.code(500).send({ ok: false, error: "Database error" });
    }

    return reply.code(201).send({ ok: true, data });
  });

  /** DELETE /soap/notes/:id */
  app.delete("/soap/notes/:id", { preHandler: guards }, async (req, reply) => {
    const { id } = req.params as { id: string };

    const { error } = await sb()
      .from("soap_notes")
      .delete()
      .eq("id", id)
      .eq("clinician_id", req.user!.id);

    if (error) {
      return reply.code(500).send({ ok: false, error: "Database error" });
    }

    return reply.send({ ok: true, data: { deleted: id } });
  });
}
