/**
 * RAG routes — on-device semantic search via QVAC SDK.
 *
 * POST /rag/ingest/journal   — embed a journal entry into the local vector store
 * POST /rag/ingest/soap      — embed a SOAP note into the local vector store
 * POST /rag/search/journal   — semantic search over journal entries
 * POST /rag/search/soap      — semantic search over SOAP notes by patient ref
 *
 * All vectors live in local SQLite-vec via the QVAC SDK ragIngest/ragSearch.
 * Nothing is sent to any external service.
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
  // We embed the concatenated SOAP fields — not raw notes (keeps it clinical)
  soapText: z.string().min(1).max(8000),
  generatedAt: z.string(),
});

const searchSchema = z.object({
  query: z.string().min(1).max(500),
  topK: z.number().int().min(1).max(10).default(5),
});

const soapSearchSchema = searchSchema.extend({
  patientRef: z.string().optional(), // filter to one patient if provided
});

export async function ragRoutes(app: FastifyInstance, { env }: { env: Env }) {
  const auth = requireAuth(app, env);
  const patientOnly = requireRole("patient");
  const clinicianOnly = requireRole("clinician");

  // ─── Journal RAG ───────────────────────────────────────────────────────────

  /** POST /rag/ingest/journal */
  app.post(
    "/rag/ingest/journal",
    { preHandler: [auth, patientOnly] },
    async (req, reply) => {
      const body = ingestJournalSchema.safeParse(req.body);
      if (!body.success) {
        return reply.code(400).send({ ok: false, error: "Invalid body" });
      }

      let modelId: string;
      try {
        modelId = await modelManager.load("EMBEDDINGS");
      } catch {
        return reply.code(503).send({ ok: false, error: "Embeddings model not available" });
      }

      const { entryId, content, mood, tags, createdAt } = body.data;

      // Prefix with metadata so the vector carries context for retrieval
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

  /** POST /rag/search/journal */
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
        return reply.code(503).send({ ok: false, error: "Embeddings model not available" });
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

  // ─── SOAP RAG ──────────────────────────────────────────────────────────────

  /** POST /rag/ingest/soap */
  app.post(
    "/rag/ingest/soap",
    { preHandler: [auth, clinicianOnly] },
    async (req, reply) => {
      const body = ingestSOAPSchema.safeParse(req.body);
      if (!body.success) {
        return reply.code(400).send({ ok: false, error: "Invalid body" });
      }

      let modelId: string;
      try {
        modelId = await modelManager.load("EMBEDDINGS");
      } catch {
        return reply.code(503).send({ ok: false, error: "Embeddings model not available" });
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

  /** POST /rag/search/soap */
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
        return reply.code(503).send({ ok: false, error: "Embeddings model not available" });
      }

      // If patientRef provided, prefix query to bias results toward that patient
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
