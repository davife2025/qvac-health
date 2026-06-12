/**
 * AI routes — updated for SDK v0.11.x real API.
 *
 * POST /ai/companion  → SSE stream of companion LLM tokens
 * POST /ai/soap       → Structured SOAP note JSON (non-streaming)
 *
 * Models lazy-load on first request via ModelManager.
 * Pre-loading via POST /models/load is recommended for better UX.
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  modelManager,
  streamCompletion,
  runCompletion,
  MODEL_REGISTRY,
  SYSTEM_PROMPTS,
} from "@qvac-health/qvac-core";

const companionSchema = z.object({
  text: z.string().min(1).max(5000),
  userId: z.string().uuid(),
});

const soapSchema = z.object({
  rawNotes: z.string().min(1).max(10000),
  clinicianId: z.string().uuid(),
  patientRef: z.string().min(1).max(100),
});

export async function aiRoutes(app: FastifyInstance) {
  /**
   * POST /ai/companion
   * SSE stream — companion LLM reflection on a journal entry.
   */
  app.post("/ai/companion", async (req, reply) => {
    const body = companionSchema.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ ok: false, error: "Invalid request body" });
    }

    let modelId: string;
    try {
      // Lazy-load with no progress (model routes handle pre-loading with UI)
      modelId = await modelManager.load("COMPANION_LLM");
    } catch (err) {
      app.log.error(err, "Failed to load companion model");
      return reply.code(503).send({
        ok: false,
        error: "Model unavailable. Try POST /models/load first.",
      });
    }

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
      const stream = streamCompletion(modelId, {
        prompt: body.data.text,
        systemPrompt: SYSTEM_PROMPTS.COMPANION,
      });

      for await (const token of stream) {
        sendEvent({ token });
      }

      sendEvent({ done: true });
    } catch (err) {
      app.log.error(err, "Companion completion error");
      sendEvent({ error: "Inference failed" });
    } finally {
      reply.raw.end();
    }
  });

  /**
   * POST /ai/soap
   * Non-streaming — generates structured SOAP note JSON.
   */
  app.post("/ai/soap", async (req, reply) => {
    const body = soapSchema.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ ok: false, error: "Invalid request body" });
    }

    let modelId: string;
    try {
      modelId = await modelManager.load("SOAP_LLM");
    } catch (err) {
      app.log.error(err, "Failed to load SOAP model");
      return reply.code(503).send({
        ok: false,
        error: "Model unavailable. Try POST /models/load { key: 'SOAP_LLM' } first.",
      });
    }

    try {
      const result = await runCompletion(modelId, {
        prompt: `Generate a SOAP note from these session notes:\n\n${body.data.rawNotes}`,
        systemPrompt: SYSTEM_PROMPTS.SOAP_GENERATOR,
      });

      // Parse structured JSON from model output
      let soap: Record<string, string>;
      try {
        soap = JSON.parse(result.text);
      } catch {
        // Extract JSON block if model added surrounding text
        const match = result.text.match(/\{[\s\S]*\}/);
        if (!match) {
          return reply.code(500).send({
            ok: false,
            error: "Model returned invalid format. Try again.",
          });
        }
        soap = JSON.parse(match[0]);
      }

      // Validate SOAP fields present
      const required = ["subjective", "objective", "assessment", "plan"];
      const missing = required.filter((f) => !soap[f]);
      if (missing.length > 0) {
        return reply.code(500).send({
          ok: false,
          error: `Incomplete SOAP note. Missing: ${missing.join(", ")}`,
        });
      }

      return reply.send({
        ok: true,
        data: {
          soap,
          patientRef: body.data.patientRef,
          durationMs: result.durationMs,
          generatedAt: new Date().toISOString(),
          modelLabel: MODEL_REGISTRY.SOAP_LLM.label,
        },
      });
    } catch (err) {
      app.log.error(err, "SOAP generation error");
      return reply.code(500).send({ ok: false, error: "SOAP generation failed" });
    }
  });
}
