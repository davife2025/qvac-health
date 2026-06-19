/**
 * Request logger — adds structured logging to every API request.
 *
 * Logs: method, path, status, duration, userId (if authed).
 * Never logs request bodies (could contain health content).
 */

import type { FastifyInstance } from "fastify";

export async function loggerPlugin(app: FastifyInstance) {
  app.addHook("onResponse", async (request, reply) => {
    const userId = request.user?.id ?? "anon";
    const duration = reply.elapsedTime.toFixed(1);

    app.log.info({
      method: request.method,
      url: request.url,
      status: reply.statusCode,
      durationMs: duration,
      userId,
    });
  });
}
