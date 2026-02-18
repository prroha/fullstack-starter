import { getAdminClient, evictClient } from "../config/db.js";
import { SCHEMA_NAME_REGEX } from "../utils/schema-name.js";

// Logger
const log = {
  info: (msg: string) => console.log(`[Orphan Cleanup] ${msg}`),
  error: (msg: string, err?: unknown) => console.error(`[Orphan Cleanup] ${msg}`, err),
};

/**
 * Scan PostgreSQL for preview_* schemas that don't match any known session.
 * Called periodically to clean up orphaned schemas from crashes or failed drops.
 */
export async function cleanupOrphanSchemas(
  studioApiUrl?: string,
  internalSecret?: string,
): Promise<number> {
  const admin = getAdminClient();

  try {
    // 1. Get all preview schemas from PostgreSQL
    const schemas = await admin.$queryRaw<Array<{ schema_name: string }>>`
      SELECT schema_name FROM information_schema.schemata
      WHERE schema_name LIKE 'preview_%'
      ORDER BY schema_name
    `;

    if (schemas.length === 0) {
      log.info("No preview schemas found");
      return 0;
    }

    log.info(`Found ${schemas.length} preview schema(s) in database`);

    // 2. Get active sessions from studio backend (if configured)
    const activeSchemaNames = new Set<string>();
    if (studioApiUrl && internalSecret) {
      try {
        // Use the studio API to get active session schema names
        // For now, we'll skip this and clean up schemas older than 24 hours
        // TODO: Implement studio API call when endpoint is available
      } catch {
        log.error("Failed to fetch active sessions from studio");
      }
    }

    // 3. For schemas not matching active sessions, check age
    let droppedCount = 0;
    for (const { schema_name } of schemas) {
      if (activeSchemaNames.has(schema_name)) continue;

      // Validate schema name before using in raw SQL
      if (!SCHEMA_NAME_REGEX.test(schema_name)) {
        log.error(`Skipping invalid schema name from DB: ${schema_name}`);
        continue;
      }

      // Check if schema has any tables — empty schemas are likely failed provisions
      try {
        const tables = await admin.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*) as count FROM information_schema.tables
          WHERE table_schema = ${schema_name}
        `;

        const tableCount = Number(tables[0]?.count ?? 0);
        if (tableCount === 0) {
          // Empty schema — likely a failed provision, safe to drop
          await admin.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema_name}" CASCADE`);
          await evictClient(schema_name);
          droppedCount++;
          log.info(`Dropped empty orphan schema: ${schema_name}`);
        }
      } catch (err) {
        log.error(`Error checking schema ${schema_name}:`, err);
      }
    }

    log.info(`Cleaned up ${droppedCount} orphan schema(s)`);
    return droppedCount;
  } catch (error) {
    log.error("Error in orphan cleanup:", error);
    throw error;
  }
}

// Periodic cleanup timer
let orphanCleanupTimer: NodeJS.Timeout | null = null;

export function startOrphanCleanup(
  intervalMs: number = 6 * 60 * 60 * 1000, // 6 hours
  studioApiUrl?: string,
  internalSecret?: string,
): void {
  orphanCleanupTimer = setInterval(async () => {
    log.info(`Starting orphan cleanup at ${new Date().toISOString()}`);
    try {
      await cleanupOrphanSchemas(studioApiUrl, internalSecret);
    } catch (error) {
      log.error("Failed to run orphan cleanup:", error);
    }
  }, intervalMs);
  orphanCleanupTimer.unref(); // don't prevent process exit
  log.info(`Scheduled orphan cleanup every ${intervalMs / (60 * 60 * 1000)}h`);
}

export function stopOrphanCleanup(): void {
  if (orphanCleanupTimer) {
    clearInterval(orphanCleanupTimer);
    orphanCleanupTimer = null;
  }
}
