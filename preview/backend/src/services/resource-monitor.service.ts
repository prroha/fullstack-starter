import { getAdminClient, getActiveSchemaCount } from "../config/db.js";
import { getLimits } from "../config/limits.js";

export interface ResourceMetrics {
  activeSchemas: number;
  cachedClients: number;
  memoryUsageMB: number;
  uptimeSeconds: number;
  limits: {
    maxConcurrentSchemas: number;
    schemaUtilizationPercent: number;
  };
}

export async function getResourceMetrics(): Promise<ResourceMetrics> {
  const limits = getLimits();
  const cachedClients = getActiveSchemaCount();
  const memUsage = process.memoryUsage();

  // Count actual schemas in PostgreSQL
  let activeSchemas = 0;
  try {
    const admin = getAdminClient();
    const result = await admin.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM information_schema.schemata
      WHERE schema_name LIKE 'preview_%'
    `;
    activeSchemas = Number(result[0]?.count ?? 0);
  } catch {
    activeSchemas = cachedClients; // fallback to cache count
  }

  return {
    activeSchemas,
    cachedClients,
    memoryUsageMB: Math.round(memUsage.heapUsed / 1024 / 1024),
    uptimeSeconds: Math.round(process.uptime()),
    limits: {
      maxConcurrentSchemas: limits.maxConcurrentSchemas,
      schemaUtilizationPercent: limits.maxConcurrentSchemas > 0
        ? Math.round((activeSchemas / limits.maxConcurrentSchemas) * 100)
        : 0,
    },
  };
}

/**
 * Check if system can accept new schemas.
 * Returns null if OK, or an error message string if at capacity.
 */
export async function checkCapacity(): Promise<string | null> {
  const metrics = await getResourceMetrics();
  const limits = getLimits();

  if (metrics.activeSchemas >= limits.maxConcurrentSchemas) {
    return `Schema limit reached (${metrics.activeSchemas}/${limits.maxConcurrentSchemas})`;
  }

  // Memory warning at 90% of 512MB default heap
  if (metrics.memoryUsageMB > 460) {
    return `Memory pressure: ${metrics.memoryUsageMB}MB used`;
  }

  return null;
}
