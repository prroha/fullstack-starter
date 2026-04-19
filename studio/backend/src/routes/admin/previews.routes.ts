import { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../config/db.js";
import { dropPreviewSchema } from "../../services/preview-orchestrator.service.js";
import {
  sendSuccess,
  sendPaginated,
  parsePaginationParams,
  createPaginationInfo,
} from "../../utils/response.js";
import { ApiError } from "../../utils/errors.js";

const VALID_STATUSES = ["PENDING", "PROVISIONING", "READY", "FAILED", "DROPPED"] as const;
type SchemaStatus = (typeof VALID_STATUSES)[number];

const routePlugin: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/admin/previews/stats
   * Aggregate statistics for preview sessions
   * NOTE: Must be defined BEFORE /:id route to avoid being matched as an id
   */
  fastify.get("/stats", async (_req: FastifyRequest, reply: FastifyReply) => {
    const now = new Date();

    const [total, byStatusRaw, active, expired] = await Promise.all([
      prisma.previewSession.count(),
      prisma.previewSession.groupBy({
        by: ["schemaStatus"],
        _count: { id: true },
      }),
      prisma.previewSession.count({
        where: { expiresAt: { gt: now } },
      }),
      prisma.previewSession.count({
        where: { expiresAt: { lte: now } },
      }),
    ]);

    const byStatus: Record<SchemaStatus, number> = {
      PENDING: 0,
      PROVISIONING: 0,
      READY: 0,
      FAILED: 0,
      DROPPED: 0,
    };

    for (const entry of byStatusRaw) {
      const status = entry.schemaStatus as SchemaStatus;
      byStatus[status] = entry._count.id;
    }

    return sendSuccess(reply, { total, byStatus, active, expired });
  });

  /**
   * GET /api/admin/previews
   * List preview sessions (paginated, filterable)
   */
  fastify.get("/", async (req: FastifyRequest, reply: FastifyReply) => {
    const query = req.query as Record<string, string>;
    const { page, limit, skip } = parsePaginationParams(query as { page?: string; limit?: string });
    const { status, search } = query;

    const where: Record<string, unknown> = {};

    if (status && VALID_STATUSES.includes(status as SchemaStatus)) {
      where.schemaStatus = status;
    }

    if (search) {
      where.OR = [
        { sessionToken: { contains: search, mode: "insensitive" } },
        { tier: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.previewSession.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.previewSession.count({ where }),
    ]);

    return sendPaginated(reply, items, createPaginationInfo(page, limit, total));
  });

  /**
   * DELETE /api/admin/previews/:id
   * Force-drop schema and delete session
   */
  fastify.delete("/:id", async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as Record<string, string>;

    const session = await prisma.previewSession.findUnique({ where: { id } });
    if (!session) {
      throw ApiError.notFound("Preview session");
    }

    if (session.schemaName) {
      await dropPreviewSchema(session.schemaName);
    }

    await prisma.previewSession.delete({ where: { id } });

    return sendSuccess(reply, null, "Preview session deleted and schema dropped");
  });

  /**
   * POST /api/admin/previews/purge
   * Bulk cleanup of expired sessions
   */
  fastify.post("/purge", async (_req: FastifyRequest, reply: FastifyReply) => {
    const now = new Date();

    const expiredSessions = await prisma.previewSession.findMany({
      where: { expiresAt: { lte: now } },
      select: { id: true, schemaName: true },
    });

    // Drop schemas for sessions that have one, ignoring individual errors
    const dropPromises = expiredSessions
      .filter((s) => s.schemaName !== null)
      .map((s) =>
        dropPreviewSchema(s.schemaName as string).catch(() => {
          // Ignore errors during bulk purge — schema may already be dropped
        })
      );

    await Promise.all(dropPromises);

    const { count } = await prisma.previewSession.deleteMany({
      where: { expiresAt: { lte: now } },
    });

    return sendSuccess(reply, { purged: count });
  });
};

export { routePlugin as previewsRoutes };
