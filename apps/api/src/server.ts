import Fastify from "fastify";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import { validateEnv } from "./config/env.js";
import { healthRoutes } from "./routes/health.js";
import { aiRoutes } from "./routes/ai.js";
import { modelRoutes } from "./routes/models.js";
import { journalRoutes } from "./routes/journal.js";
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

await app.register(healthRoutes);
await app.register(modelRoutes);
await app.register(aiRoutes, { env });
await app.register(journalRoutes, { env });

const shutdown = async (signal: string) => {
  app.log.info(`Received ${signal}, shutting down...`);
  try {
    await closeWorkspace(RAG_WORKSPACES.JOURNAL).catch(() => {});
    await closeWorkspace(RAG_WORKSPACES.SOAP).catch(() => {});
    await modelManager.unloadAll();
    await app.close();
    process.exit(0);
  } catch (err) {
    app.log.error(err, "Error during shutdown");
    process.exit(1);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

try {
  await app.listen({ port: env.API_PORT, host: env.API_HOST });
  app.log.info(`🚀 QVAC Health API → http://${env.API_HOST}:${env.API_PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
