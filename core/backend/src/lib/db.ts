import { PrismaClient } from "@prisma/client";
import { config } from "../config/index.js";

// Create Prisma client with appropriate logging
// Note: global.prisma pattern removed — that is a Next.js hot-reload workaround, not needed in backend
export const db = new PrismaClient({
  log: config.isDevelopment() ? ["query", "error", "warn"] : ["error"],
});

// Graceful shutdown
process.on("beforeExit", async () => {
  await db.$disconnect();
});
