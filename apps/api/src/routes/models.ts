/**
 * Model management routes.
 *
 * POST /models/load     — pre-load a model (with SSE progress stream)
 * GET  /models/status   — list all loaded models + loading state
 * POST /models/unload   — unload a specific model to free RAM
 *
 * Models also lazy-load on first use via the AI routes, but pre-loading
 * via this endpoint lets the UI show a download progress bar and confirm
 * the engine is ready before the user starts a session.
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { modelManager, MODEL_REGISTRY, type ModelKey } from "@qvac-health/qvac-core";

const MODEL_KEYS = Object.keys(MODEL_REGISTRY) as ModelKey[];

const loadSchema = z.object({
  key: z.enum(MODEL_KEYS as [ModelKey, ...ModelKey[]]),
});

const unloadSchema = z.object({
  key: z.enum(MODEL_KEYS as [ModelKey, ...ModelKey[]]),
});

export async function modelRoutes(app: FastifyInstance) {
  /**
   * GET /models/status
   * Returns which models are loaded + which are in the registry.
   */
  app.get("/models/status", async (_req, reply) => {
    const loaded = modelManager.getStatus();
    const registry = Object.entries(MODEL_REGISTRY).map(([key, entry]) => ({
      key,
      label: entry.label,
      type: entry.type,
      minRamMb: entry.minRamMb,
      loaded: modelManager.isLoaded(key as ModelKey),
      loading: modelManager.isLoading(key as ModelKey),
    }));

    return reply.send({ ok: true, data: { loaded, registry } });
  });

  /**
   * POST /models/load
   * Streams SSE progress while downloading + loading the model.
   *
   * Body: { key: "COMPANION_LLM" | "SOAP_LLM" | "EMBEDDINGS" }
   */
  app.post("/models/load", async (req, reply) => {
    const body = loadSchema.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ ok: false, error: "Invalid model key" });
    }

    const { key } = body.data;

    // If already loaded, respond immediately
    if (modelManager.isLoaded(key)) {
      return reply.send({ ok: true, data: { key, status: "already_loaded" } });
    }

    // Stream SSE progress
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });

    const sendEvent = (payload: object) => {
      reply.raw.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    try {
      sendEvent({ type: "start", key, label: MODEL_REGISTRY[key].label });

      await modelManager.load(key, (percent) => {
        sendEvent({ type: "progress", key, percent });
      });

      sendEvent({ type: "done", key, status: "loaded" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      app.log.error(err, `Failed to load model ${key}`);
      sendEvent({ type: "error", key, error: message });
    } finally {
      reply.raw.end();
    }
  });

  /**
   * POST /models/unload
   * Frees the model from memory. Useful on low-RAM devices.
   */
  app.post("/models/unload", async (req, reply) => {
    const body = unloadSchema.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ ok: false, error: "Invalid model key" });
    }

    try {
      await modelManager.unload(body.data.key);
      return reply.send({ ok: true, data: { key: body.data.key, status: "unloaded" } });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return reply.code(500).send({ ok: false, error: message });
    }
  });
}
