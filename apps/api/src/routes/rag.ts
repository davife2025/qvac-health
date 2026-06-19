/**
 * RAG routes — on-device semantic search via QVAC SDK.
 *
 * Fix #8: removed dead `lazy` parameter from getEmbeddingsModelId().
 * Both branches returned null regardless of lazy value.
 * Ingest: requires model pre-loaded (returns 503 if not).
 * Search: lazy-loads model (acceptable for explicit user action).
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  modelManager,
  ingestDocuments,
  searchSimilar,
  RAG_WORKSPACES,
} from "@qvac-health/qvac-core";
import { requireAuth, requireRole } from "../middleware/auth.js";
import type { Env } from "../config/env.js";

const ingestJournalSchema = z.object({
  entryId: z.string().uuid(),
  content: z.string().min(1).max(5000),
  mood: z.number().int().min(1).max(5),
  tags: z.array(z.string()).default([]),
  createdAt: z.string(),
});

const ingestSOAPSchema = z.object({
  noteId: z.string().uuid(),
  patientRef: z.string().min(1),
  soapText: z.string().min(1).max(8000),
  generatedAt: z.string(),
});

const searchSchema = z.object({
  query: z.string().min(1).max(500),
  topK: z.number().int().min(1).max(10).default(5),
});

const soapSearchSchema = searchSchema.extend({
  patientRef: z.string().optional(),
});

// Fix #8: simplified — no dead lazy param
function getLoadedEmbeddingsId(): string | null {
  if (!modelManager.isLoaded("EMBEDDINGS")) return null;
  return modelManager.getModelId("EMBEDDINGS");
}

export async function ragRoutes(app: FastifyInstance, { env }: { env: Env }) {
  const auth = requireAuth(app, env);
  const patientOnly = requireRole("patient");
  const clinicianOnly = requireRole("clinician");

  // ─── Journal ingest ────────────────────────────────────────────────────────

  app.post(
    "/rag/ingest/journal",
    { preHandler: [auth, patientOnly] },
    async (req, reply) => {
      const body = ingestJournalSchema.safeParse(req.body);
      if (!body.success) {
        return reply.code(400).send({ ok: false, error: "Invalid body" });
      }

      const modelId = getLoadedEmbeddingsId();
      if (!modelId) {
        return reply.code(503).send({
          ok: false,
          error: "Embeddings model not loaded. Load it via POST /models/load first.",
          code: "EMBEDDINGS_NOT_LOADED",
        });
      }

      const { entryId, content, mood, tags, createdAt } = body.data;

      const document = [
        `[Journal entry ${entryId}]`,
        `Date: ${createdAt}`,
        `Mood: ${mood}/5`,
        tags.length ? `Tags: ${tags.join(", ")}` : "",
        "",
        content,
      ]
        .filter(Boolean)
        .join("\n");

      try {
        await ingestDocuments(modelId, [document], RAG_WORKSPACES.JOURNAL);
        return reply.send({ ok: true, data: { ingested: entryId } });
      } catch (err) {
        app.log.error(err, "Journal ingest failed");
        return reply.code(500).send({ ok: false, error: "Ingest failed" });
      }
    }
  );

  // ─── Journal search ────────────────────────────────────────────────────────

  app.post(
    "/rag/search/journal",
    { preHandler: [auth, patientOnly] },
    async (req, reply) => {
      const body = searchSchema.safeParse(req.body);
      if (!body.success) {
        return reply.code(400).send({ ok: false, error: "Invalid body" });
      }

      let modelId: string;
      try {
        modelId = await modelManager.load("EMBEDDINGS");
      } catch {
        return reply.code(503).send({ ok: false, error: "Embeddings model unavailable" });
      }

      try {
        const results = await searchSimilar(
          modelId,
          { query: body.data.query, topK: body.data.topK },
          RAG_WORKSPACES.JOURNAL
        );
        return reply.send({ ok: true, data: results });
      } catch (err) {
        app.log.error(err, "Journal search failed");
        return reply.code(500).send({ ok: false, error: "Search failed" });
      }
    }
  );

  // ─── SOAP ingest ───────────────────────────────────────────────────────────

  app.post(
    "/rag/ingest/soap",
    { preHandler: [auth, clinicianOnly] },
    async (req, reply) => {
      const body = ingestSOAPSchema.safeParse(req.body);
      if (!body.success) {
        return reply.code(400).send({ ok: false, error: "Invalid body" });
      }

      const modelId = getLoadedEmbeddingsId();
      if (!modelId) {
        return reply.code(503).send({
          ok: false,
          error: "Embeddings model not loaded. Load it via POST /models/load first.",
          code: "EMBEDDINGS_NOT_LOADED",
        });
      }

      const { noteId, patientRef, soapText, generatedAt } = body.data;

      const document = [
        `[SOAP note ${noteId}]`,
        `Patient: ${patientRef}`,
        `Date: ${generatedAt}`,
        "",
        soapText,
      ].join("\n");

      try {
        await ingestDocuments(modelId, [document], RAG_WORKSPACES.SOAP);
        return reply.send({ ok: true, data: { ingested: noteId } });
      } catch (err) {
        app.log.error(err, "SOAP ingest failed");
        return reply.code(500).send({ ok: false, error: "Ingest failed" });
      }
    }
  );

  // ─── SOAP search ───────────────────────────────────────────────────────────

  app.post(
    "/rag/search/soap",
    { preHandler: [auth, clinicianOnly] },
    async (req, reply) => {
      const body = soapSearchSchema.safeParse(req.body);
      if (!body.success) {
        return reply.code(400).send({ ok: false, error: "Invalid body" });
      }

      let modelId: string;
      try {
        modelId = await modelManager.load("EMBEDDINGS");
      } catch {
        return reply.code(503).send({ ok: false, error: "Embeddings model unavailable" });
      }

      const query = body.data.patientRef
        ? `Patient: ${body.data.patientRef} — ${body.data.query}`
        : body.data.query;

      try {
        const results = await searchSimilar(
          modelId,
          { query, topK: body.data.topK },
          RAG_WORKSPACES.SOAP
        );
        return reply.send({ ok: true, data: results });
      } catch (err) {
        app.log.error(err, "SOAP search failed");
        return reply.code(500).send({ ok: false, error: "Search failed" });
      }
    }
  );
}
