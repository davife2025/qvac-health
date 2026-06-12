/**
 * QVAC Health — API Server (S2: real QVAC wiring)
 */

import Fastify from "fastify";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import { validateEnv } from "./config/env.js";
import { healthRoutes } from "./routes/health.js";
import { aiRoutes } from "./routes/ai.js";
import { modelRoutes } from "./routes/models.js";
import { modelManager, closeWorkspace, RAG_WORKSPACES } from "@qvac-health/qvac-core";

const env = validateEnv();

const app = Fastify({
  logger: {
    level: env.NODE_ENV === "production" ? "warn" : "info",
    transport:
      env.NODE_ENV !== "production"
        ? { target: "pino-pretty", options: { colorize: true } }
        : undefined,
  },
});

// ─── Plugins ──────────────────────────────────────────────────────────────────

await app.register(cors, {
  origin:
    env.NODE_ENV === "development"
      ? ["http://localhost:3000"]
      : [process.env.WEB_URL ?? ""],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
});

await app.register(sensible);

// ─── Routes ───────────────────────────────────────────────────────────────────

await app.register(healthRoutes);
await app.register(aiRoutes);
await app.register(modelRoutes);

// ─── Graceful shutdown ────────────────────────────────────────────────────────

const shutdown = async (signal: string) => {
  app.log.info(`Received ${signal}, shutting down...`);
  try {
    // Close RAG workspaces to release file locks
    await closeWorkspace(RAG_WORKSPACES.JOURNAL).catch(() => {});
    await closeWorkspace(RAG_WORKSPACES.SOAP).catch(() => {});
    // Unload all models to free native memory
    await modelManager.unloadAll();
    await app.close();
    app.log.info("✅ Server closed cleanly");
    process.exit(0);
  } catch (err) {
    app.log.error(err, "Error during shutdown");
    process.exit(1);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// ─── Start ────────────────────────────────────────────────────────────────────

try {
  await app.listen({ port: env.API_PORT, host: env.API_HOST });
  app.log.info(`🚀 API running on http://${env.API_HOST}:${env.API_PORT}`);
  app.log.info(`🧠 QVAC SDK ready — models lazy-load on first request`);
  app.log.info(`   Pre-load via: POST /models/load { "key": "COMPANION_LLM" }`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
