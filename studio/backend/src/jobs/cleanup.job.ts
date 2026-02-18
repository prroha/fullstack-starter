/**
 * Cleanup Job
 * Runs hourly to delete expired preview sessions and manage schema lifecycle
 */

import cron from "node-cron";
import { prisma } from "../config/db.js";
import { dropPreviewSchema } from "../services/preview-orchestrator.service.js";

// Simple logger for cron jobs (avoids ESLint console warnings)
const log = {
  // eslint-disable-next-line no-console
  info: (msg: string) => console.log(`[Cleanup Job] ${msg}`),
  // eslint-disable-next-line no-console
  error: (msg: string, err?: unknown) => console.error(`[Cleanup Job] ${msg}`, err),
};

/**
 * Delete expired preview sessions and clean up associated schemas
 * @returns Number of deleted sessions
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    // 1. Find expired sessions with active schemas
    // Use a 60-second grace period beyond expiry to allow in-flight requests to complete
    // before dropping the schema. This prevents errors for requests that started just
    // before the session expired.
    const EXPIRY_GRACE_PERIOD_MS = 60_000;
    const expiredWithSchemas = await prisma.previewSession.findMany({
      where: {
        expiresAt: { lt: new Date(Date.now() - EXPIRY_GRACE_PERIOD_MS) },
        schemaStatus: { in: ["READY", "PROVISIONING"] },
        schemaName: { not: null },
      },
    });

    // Drop schemas in parallel (best effort)
    const expiredResults = await Promise.allSettled(
      expiredWithSchemas.map((session) =>
        session.schemaName ? dropPreviewSchema(session.schemaName) : Promise.resolve()
      )
    );
    for (const result of expiredResults) {
      if (result.status === "rejected") {
        log.error("Failed to drop expired preview schema", result.reason);
      }
    }

    // 2. Delete all expired sessions (with same grace period)
    const result = await prisma.previewSession.deleteMany({
      where: { expiresAt: { lt: new Date(Date.now() - EXPIRY_GRACE_PERIOD_MS) } },
    });

    // 3. Clean idle sessions (lastAccessedAt > 30 min, not yet expired)
    const idleCutoff = new Date(Date.now() - 30 * 60 * 1000);
    const idleSessions = await prisma.previewSession.findMany({
      where: {
        lastAccessedAt: { lt: idleCutoff },
        schemaStatus: { in: ["READY"] },
        schemaName: { not: null },
      },
    });

    const idleResults = await Promise.allSettled(
      idleSessions.map((session) =>
        session.schemaName ? dropPreviewSchema(session.schemaName) : Promise.resolve()
      )
    );
    for (const result of idleResults) {
      if (result.status === "rejected") {
        log.error("Failed to drop idle preview schema", result.reason);
      }
    }

    if (idleSessions.length > 0) {
      await prisma.previewSession.updateMany({
        where: {
          id: { in: idleSessions.map((s) => s.id) },
        },
        data: { schemaStatus: "DROPPED", schemaName: null },
      });
    }

    // 4. Clean stuck PROVISIONING sessions
    // Allow 15 minutes for provisioning to complete — schema creation, migration,
    // and seeding can take time under load or with large feature sets.
    const STUCK_PROVISIONING_TIMEOUT_MS = 15 * 60 * 1000;
    const stuckCutoff = new Date(Date.now() - STUCK_PROVISIONING_TIMEOUT_MS);
    await prisma.previewSession.updateMany({
      where: {
        schemaStatus: "PROVISIONING",
        createdAt: { lt: stuckCutoff },
      },
      data: { schemaStatus: "FAILED" },
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
