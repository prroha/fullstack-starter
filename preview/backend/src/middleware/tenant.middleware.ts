import { FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient } from "@prisma/client";
import { getClientForSchema } from "../config/db.js";
import { getCachedSession, cacheSession, CachedSession } from "../config/session-cache.js";

// Augment Fastify request type
declare module "fastify" {
  interface FastifyRequest {
    db?: PrismaClient;
    previewSession?: {
      token: string;
      schemaName: string;
      features: string[];
      tier: string;
    };
  }
}

// Simple circuit breaker for studio API calls
let consecutiveFailures = 0;
let circuitOpenUntil = 0;
const CIRCUIT_THRESHOLD = 5;
const CIRCUIT_RESET_MS = 30_000;

async function fetchSessionFromStudio(
  token: string,
  studioApiUrl: string
): Promise<Omit<CachedSession, "cachedAt">> {
  if (Date.now() < circuitOpenUntil) {
    throw Object.assign(new Error("Studio backend temporarily unavailable"), { statusCode: 503 });
  }

  try {
    const res = await fetch(`${studioApiUrl}/preview/sessions/${token}`);
    if (!res.ok) {
      if (res.status === 404 || res.status === 410) {
        throw Object.assign(new Error("Preview session not found or expired"), { statusCode: 401 });
      }
      throw new Error(`Studio returned ${res.status}`);
    }
    consecutiveFailures = 0;
    const { data } = await res.json() as { data: { schemaName: string; selectedFeatures: string[]; tier: string; schemaStatus: string; expiresAt: string } };
    return {
      token,
      schemaName: data.schemaName,
      features: data.selectedFeatures,
      tier: data.tier,
      schemaStatus: data.schemaStatus,
      expiresAt: new Date(data.expiresAt),
    };
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) throw error;
    consecutiveFailures++;
    if (consecutiveFailures >= CIRCUIT_THRESHOLD) {
      circuitOpenUntil = Date.now() + CIRCUIT_RESET_MS;
    }
    throw error;
  }
}

/**
 * Create tenant middleware with injected config.
 */
export function createTenantMiddleware(studioApiUrl: string) {
  return async function tenantMiddleware(
    req: FastifyRequest,
    _reply: FastifyReply,
  ): Promise<void> {
    // Skip for health check and internal routes
    if (req.url === "/health" || req.url.startsWith("/internal")) {
      return;
    }

    const sessionToken = req.headers["x-preview-session"] as string;
    if (!sessionToken) {
      throw Object.assign(new Error("X-Preview-Session header required"), { statusCode: 401 });
    }

    // Session cache: avoid studio API call on every request
    let session = getCachedSession(sessionToken);
    if (!session) {
      const fetched = await fetchSessionFromStudio(sessionToken, studioApiUrl);
      cacheSession(fetched);
      session = { ...fetched, cachedAt: Date.now() };
    }

    if (session.schemaStatus !== "READY") {
      throw Object.assign(new Error("Preview schema is not ready yet"), { statusCode: 400 });
    }

    req.db = getClientForSchema(session.schemaName);
    req.previewSession = {
      token: sessionToken,
      schemaName: session.schemaName,
      features: session.features,
      tier: session.tier,
    };
  };
}
