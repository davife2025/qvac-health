import type { FastifyInstance } from "fastify";
import { modelManager } from "@qvac-health/qvac-core";
import type { HealthCheckResponse } from "@qvac-health/types";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/health", async (_req, reply) => {
    const statuses = modelManager.getStatus();

    const response: HealthCheckResponse = {
      status: "ok",
      qvacReady: statuses.length > 0,
      modelsLoaded: statuses.map((s) => s.modelId),
      uptime: process.uptime(),
    };

    return reply.code(200).send(response);
  });
}
