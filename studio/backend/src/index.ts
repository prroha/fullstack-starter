import Fastify from "fastify";
import fastifyCors from "@fastify/cors";
import fastifyHelmet from "@fastify/helmet";
import fastifyCookie from "@fastify/cookie";
import fastifyFormbody from "@fastify/formbody";
import fastifyStatic from "@fastify/static";
import path from "path";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { adminRoutes } from "./routes/admin/index.js";
import { publicRoutes } from "./routes/public/index.js";
import { startCleanupJob } from "./jobs/cleanup.job.js";

const app = Fastify({
  logger: false,
  trustProxy: true,
});

// Security headers
await app.register(fastifyHelmet, {
  hsts: { maxAge: 31536000, includeSubDomains: true },
  contentSecurityPolicy: false, // API server doesn't serve HTML
  crossOriginEmbedderPolicy: false, // Allow cross-origin API calls
});

// CORS
await app.register(fastifyCors, {
  origin: env.CORS_ORIGIN,
  credentials: true,
});

// Cookie parsing
await app.register(fastifyCookie);

// Body parsing (URL-encoded)
await app.register(fastifyFormbody);

// CSRF protection: verify Origin header on state-changing requests
app.addHook("onRequest", async (req, reply) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return;
  }
  // Skip for webhook endpoints (Stripe sends its own signature)
  if (req.url.includes('/webhook')) {
    return;
  }
  const origin = req.headers.origin;
  const allowedOrigin = env.CORS_ORIGIN;
  if (!origin) {
    return reply.code(403).send({ success: false, error: { message: 'Origin header required for state-changing requests', code: 'CSRF_REJECTED' } });
  }
  if (origin !== allowedOrigin) {
    return reply.code(403).send({ success: false, error: { message: 'Origin not allowed', code: 'CSRF_REJECTED' } });
  }
});

// Serve static files from uploads directory
await app.register(fastifyStatic, {
  root: path.join(process.cwd(), "uploads"),
  prefix: "/uploads/",
  decorateReply: false,
});

// Error handler — must be set before routes
app.setErrorHandler(errorHandler);

// Health check
app.get("/health", async (_req, reply) => {
  return reply.send({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
await app.register(publicRoutes, { prefix: "/api" });
await app.register(adminRoutes, { prefix: "/api/admin" });

// 404 handler
app.setNotFoundHandler((_req, reply) => {
  return reply.code(404).send({
    success: false,
    error: { code: "NOT_FOUND", message: "Endpoint not found" },
  });
});

// Start server
const port = parseInt(env.PORT, 10);
await app.listen({ port, host: "0.0.0.0" });
console.log(`Studio API running on http://localhost:${port}`);
console.log(`   Environment: ${env.NODE_ENV}`);

// Start background jobs
startCleanupJob();

export default app;
