import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import { config } from "./config";
import { errorMiddleware } from "./middleware/error.middleware";
import { csrfProtection } from "./middleware/csrf.middleware";
import { sanitizeInput } from "./middleware/sanitize.middleware";
import { generalRateLimiter } from "./middleware/rate-limit.middleware";
import { logger } from "./lib/logger";
import routes from "./routes";

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
  ],
  exposedHeaders: ["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"],
}));

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

// CSRF protection for state-changing requests
app.use(csrfProtection);

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
