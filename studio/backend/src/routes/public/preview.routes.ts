/**
 * Preview Session Routes
 * Manages preview sessions for the configurator
 */

import crypto from "crypto";
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { prisma } from "../../config/db.js";
import { env } from "../../config/env.js";
import { validateRequest } from "../../middleware/validate.middleware.js";
import { provisionPreviewSchema } from "../../services/preview-orchestrator.service.js";

// Token format validation middleware
// Token must be at least 20 characters, alphanumeric with dashes
// Note: Token lookup is performed via Prisma `findUnique({ where: { sessionToken } })`,
// which is inherently timing-safe since the comparison happens in the database
// engine via a WHERE clause, not via in-application string comparison.
const TOKEN_REGEX = /^[a-zA-Z0-9-]{20,}$/;

const validateTokenFormat = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const { token } = req.params as Record<string, string>;

  if (!token || !TOKEN_REGEX.test(token)) {
    return reply.code(400).send({
      success: false,
      error: "Invalid token format. Token must be at least 20 characters and contain only alphanumeric characters and dashes.",
    });
  }
};

// ---------------------------------------------------------------------------
// In-memory IP-based rate limiter
// ---------------------------------------------------------------------------
interface RateLimitBucket {
  count: number;
  resetAt: number;
}

// Map of "ip:route" -> bucket
const rateLimitStore = new Map<string, RateLimitBucket>();

// Clean up stale entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateLimitStore) {
    if (now > bucket.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

/**
 * Creates a Fastify preHandler that enforces per-IP rate limiting.
 * @param max Maximum requests allowed within the time window
 * @param windowMs Time window in milliseconds
 * @param label A label for the bucket key (to separate limits per route group)
 */
function ipRateLimit(max: number, windowMs: number, label: string) {
  return async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const ip = req.ip;
    const key = `${ip}:${label}`;
    const now = Date.now();

    let bucket = rateLimitStore.get(key);
    if (!bucket || now > bucket.resetAt) {
      bucket = { count: 0, resetAt: now + windowMs };
      rateLimitStore.set(key, bucket);
    }

    bucket.count++;

    // Set standard rate-limit headers
    const remaining = Math.max(0, max - bucket.count);
    const resetSeconds = Math.ceil((bucket.resetAt - now) / 1000);
    reply.header("RateLimit-Limit", String(max));
    reply.header("RateLimit-Remaining", String(remaining));
    reply.header("RateLimit-Reset", String(resetSeconds));

    if (bucket.count > max) {
      reply.header("Retry-After", String(resetSeconds));
      return reply.code(429).send({
        success: false,
        error: "Too many requests. Please try again later.",
      });
    }
  };
}

// Schema for creating a preview session
const createPreviewSessionSchema = z.object({
  body: z.object({
    selectedFeatures: z.array(z.string().max(100)).max(200),
    tier: z.string().max(50),
    templateSlug: z.string().max(100).optional(),
    provisionSchema: z.boolean().optional(),
  }),
});

