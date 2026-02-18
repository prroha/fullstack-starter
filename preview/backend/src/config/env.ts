import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1),

  // Server
  PORT: z.string().default("3003"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // CORS (studio + preview frontends)
  CORS_ORIGIN: z
    .string()
    .default("http://localhost:3002,http://localhost:3004"),

  // JWT
  JWT_SECRET: z.string().min(32).refine(
    (val) => !val.includes("change-me") && !val.includes("min-32"),
    { message: "JWT_SECRET must be changed from default value" },
  ),

  // Studio API URL for session resolution
  STUDIO_API_URL: z.string().default("http://localhost:3001/api"),

  // Preview limits
  MAX_PREVIEW_SCHEMAS: z.coerce.number().default(50),
  MAX_SESSIONS_PER_IP: z.coerce.number().default(5),
  PREVIEW_TTL_HOURS: z.coerce.number().default(4),
  PRISMA_CONNECTION_LIMIT: z.coerce.number().default(2),

  // HMAC secret for studio↔preview internal API signing
  INTERNAL_API_SECRET: z.string().min(16).default(
    process.env.NODE_ENV === "development" ? "dev-internal-secret-that-is-at-least-64-characters-long-for-hmac-signing" : "",
  ),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
