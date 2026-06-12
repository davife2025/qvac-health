import type { FastifyInstance } from "fastify";
import { modelManager, MODEL_REGISTRY, type ModelKey } from "@qvac-health/qvac-core";
import type { HealthCheckResponse } from "@qvac-health/types";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/health", async (_req, reply) => {
    const statuses = modelManager.getStatus();
    const loadedKeys = modelManager.getLoadedKeys();

    const response: HealthCheckResponse & { modelsRegistry: object } = {
      status: "ok",
      qvacReady: true, // SDK is always available; models load on demand
      modelsLoaded: loadedKeys,
      uptime: process.uptime(),
      modelsRegistry: Object.entries(MODEL_REGISTRY).map(([key, entry]) => ({
        key,
        label: entry.label,
        loaded: modelManager.isLoaded(key as ModelKey),
      })),
    };

    return reply.code(200).send(response);
  });
}
