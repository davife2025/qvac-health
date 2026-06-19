/**
 * Journal metadata routes.
 *
 * Content stays LOCAL (never hits these routes).
 * These routes only handle metadata: id, mood, tags, content_hash.
 *
 * GET  /journal/entries        — list entry metadata for the authed user
 * POST /journal/entries        — save new entry metadata
 * PUT  /journal/entries/:id    — update mood/tags
 * DELETE /journal/entries/:id  — delete metadata record
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getSupabaseClient } from "../lib/supabase.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import type { Env } from "../config/env.js";

const createSchema = z.object({
  contentHash: z.string().length(64), // SHA-256 hex
  mood: z.number().int().min(1).max(5),
  tags: z.array(z.string().max(30)).max(10).default([]),
});

const updateSchema = z.object({
  mood: z.number().int().min(1).max(5).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
  contentHash: z.string().length(64).optional(),
});

export async function journalRoutes(app: FastifyInstance, { env }: { env: Env }) {
  const auth = requireAuth(app, env);
  const patientOnly = requireRole("patient");
  const guards = [auth, patientOnly];

  const sb = () => getSupabaseClient(env);

  /** GET /journal/entries — list metadata, newest first */
  app.get("/journal/entries", { preHandler: guards }, async (req, reply) => {
    const { data, error } = await sb()
      .from("journal_entries")
      .select("id, mood, tags, content_hash, created_at, updated_at")
      .eq("user_id", req.user!.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      app.log.error(error, "Failed to fetch journal entries");
      return reply.code(500).send({ ok: false, error: "Database error" });
    }

    return reply.send({ ok: true, data });
  });

  /** POST /journal/entries — create metadata record */
  app.post("/journal/entries", { preHandler: guards }, async (req, reply) => {
    const body = createSchema.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ ok: false, error: "Invalid body" });
    }

    const { data, error } = await sb()
      .from("journal_entries")
      .insert({
        user_id: req.user!.id,
        content_hash: body.data.contentHash,
        mood: body.data.mood,
        tags: body.data.tags,
      })
      .select()
      .single();

    if (error) {
      app.log.error(error, "Failed to create journal entry");
      return reply.code(500).send({ ok: false, error: "Database error" });
    }

    return reply.code(201).send({ ok: true, data });
  });

  /** PUT /journal/entries/:id */
  app.put("/journal/entries/:id", { preHandler: guards }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = updateSchema.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ ok: false, error: "Invalid body" });
    }

    // Only allow updating own entries (RLS also enforces this)
    const { data, error } = await sb()
      .from("journal_entries")
      .update({
        ...(body.data.mood !== undefined && { mood: body.data.mood }),
        ...(body.data.tags !== undefined && { tags: body.data.tags }),
        ...(body.data.contentHash !== undefined && {
          content_hash: body.data.contentHash,
        }),
      })
      .eq("id", id)
      .eq("user_id", req.user!.id)
      .select()
      .single();

    if (error) {
      return reply.code(500).send({ ok: false, error: "Database error" });
    }

    return reply.send({ ok: true, data });
  });

  /** DELETE /journal/entries/:id */
  app.delete("/journal/entries/:id", { preHandler: guards }, async (req, reply) => {
    const { id } = req.params as { id: string };

    const { error } = await sb()
      .from("journal_entries")
      .delete()
      .eq("id", id)
      .eq("user_id", req.user!.id);

    if (error) {
      return reply.code(500).send({ ok: false, error: "Database error" });
    }

    return reply.send({ ok: true, data: { deleted: id } });
  });
}
