/**
 * Cleanup Job
 * Runs hourly to delete expired preview sessions
 */

import cron from "node-cron";
import { prisma } from "../config/db.js";

// Simple logger for cron jobs (avoids ESLint console warnings)
const log = {
  // eslint-disable-next-line no-console
  info: (msg: string) => console.log(`[Cleanup Job] ${msg}`),
  // eslint-disable-next-line no-console
  error: (msg: string, err?: unknown) => console.error(`[Cleanup Job] ${msg}`, err),
};

/**
 * Delete expired preview sessions from the database
 * @returns Number of deleted sessions
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const result = await prisma.previewSession.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  } catch (error) {
    log.error("Error cleaning up expired sessions:", error);
    throw error;
  }
}

/**
 * Start the hourly cleanup cron job
 * Runs at the beginning of every hour (0 * * * *)
 */
export function startCleanupJob(): void {
  // Run cleanup at the start of every hour
  cron.schedule("0 * * * *", async () => {
    log.info(`Starting cleanup at ${new Date().toISOString()}`);

    try {
      const deletedCount = await cleanupExpiredSessions();
      log.info(`Deleted ${deletedCount} expired preview session(s)`);
    } catch (error) {
      log.error("Failed to run cleanup:", error);
    }
  });

  log.info("Scheduled hourly cleanup of expired preview sessions");
}
