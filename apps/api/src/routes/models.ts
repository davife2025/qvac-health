/**
 * Model management routes.
 *
 * Fix: z.enum now uses an explicit const tuple instead of a runtime
 * cast from Object.keys() — which TypeScript couldn't verify as non-empty.
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { modelManager, MODEL_REGISTRY, type ModelKey } from "@qvac-health/qvac-core";

// Fix #4: explicit tuple literal — type-safe, no unsound cast
const MODEL_KEY_ENUM = ["COMPANION_LLM", "SOAP_LLM", "EMBEDDINGS"] as const satisfies readonly ModelKey[];

const loadSchema = z.object({
  key: z.enum(MODEL_KEY_ENUM),
});

const unloadSchema = z.object({
  key: z.enum(MODEL_KEY_ENUM),
});

export async function modelRoutes(app: FastifyInstance) {
  /** GET /models/status */
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

  /** POST /models/load — SSE progress stream */
  app.post("/models/load", async (req, reply) => {
    const body = loadSchema.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ ok: false, error: "Invalid model key" });
    }

    const { key } = body.data;

    if (modelManager.isLoaded(key)) {
      return reply.send({ ok: true, data: { key, status: "already_loaded" } });
    }

    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });

    const sendEvent = (payload: object) => {
      if (req.socket.destroyed) return;
      try {
        reply.raw.write(`data: ${JSON.stringify(payload)}\n\n`);
      } catch {
        // Client disconnected
      }
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
      if (!req.socket.destroyed) {
        reply.raw.end();
      }
    }
  });

  /** POST /models/unload */
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
