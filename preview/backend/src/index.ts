import Fastify from "fastify";
import fastifyHelmet from "@fastify/helmet";
import fastifyCors from "@fastify/cors";
import fastifyCookie from "@fastify/cookie";
import fastifyFormbody from "@fastify/formbody";
import fastifyRateLimit from "@fastify/rate-limit";
import crypto from "node:crypto";

import { env } from "./config/env.js";
import { initDbConfig, getAdminClient, disconnectAllClients, startClientCleanup, stopClientCleanup } from "./config/db.js";
import { initLimits } from "./config/limits.js";
import { createTenantMiddleware } from "./middleware/tenant.middleware.js";
import { featureGateMiddleware } from "./middleware/feature-gate.middleware.js";
import { sandboxMiddleware } from "./middleware/sandbox.middleware.js";
import routes from "./routes/index.js";
import internalRoutes from "./routes/internal.routes.js";
import { startOrphanCleanup, stopOrphanCleanup } from "./jobs/orphan-cleanup.job.js";

async function main() {
  // Initialize DB config from env
  initDbConfig({
    databaseUrl: env.DATABASE_URL,
    maxSchemas: env.MAX_PREVIEW_SCHEMAS,
    connectionLimit: env.PRISMA_CONNECTION_LIMIT,
  });

  // Initialize resource limits
  initLimits({
    maxConcurrentSchemas: env.MAX_PREVIEW_SCHEMAS,
    maxSessionsPerIp: env.MAX_SESSIONS_PER_IP,
    sessionTtlHours: env.PREVIEW_TTL_HOURS,
    prismaConnectionLimit: env.PRISMA_CONNECTION_LIMIT,
  });

  // Create Fastify instance with structured logging
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug",
      ...(env.NODE_ENV === "development" && {
        transport: { target: "pino-pretty" },
      }),
    },
    trustProxy: true,
    genReqId: () => crypto.randomUUID(),
  });

  // Security plugins
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  });
  await app.register(fastifyCors, {
    origin: env.CORS_ORIGIN.split(",").map((s) => s.trim()),
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Preview-Session"],
  });
  await app.register(fastifyCookie);
  await app.register(fastifyFormbody);

  // Rate limiting per session token
  await app.register(fastifyRateLimit, {
    max: 200,
    timeWindow: "1 minute",
    keyGenerator: (req) => (req.headers["x-preview-session"] as string) || req.ip,
  });

  // Preview-specific hooks (order matters):
  // 1. Sandbox — stubs external services
  app.addHook("onRequest", sandboxMiddleware);
  // 2. Tenant — resolves session → schema → req.db
  app.addHook("onRequest", createTenantMiddleware(env.STUDIO_API_URL));
  // 3. Feature gate — blocks routes for disabled features
  app.addHook("onRequest", featureGateMiddleware);

  // Error handler
  app.setErrorHandler((err, req, reply) => {
    const statusCode = (err as { statusCode?: number }).statusCode || 500;
    const message = statusCode < 500 ? err.message : "Internal server error";

    if (statusCode >= 500) {
      req.log.error(err);
    } else {
      req.log.warn({ msg: err.message, statusCode });
    }

    reply.code(statusCode).send({
      success: false,
      error: { message, code: statusCode < 500 ? "CLIENT_ERROR" : "INTERNAL_ERROR" },
    });
  });

  // Health check
  app.get("/health", async (_req, reply) => {
    try {
      await getAdminClient().$queryRaw`SELECT 1`;
      return reply.send({ status: "ok", timestamp: new Date().toISOString() });
    } catch {
      return reply.code(503).send({ status: "unhealthy", timestamp: new Date().toISOString() });
    }
  });

  // Core + module routes
  await app.register(routes, { prefix: "/api" });

  // Internal routes (secured by HMAC)
  await app.register(internalRoutes, { prefix: "/internal" });

  // 404 handler
  app.setNotFoundHandler((_req, reply) => {
    reply.code(404).send({
      success: false,
      error: { message: "Route not found", code: "NOT_FOUND" },
    });
  });

  // Start idle client cleanup
  startClientCleanup();

  // Start periodic orphan schema cleanup (every 6 hours)
  startOrphanCleanup(6 * 60 * 60 * 1000, env.STUDIO_API_URL, env.INTERNAL_API_SECRET);

  // Start server
  await app.listen({ port: Number(env.PORT), host: "0.0.0.0" });
  app.log.info(`Preview backend listening on port ${env.PORT}`);

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    app.log.info(`Received ${signal}, shutting down gracefully...`);
    const forceExit = setTimeout(() => process.exit(1), 10_000);
    forceExit.unref();
    stopOrphanCleanup();
    stopClientCleanup();
    await app.close();
    await disconnectAllClients();
    clearTimeout(forceExit);
    process.exit(0);
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
  console.error("Failed to start preview backend:", err);
  process.exit(1);
});
