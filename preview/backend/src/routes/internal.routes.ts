import { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import { verifySignature } from "@shared/backend-utils";
import { env } from "../config/env.js";
import { provisionSchema, dropSchema } from "../services/schema-manager.service.js";
import { invalidateSession } from "../config/session-cache.js";
import { getResourceMetrics, checkCapacity } from "../services/resource-monitor.service.js";
import { z } from "zod";

const provisionBody = z.object({
  sessionToken: z.string().min(10),
  features: z.array(z.string()),
  tier: z.string(),
});

/**
 * Internal API routes — secured by HMAC signature verification.
 * Called by the studio backend for schema lifecycle management.
 */
const internalRoutes: FastifyPluginAsync = async (fastify) => {
  // Verify HMAC signature on all internal routes
  fastify.addHook("preHandler", async (req: FastifyRequest, _reply: FastifyReply) => {
    const signature = req.headers["x-internal-signature"] as string;
    const timestamp = Number(req.headers["x-internal-timestamp"]);

    if (!signature || !timestamp) {
      throw Object.assign(new Error("Missing internal auth headers"), { statusCode: 401 });
    }

    const body = JSON.stringify(req.body || {});
    const isValid = verifySignature(
      env.INTERNAL_API_SECRET,
      signature,
      timestamp,
      req.method,
      req.url,
      body,
    );

    if (!isValid) {
      throw Object.assign(new Error("Invalid signature"), { statusCode: 401 });
    }
  });

  // POST /internal/schemas/provision — create and seed a preview schema
  fastify.post("/schemas/provision", async (req: FastifyRequest, reply: FastifyReply) => {
    const { sessionToken, features, tier } = provisionBody.parse(req.body);

    try {
      const schemaName = await provisionSchema(sessionToken, features, tier);
      return reply.send({ success: true, data: { schemaName, status: "READY" } });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Provisioning failed";
      return reply.code(500).send({ success: false, error: { message } });
    }
  });

  // DELETE /internal/schemas/:name — drop a preview schema
  fastify.delete("/schemas/:name", async (req: FastifyRequest<{ Params: { name: string } }>, reply: FastifyReply) => {
    const { name } = req.params;
    try {
      await dropSchema(name);
      return reply.send({ success: true, data: { message: "Schema dropped" } });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Drop failed";
      return reply.code(500).send({ success: false, error: { message } });
    }
  });

  // POST /internal/sessions/invalidate — invalidate a cached session
  fastify.post("/sessions/invalidate", async (req: FastifyRequest, reply: FastifyReply) => {
    const invalidateBody = z.object({ sessionToken: z.string().min(1) });
    const parsed = invalidateBody.safeParse(req.body);
    if (parsed.success && parsed.data.sessionToken) {
      invalidateSession(parsed.data.sessionToken);
    }
    return reply.send({ success: true });
  });

  // GET /internal/health — internal health check
  fastify.get("/health", async (_req: FastifyRequest, reply: FastifyReply) => {
    return reply.send({ status: "ok", timestamp: new Date().toISOString() });
  });

  // GET /internal/metrics — operational metrics
  fastify.get("/metrics", async (_req: FastifyRequest, reply: FastifyReply) => {
    const metrics = await getResourceMetrics();
    const capacityWarning = await checkCapacity();
    return reply.send({
      ...metrics,
      ...(capacityWarning && { warning: capacityWarning }),
    });
  });

  // GET /internal/capacity — quick capacity check for provisioning decisions
  fastify.get("/capacity", async (_req: FastifyRequest, reply: FastifyReply) => {
    const warning = await checkCapacity();
    return reply.send({
      canProvision: !warning,
      ...(warning && { reason: warning }),
    });
  });
};

export default internalRoutes;
