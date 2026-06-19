/**
 * logger.ts — structured request/response logging.
 *
 * S8 fix: reply.elapsedTime requires @fastify/reply-from.
 * Use onRequest + onResponse hook pair with Date.now() diff instead.
 * Never logs request bodies — health content must not appear in logs.
 */

import type { FastifyInstance } from "fastify";

export async function loggerPlugin(app: FastifyInstance) {
  // Store request start time on the request object
  app.addHook("onRequest", async (request) => {
    (request as { _startMs?: number })._startMs = Date.now();
  });

  app.addHook("onResponse", async (request, reply) => {
    const start = (request as { _startMs?: number })._startMs ?? Date.now();
    const durationMs = (Date.now() - start).toFixed(1);
    const userId = request.user?.id ?? "anon";

    app.log.info({
      method: request.method,
      url: request.url,
      status: reply.statusCode,
      durationMs,
      userId,
    });
  });
}
