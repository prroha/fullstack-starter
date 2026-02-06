import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

import { config } from "./config";
import { errorMiddleware } from "./middleware/error.middleware";
import { logger } from "./lib/logger";
import routes from "./routes";

const app = express();

// Trust proxy for rate limiting behind reverse proxy
if (config.trustProxy) {
  app.set("trust proxy", 1);
}

// Security middleware
app.use(helmet());

// CORS
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Cookie parsing
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests, please try again later",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

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
