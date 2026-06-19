import Fastify from "fastify";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import { validateEnv } from "./config/env.js";
import { healthRoutes } from "./routes/health.js";
import { aiRoutes } from "./routes/ai.js";
import { modelRoutes } from "./routes/models.js";
import { journalRoutes } from "./routes/journal.js";
import { soapRoutes } from "./routes/soap.js";
import { ragRoutes } from "./routes/rag.js";
import { loggerPlugin } from "./plugins/logger.js";
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
      : [env.WEB_URL ?? ""],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
});

await app.register(sensible);
await app.register(loggerPlugin);

// ─── Routes ───────────────────────────────────────────────────────────────────

await app.register(healthRoutes);
await app.register(modelRoutes);
await app.register(aiRoutes, { env });
await app.register(journalRoutes, { env });
await app.register(soapRoutes, { env });
await app.register(ragRoutes, { env });

// ─── Graceful shutdown ────────────────────────────────────────────────────────

const shutdown = async (signal: string) => {
  app.log.info(`[shutdown] Received ${signal}`);
  try {
    await closeWorkspace(RAG_WORKSPACES.JOURNAL).catch(() => {});
    await closeWorkspace(RAG_WORKSPACES.SOAP).catch(() => {});
    await modelManager.unloadAll();
    await app.close();
    app.log.info("[shutdown] Clean exit");
    process.exit(0);
  } catch (err) {
    app.log.error(err, "[shutdown] Error");
    process.exit(1);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// ─── Start ────────────────────────────────────────────────────────────────────

try {
  await app.listen({ port: env.API_PORT, host: env.API_HOST });

  console.log(`
  ╔═══════════════════════════════════════════╗
  ║         QVAC Health API  🧠🔒             ║
  ╠═══════════════════════════════════════════╣
  ║  http://${env.API_HOST}:${env.API_PORT}                     ║
  ║                                           ║
  ║  GET  /health          → status           ║
  ║  GET  /models/status   → model registry   ║
  ║  POST /models/load     → load + progress  ║
  ║  POST /ai/companion    → SSE stream       ║
  ║  POST /ai/soap         → SOAP note JSON   ║
  ║  POST /rag/search/*    → semantic search  ║
  ╚═══════════════════════════════════════════╝
  `);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
