import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "path";
import swaggerUi from "swagger-ui-express";

import { config } from "./config";
import { errorMiddleware } from "./middleware/error.middleware";
import { csrfProtection } from "./middleware/csrf.middleware";
import { sanitizeInput } from "./middleware/sanitize.middleware";
import { generalRateLimiter } from "./middleware/rate-limit.middleware";
import { requestIdMiddleware, REQUEST_ID_HEADER } from "./middleware/request-id.middleware";
import { UPLOAD_DIR } from "./middleware/upload.middleware";
import { logger, requestContext } from "./lib/logger";
import routes from "./routes";
import { swaggerSpec } from "./swagger";

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

// General rate limiting
app.use(generalRateLimiter);

// Health check (before CSRF to allow monitoring)
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
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

app.listen(PORT, () => {
  logger.info(`Server started`, {
    port: PORT,
    environment: config.nodeEnv,
    url: `http://localhost:${PORT}`,
  });
});

export default app;
