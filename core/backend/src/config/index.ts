import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";
const isTest = process.env.NODE_ENV === "test";
const isDevelopment = process.env.NODE_ENV === "development" || !process.env.NODE_ENV;

/**
 * Generate a random JWT secret for non-production environments.
 * Sessions will NOT persist across server restarts.
 */
function generateDevJwtSecret(): string {
  const secret = crypto.randomBytes(32).toString("hex");
  console.warn(
    "[config] JWT_SECRET not set — generated a random secret. Sessions will not persist across restarts."
  );
  return secret;
}

/**
 * Get required environment variable or throw error
 * Only falls back in development and test — staging and production must set all vars explicitly
 */
function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name];
  if (value) return value;
  if ((isDevelopment || isTest) && fallback) return fallback;
  throw new Error(`Missing required environment variable: ${name}`);
}

/**
 * Get optional environment variable with default
 */
function optionalEnv(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

// Validate critical secrets at startup
function validateSecrets(): void {
  const errors: string[] = [];

  if (!process.env.DATABASE_URL) {
    errors.push("DATABASE_URL is required");
  }

  if (!process.env.JWT_SECRET) {
    if (isProduction) {
      errors.push("JWT_SECRET must be set in production");
    }
  }

  if (errors.length > 0) {
    console.error("[config] Configuration errors:");
    errors.forEach((error) => console.error(`  - ${error}`));
    process.exit(1);
  }
}

validateSecrets();

export const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "8000", 10),
  apiUrl: process.env.API_URL || "http://localhost:8000",

  // Proxy settings (for running behind load balancer/reverse proxy)
  trustProxy: process.env.TRUST_PROXY === "true" || process.env.NODE_ENV === "production",

  // Database
  databaseUrl: process.env.DATABASE_URL || "",

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || (isProduction ? requireEnv("JWT_SECRET") : generateDevJwtSecret()),
    expiresIn: optionalEnv("JWT_EXPIRES_IN", "15m"),
    refreshExpiresIn: optionalEnv("JWT_REFRESH_EXPIRES_IN", "30d"),
  },

  // Rate Limiting
  // Higher limits in development to avoid hitting rate limits during local testing
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10),
    maxRequests: parseInt(
      process.env.RATE_LIMIT_MAX_REQUESTS || (isProduction ? "100" : "500"),
      10
    ),
  },

  // Security
  bcryptSaltRounds: 12,

  // CORS - split comma-separated origins into array
  corsOrigin: (process.env.CORS_ORIGIN || "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim()),

  // Frontend URL (for password reset emails, etc.)
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",

  // Email Configuration
  email: {
    // Provider: 'console' (default for dev), 'smtp', 'sendgrid', 'resend'
    provider: optionalEnv("EMAIL_PROVIDER", "console"),
    apiKey: process.env.EMAIL_API_KEY || "",
    from: optionalEnv("EMAIL_FROM", "App <noreply@example.com>"),
    replyTo: process.env.EMAIL_REPLY_TO || "",
    // SMTP settings (when provider is 'smtp')
    smtp: {
      host: process.env.SMTP_HOST || "",
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: process.env.SMTP_SECURE === "true",
      user: process.env.SMTP_USER || "",
      password: process.env.SMTP_PASSWORD || "",
    },
  },

  // App Branding (used in emails, etc.)
  app: {
    name: optionalEnv("APP_NAME", "Fullstack Starter"),
    primaryColor: optionalEnv("APP_PRIMARY_COLOR", "#4F46E5"),
    logoUrl: process.env.APP_LOGO_URL || "",
    supportEmail: optionalEnv("APP_SUPPORT_EMAIL", "support@example.com"),
  },

  // Helper methods
  isDevelopment(): boolean {
    return this.nodeEnv === "development";
  },

  isProduction(): boolean {
    return this.nodeEnv === "production";
  },

  isTest(): boolean {
    return this.nodeEnv === "test";
  },
} as const;

export type Config = typeof config;
