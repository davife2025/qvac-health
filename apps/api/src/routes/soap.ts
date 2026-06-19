/**
 * SOAP note metadata routes.
 *
 * Fix: GET /soap/notes now accepts ?page=N&pageSize=N query params,
 * matching the pagination pattern added to journal.ts in S13.
 * Hard .limit(200) replaced with paginated range query.
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

const PAGE_SIZE = 50;

export async function soapRoutes(app: FastifyInstance, { env }: { env: Env }) {
  const auth = requireAuth(app, env);
  const clinicianOnly = requireRole("clinician");
  const guards = [auth, clinicianOnly];
  const sb = () => getSupabaseClient(env);

  /** GET /soap/notes?page=0&pageSize=50 */
  app.get("/soap/notes", { preHandler: guards }, async (req, reply) => {
    const query = req.query as Record<string, string>;
    const page = Math.max(0, parseInt(query.page ?? "0", 10) || 0);
    const pageSize = Math.min(
      PAGE_SIZE,
      Math.max(1, parseInt(query.pageSize ?? `${PAGE_SIZE}`, 10) || PAGE_SIZE)
    );

    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await sb()
      .from("soap_notes")
      .select("id, patient_ref, content_hash, created_at")
      .eq("clinician_id", req.user!.id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      app.log.error(error, "Failed to fetch SOAP notes");
      return reply.code(500).send({ ok: false, error: "Database error" });
    }

    return reply.send({
      ok: true,
      data,
      meta: {
        page,
        pageSize,
        hasMore: (data ?? []).length === pageSize,
      },
    });
  });

  /** POST /soap/notes */
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
