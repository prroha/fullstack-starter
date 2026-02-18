export interface CachedSession {
  token: string;
  schemaName: string;
  features: string[];
  tier: string;
  schemaStatus: string;
  expiresAt: Date;
  cachedAt: number;
}

const sessionCache = new Map<string, CachedSession>();
const SESSION_CACHE_TTL_MS = 60_000; // 60 seconds

export function getCachedSession(token: string): CachedSession | null {
  const cached = sessionCache.get(token);
  if (!cached) return null;
  if (Date.now() - cached.cachedAt > SESSION_CACHE_TTL_MS) {
    sessionCache.delete(token);
    return null;
  }
  return cached;
}

export function cacheSession(session: Omit<CachedSession, "cachedAt">): void {
  sessionCache.set(session.token, { ...session, cachedAt: Date.now() });
}

export function invalidateSession(token: string): void {
  sessionCache.delete(token);
}

export function clearSessionCache(): void {
  sessionCache.clear();
}

export function getSessionCacheSize(): number {
  return sessionCache.size;
}
