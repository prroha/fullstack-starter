import { PrismaClient } from "@prisma/client";
import { env } from "./env.js";

// Recommended Prisma singleton pattern for Node.js/Next.js development.
// The double assertion (globalThis as unknown as { prisma }) is necessary because
// globalThis has no typed `prisma` property. This prevents creating multiple
// PrismaClient instances during hot reloads in development.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  });

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
