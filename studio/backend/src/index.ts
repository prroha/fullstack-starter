import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "path";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";
import { adminRoutes } from "./routes/admin/index.js";
import { publicRoutes } from "./routes/public/index.js";
import { startCleanupJob } from "./jobs/cleanup.job.js";

const app = express();

// Security middleware
app.use(helmet({
  hsts: { maxAge: 31536000, includeSubDomains: true },
  contentSecurityPolicy: false, // API server doesn't serve HTML
  crossOriginEmbedderPolicy: false, // Allow cross-origin API calls
}));
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));

// Parsing middleware
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CSRF protection: verify Origin header on state-changing requests
app.use((req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  // Skip for webhook endpoints (Stripe sends its own signature)
  if (req.path.includes('/webhook')) {
    return next();
  }
  const origin = req.headers.origin;
  const allowedOrigin = env.CORS_ORIGIN;
  if (origin && origin !== allowedOrigin) {
    return res.status(403).json({ success: false, error: { message: 'Origin not allowed', code: 'CSRF_REJECTED' } });
  }
  next();
});



// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
app.use("/api/admin", adminRoutes);
app.use("/api", publicRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const port = parseInt(env.PORT, 10);
app.listen(port, () => {
  console.log(`🚀 Studio API running on http://localhost:${port}`);
  console.log(`   Environment: ${env.NODE_ENV}`);

  // Start background jobs
  startCleanupJob();
});

export default app;
