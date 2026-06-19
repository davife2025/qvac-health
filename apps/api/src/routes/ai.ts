/**
 * AI routes — S3 update: auth-protected.
 *
 * userId now comes from the verified JWT (request.user), not the request body.
 * This prevents any user from claiming another user's ID.
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
import { requireAuth, requireRole } from "../middleware/auth.js";
import type { Env } from "../config/env.js";

const companionSchema = z.object({
  text: z.string().min(1).max(5000),
});

const soapSchema = z.object({
  rawNotes: z.string().min(1).max(10000),
  patientRef: z.string().min(1).max(100),
});

export async function aiRoutes(app: FastifyInstance, { env }: { env: Env }) {
  const auth = requireAuth(app, env);
  const patientOnly = requireRole("patient");
  const clinicianOnly = requireRole("clinician");

  /**
   * POST /ai/companion
   * Patient only. SSE stream of companion LLM tokens.
   */
  app.post(
    "/ai/companion",
    { preHandler: [auth, patientOnly] },
    async (req, reply) => {
      const body = companionSchema.safeParse(req.body);
      if (!body.success) {
        return reply.code(400).send({ ok: false, error: "Invalid request body" });
      }

      let modelId: string;
      try {
        modelId = await modelManager.load("COMPANION_LLM");
      } catch (err) {
        app.log.error(err, "Failed to load companion model");
        return reply.code(503).send({
          ok: false,
          error: "Model unavailable. Pre-load via POST /models/load first.",
        });
      }

      reply.raw.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
      });

      const send = (payload: object) =>
        reply.raw.write(`data: ${JSON.stringify(payload)}\n\n`);

      try {
        for await (const token of streamCompletion(modelId, {
          prompt: body.data.text,
          systemPrompt: SYSTEM_PROMPTS.COMPANION,
        })) {
          send({ token });
        }
        send({ done: true });
      } catch (err) {
        app.log.error(err, "Companion completion error");
        send({ error: "Inference failed" });
      } finally {
        reply.raw.end();
      }
    }
  );

  /**
   * POST /ai/soap
   * Clinician only. Returns structured SOAP note JSON.
   */
  app.post(
    "/ai/soap",
    { preHandler: [auth, clinicianOnly] },
    async (req, reply) => {
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
          error: "Model unavailable. Pre-load via POST /models/load first.",
        });
      }

      try {
        const result = await runCompletion(modelId, {
          prompt: `Generate a SOAP note from these session notes:\n\n${body.data.rawNotes}`,
          systemPrompt: SYSTEM_PROMPTS.SOAP_GENERATOR,
        });

        let soap: Record<string, string>;
        try {
          soap = JSON.parse(result.text);
        } catch {
          const match = result.text.match(/\{[\s\S]*\}/);
          if (!match) {
            return reply.code(500).send({
              ok: false,
              error: "Model returned invalid format. Try again.",
            });
          }
          soap = JSON.parse(match[0]);
        }

        const required = ["subjective", "objective", "assessment", "plan"];
        const missing = required.filter((f) => !soap[f]);
        if (missing.length) {
          return reply
            .code(500)
            .send({ ok: false, error: `Incomplete SOAP. Missing: ${missing.join(", ")}` });
        }

        return reply.send({
          ok: true,
          data: {
            soap,
            patientRef: body.data.patientRef,
            clinicianId: req.user!.id,
            durationMs: result.durationMs,
            generatedAt: new Date().toISOString(),
            modelLabel: MODEL_REGISTRY.SOAP_LLM.label,
          },
        });
      } catch (err) {
        app.log.error(err, "SOAP generation error");
        return reply.code(500).send({ ok: false, error: "SOAP generation failed" });
      }
    }
  );
}
