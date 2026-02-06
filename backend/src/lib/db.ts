import { PrismaClient } from "@prisma/client";
import { config } from "../config";

// Global type declaration to prevent multiple instances in development
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Create Prisma client with appropriate logging
export const db =
  global.prisma ??
  new PrismaClient({
    log: config.isDevelopment() ? ["query", "error", "warn"] : ["error"],
  });

// Prevent multiple instances in development (hot reloading)
if (!config.isProduction()) {
  global.prisma = db;
}

// Graceful shutdown
process.on("beforeExit", async () => {
  await db.$disconnect();
});
