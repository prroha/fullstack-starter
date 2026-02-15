import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "path";
import swaggerUi from "swagger-ui-express";

import { config } from "./config/index.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { csrfProtection } from "./middleware/csrf.middleware.js";
import { sanitizeInput } from "./middleware/sanitize.middleware.js";
import { generalRateLimiter, cleanupRateLimitStores } from "./middleware/rate-limit.middleware.js";
import { requestIdMiddleware, REQUEST_ID_HEADER } from "./middleware/request-id.middleware.js";
import { previewMiddleware } from "./middleware/preview.middleware.js";
import { UPLOAD_DIR as _UPLOAD_DIR } from "./middleware/upload.middleware.js";
import { logger, requestContext } from "./lib/logger.js";
import { db } from "./lib/db.js";
import routes from "./routes/index.js";
import { swaggerSpec } from "./swagger.js";

const app = express();

// Trust proxy for rate limiting behind reverse proxy
if (config.trustProxy) {
  app.set("trust proxy", 1);
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // May need to be disabled for some use cases
}));

// CORS
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Device-Id",
    "X-CSRF-Token",
    "X-XSRF-Token",
    "X-API-Key",
    "X-Preview-Session",
    REQUEST_ID_HEADER,
  ],
  exposedHeaders: [
    "X-RateLimit-Limit",
    "X-RateLimit-Remaining",
    "X-RateLimit-Reset",
    REQUEST_ID_HEADER,
  ],
}));

// Request ID middleware (early in chain for request tracing)
app.use(requestIdMiddleware);

// Wrap all requests in AsyncLocalStorage for request-scoped logging
app.use((req, res, next) => {
  requestContext.run({ requestId: req.id }, () => {
    next();
  });
});

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Cookie parsing
app.use(cookieParser());

// Input sanitization (XSS prevention) - after body parsing
app.use(sanitizeInput);

// Preview/Feature flag middleware
// - In preview mode: fetches feature config from Studio API
// - In deployed mode: reads from starter-config.json
// - In development mode: all features enabled
app.use(previewMiddleware);

// General rate limiting
app.use(generalRateLimiter);

// Health check (before CSRF to allow monitoring)
app.get("/health", async (_req, res) => {
  try {
    await db.$queryRaw`SELECT 1`;
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: "error", timestamp: new Date().toISOString() });
  }
});

// Swagger API documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customSiteTitle: "Fullstack Starter API Docs",
}));
app.get("/api-docs.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// CSRF protection for state-changing requests
app.use(csrfProtection);

// Serve uploaded files (static)
app.use("/uploads", express.static(path.join(process.cwd(), "uploads"), {
  maxAge: "1d", // Cache for 1 day
  immutable: true, // Files are immutable (content-based naming)
}));

// API routes
app.use("/api", routes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "Endpoint not found",
    },
  });
});

// Error handler (must be last)
app.use(errorMiddleware);

// Start server
const PORT = config.port;

const server = app.listen(PORT, () => {
  logger.info(`Server started`, {
    port: PORT,
    environment: config.nodeEnv,
    url: `http://localhost:${PORT}`,
  });
});

// Graceful shutdown
const shutdown = () => {
  logger.info("Shutting down gracefully...");
  server.close(() => {
    cleanupRateLimitStores();
    process.exit(0);
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

export { app, server };
