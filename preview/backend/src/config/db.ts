import { PrismaClient } from "@prisma/client";

interface CachedClient {
  client: PrismaClient;
  lastAccessedAt: number;
}

const clientCache = new Map<string, CachedClient>();
const IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

// These will be set from env config at startup
let maxCachedClients = 50;
let connectionLimit = 2;
let databaseUrl = "";

/**
 * Initialize DB config from env. Called once at startup.
 */
export function initDbConfig(config: {
  databaseUrl: string;
  maxSchemas: number;
  connectionLimit: number;
}): void {
  databaseUrl = config.databaseUrl;
  maxCachedClients = config.maxSchemas;
  connectionLimit = config.connectionLimit;
}

// Admin client for DDL operations (CREATE/DROP SCHEMA) — singleton
let adminClient: PrismaClient | null = null;

export function getAdminClient(): PrismaClient {
  if (!adminClient) {
    adminClient = new PrismaClient({
      datasources: { db: { url: databaseUrl } },
      log: ["error"],
    });
  }
  return adminClient;
}

/**
 * Get or create a PrismaClient for a specific schema.
 * Uses LRU eviction when at capacity.
 */
export function getClientForSchema(schemaName: string): PrismaClient {
  const cached = clientCache.get(schemaName);
  if (cached) {
    cached.lastAccessedAt = Date.now();
    return cached.client;
  }

  // LRU eviction: if at capacity, evict the least recently accessed client
  if (clientCache.size >= maxCachedClients) {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    for (const [key, val] of clientCache) {
      if (val.lastAccessedAt < oldestTime) {
        oldestTime = val.lastAccessedAt;
        oldestKey = key;
      }
    }
    if (oldestKey) {
      const evicted = clientCache.get(oldestKey);
      clientCache.delete(oldestKey);
      evicted?.client.$disconnect().catch(() => {}); // fire-and-forget
    }
  }

  const baseUrl = databaseUrl.split("?")[0];
  const url = `${baseUrl}?schema=${schemaName}&connection_limit=${connectionLimit}`;

  const client = new PrismaClient({
    datasources: { db: { url } },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  clientCache.set(schemaName, { client, lastAccessedAt: Date.now() });
  return client;
}

/**
 * Evict and disconnect a specific schema's client.
 */
export async function evictClient(schemaName: string): Promise<void> {
  const cached = clientCache.get(schemaName);
  if (cached) {
    clientCache.delete(schemaName);
    await cached.client.$disconnect().catch(() => {});
  }
}

/**
 * Get the number of currently cached clients.
 */
export function getActiveSchemaCount(): number {
  return clientCache.size;
}

/**
 * Graceful shutdown: disconnect ALL cached clients.
 */
export async function disconnectAllClients(): Promise<void> {
  const disconnects = [...clientCache.values()].map((c) =>
    c.client.$disconnect().catch(() => {}),
  );
  await Promise.allSettled(disconnects);
  clientCache.clear();
  if (adminClient) {
    await adminClient.$disconnect().catch(() => {});
    adminClient = null;
  }
}

// Periodic cleanup of idle clients
let cleanupTimer: NodeJS.Timeout | null = null;

export function startClientCleanup(): void {
  cleanupTimer = setInterval(async () => {
    const now = Date.now();
    const toEvict: string[] = [];
    for (const [name, cached] of clientCache) {
      if (now - cached.lastAccessedAt > IDLE_TIMEOUT_MS) {
        toEvict.push(name);
      }
    }
    await Promise.allSettled(
      toEvict.map(async (name) => {
        const cached = clientCache.get(name);
        if (cached) {
          clientCache.delete(name);
          await cached.client.$disconnect();
        }
      }),
    );
  }, 60_000);
  cleanupTimer.unref();
}

export function stopClientCleanup(): void {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}
