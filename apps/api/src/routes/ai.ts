/**
 * POST /ai/companion
 * Accepts a journal entry text, returns a compassionate AI reflection.
 * Uses SSE streaming so the UI can show tokens as they arrive.
 *
 * POST /ai/soap
 * Accepts raw session notes, returns structured SOAP note JSON.
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
  patientRef: z.string().min(1),
});

export async function aiRoutes(app: FastifyInstance) {
  /**
   * Companion — streaming SSE response
   */
  app.post("/ai/companion", async (req, reply) => {
    const body = companionSchema.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ ok: false, error: "Invalid request body" });
    }

    // Ensure model is loaded (ModelManager deduplicates concurrent loads)
    let modelId: string;
    try {
      modelId = await modelManager.load(MODEL_REGISTRY.COMPANION_LLM, "llm");
    } catch (err) {
      app.log.error(err, "Failed to load companion model");
      return reply.code(503).send({ ok: false, error: "Model not available" });
    }

    // Stream response as SSE
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });

    try {
      const stream = streamCompletion(modelId, {
        prompt: body.data.text,
        systemPrompt: SYSTEM_PROMPTS.COMPANION,
      });

      for await (const token of stream) {
        reply.raw.write(`data: ${JSON.stringify({ token })}\n\n`);
      }

      reply.raw.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    } catch (err) {
      app.log.error(err, "Completion error");
      reply.raw.write(`data: ${JSON.stringify({ error: "Inference failed" })}\n\n`);
    } finally {
      reply.raw.end();
    }
  });

  /**
   * SOAP Note Generator — non-streaming, returns structured JSON
   */
  app.post("/ai/soap", async (req, reply) => {
    const body = soapSchema.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ ok: false, error: "Invalid request body" });
    }

    let modelId: string;
    try {
      modelId = await modelManager.load(MODEL_REGISTRY.SOAP_LLM, "llm");
    } catch (err) {
      app.log.error(err, "Failed to load SOAP model");
      return reply.code(503).send({ ok: false, error: "Model not available" });
    }

    try {
      const result = await runCompletion(modelId, {
        prompt: `Generate a SOAP note from these session notes:\n\n${body.data.rawNotes}`,
        systemPrompt: SYSTEM_PROMPTS.SOAP_GENERATOR,
      });

      // Parse the JSON the model returns
      let soap: unknown;
      try {
        soap = JSON.parse(result.text);
      } catch {
        // Model didn't return clean JSON — extract it
        const match = result.text.match(/\{[\s\S]*\}/);
        if (!match) {
          return reply.code(500).send({ ok: false, error: "Model returned invalid format" });
        }
        soap = JSON.parse(match[0]);
      }

      return reply.send({
        ok: true,
        data: {
          soap,
          durationMs: result.durationMs,
          patientRef: body.data.patientRef,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (err) {
      app.log.error(err, "SOAP generation error");
      return reply.code(500).send({ ok: false, error: "SOAP generation failed" });
    }
  });
}
