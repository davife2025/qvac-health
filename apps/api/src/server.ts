/**
 * QVAC Health — API Server
 *
 * Fastify server that bridges the Next.js web app with the QVAC SDK.
 * The SDK runs here in Node.js (≥ v22.17) with full native addon support.
 */

import Fastify from "fastify";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import { validateEnv } from "./config/env.js";
import { healthRoutes } from "./routes/health.js";
import { aiRoutes } from "./routes/ai.js";
import { modelManager } from "@qvac-health/qvac-core";

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

// ─── Graceful shutdown ────────────────────────────────────────────────────────

const shutdown = async (signal: string) => {
  app.log.info(`Received ${signal}, shutting down...`);
  try {
    await modelManager.unloadAll();
    await app.close();
    app.log.info("Server closed cleanly");
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
  app.log.info(`🧠 QVAC SDK ready — models will load on first request`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