const routePlugin: FastifyPluginAsync = async (fastify) => {
  // POST /api/preview/sessions - Create a new preview session
  // Rate limited: 10 requests per IP per minute to prevent abuse
  fastify.post(
    "/sessions",
    { preHandler: [ipRateLimit(10, 60_000, "preview:create"), validateRequest(createPreviewSessionSchema)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { selectedFeatures, tier, templateSlug, provisionSchema: shouldProvision } = req.body as {
        selectedFeatures: string[];
        tier: string;
        templateSlug?: string;
        provisionSchema?: boolean;
      };

      // Session expires in 24 hours
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const session = await prisma.previewSession.create({
        data: {
          sessionToken: crypto.randomBytes(24).toString('base64url'),
          selectedFeatures,
          tier,
          templateSlug,
          expiresAt,
        },
      });

      // Generate preview URL using the server-configured frontend origin,
      // falling back to the studio web app default
      const frontendOrigin =
        process.env.CORS_ORIGIN ||
        "http://localhost:3002";
      const previewUrl = `${frontendOrigin}/preview?preview=${session.sessionToken}`;

      let schemaStatus = session.schemaStatus;
      let schemaName: string | null = null;

      // Provision a live preview schema if requested and configured.
      // Fire-and-forget: start provisioning in the background so the HTTP response
      // returns immediately. The client should poll GET /sessions/:token/status
      // to know when the schema is ready.
      if (shouldProvision && env.PREVIEW_BACKEND_URL && env.INTERNAL_API_SECRET) {
        schemaStatus = "PROVISIONING";
        provisionPreviewSchema(
          session.sessionToken,
          selectedFeatures,
          tier,
        ).catch((err) => {
          console.error("[preview] Background provisioning failed:", err instanceof Error ? err.message : err);
        });
      }

      return reply.code(201).send({
        success: true,
        data: {
          sessionId: session.id,
          sessionToken: session.sessionToken,
          previewUrl,
          expiresAt: session.expiresAt,
          schemaStatus,
          schemaName,
        },
      });
    }
  );

  // GET /api/preview/sessions/:token - Get session configuration
  // Rate limited: 60 requests per IP per minute
  fastify.get(
    "/sessions/:token",
    { preHandler: [ipRateLimit(60, 60_000, "preview:read"), validateTokenFormat] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { token } = req.params as Record<string, string>;

      const session = await prisma.previewSession.findUnique({
        where: { sessionToken: token },
      });

      if (!session) {
        return reply.code(404).send({
          success: false,
          error: "Preview session not found",
        });
      }

      // Check if expired
      if (new Date() > session.expiresAt) {
        return reply.code(410).send({
          success: false,
          error: "Preview session has expired",
        });
      }

      return reply.send({
        success: true,
        data: {
          selectedFeatures: session.selectedFeatures,
          tier: session.tier,
          templateSlug: session.templateSlug,
          expiresAt: session.expiresAt,
          schemaStatus: session.schemaStatus,
          schemaName: session.schemaName,
          lastAccessedAt: session.lastAccessedAt,
        },
      });
    }
  );

  // PATCH /api/preview/sessions/:token - Heartbeat (update lastAccessedAt)
  // Rate limited: 30 requests per IP per minute
  fastify.patch(
    "/sessions/:token",
    { preHandler: [ipRateLimit(30, 60_000, "preview:update"), validateTokenFormat] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { token } = req.params as Record<string, string>;
      const session = await prisma.previewSession.findUnique({
        where: { sessionToken: token },
      });
      if (!session) return reply.code(404).send({ success: false, error: "Session not found" });
      if (new Date() > session.expiresAt) return reply.code(410).send({ success: false, error: "Session expired" });

      await prisma.previewSession.update({
        where: { sessionToken: token },
        data: { lastAccessedAt: new Date() },
      });
      return reply.send({ success: true, data: { schemaStatus: session.schemaStatus } });
    }
  );

  // GET /api/preview/sessions/:token/status - Lightweight polling for schema status
  // Rate limited: 60 requests per IP per minute
  fastify.get(
    "/sessions/:token/status",
    { preHandler: [ipRateLimit(60, 60_000, "preview:read"), validateTokenFormat] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { token } = req.params as Record<string, string>;
      const session = await prisma.previewSession.findUnique({
        where: { sessionToken: token },
        select: { schemaStatus: true, schemaName: true, expiresAt: true },
      });
      if (!session) return reply.code(404).send({ success: false, error: "Session not found" });

      const previewUrl = session.schemaStatus === "READY" && env.PREVIEW_BACKEND_URL
        ? env.PREVIEW_BACKEND_URL.replace(/:\d+$/, ':3004') // Derive frontend URL
        : null;

      return reply.send({
        success: true,
        data: { schemaStatus: session.schemaStatus, previewUrl },
      });
    }
  );

  // DELETE /api/preview/sessions/:token - Delete a session
  // Rate limited: 30 requests per IP per minute
  fastify.delete(
    "/sessions/:token",
    { preHandler: [ipRateLimit(30, 60_000, "preview:delete"), validateTokenFormat] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { token } = req.params as Record<string, string>;

      try {
        await prisma.previewSession.delete({
          where: { sessionToken: token },
        });

        return reply.send({
          success: true,
          message: "Preview session deleted",
        });
      } catch (error: unknown) {
        // Handle "record not found" gracefully (already deleted or expired)
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          (error as { code: string }).code === "P2025"
        ) {
          return reply.send({
            success: true,
            message: "Preview session already deleted",
          });
        }
        throw error;
      }
    }
  );
};

export default routePlugin;
