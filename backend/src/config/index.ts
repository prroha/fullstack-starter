import dotenv from "dotenv";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";
const isTest = process.env.NODE_ENV === "test";

/**
 * Get required environment variable or throw error
 * In test/dev mode, returns fallback value
 */
function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name];
  if (value) return value;
  if (isTest && fallback) return fallback;
  if (!isProduction && fallback) return fallback;
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
    } else if (!isTest) {
      console.warn("[config] JWT_SECRET not set - using insecure default for development only");
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
    secret: requireEnv("JWT_SECRET", "dev-only-jwt-secret-min-32-characters-long"),
    expiresIn: optionalEnv("JWT_EXPIRES_IN", "7d"),
    refreshExpiresIn: optionalEnv("JWT_REFRESH_EXPIRES_IN", "30d"),
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10),
  },

  // Security
  bcryptSaltRounds: 12,

  // CORS - split comma-separated origins into array
  corsOrigin: (process.env.CORS_ORIGIN || "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim()),

  // Email (optional - add your provider)
  email: {
    apiKey: process.env.EMAIL_API_KEY || "",
    from: process.env.EMAIL_FROM || "App <noreply@example.com>",
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
