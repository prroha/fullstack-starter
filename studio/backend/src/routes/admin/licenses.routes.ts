import { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { v4 as uuid } from "uuid";
import { prisma } from "../../config/db.js";
import { sendSuccess, sendPaginated, parsePaginationParams, createPaginationInfo } from "../../utils/response.js";
import { ApiError } from "../../utils/errors.js";

const routePlugin: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/admin/licenses
   * List all licenses
   */
  fastify.get("/", async (req: FastifyRequest, reply: FastifyReply) => {
    const query = req.query as Record<string, string>;
    const { page, limit, skip } = parsePaginationParams(query as { page?: string; limit?: string });
    const { status, search } = query;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { licenseKey: { contains: search, mode: "insensitive" } },
        { order: { orderNumber: { contains: search, mode: "insensitive" } } },
        { order: { customerEmail: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [licenses, total] = await Promise.all([
      prisma.license.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          order: {
            select: {
              orderNumber: true,
              customerEmail: true,
              customerName: true,
              tier: true,
              template: { select: { name: true } },
            },
          },
        },
      }),
      prisma.license.count({ where }),
    ]);

    return sendPaginated(reply, licenses, createPaginationInfo(page, limit, total));
  });

  /**
   * GET /api/admin/licenses/:id
   * Get single license
   */
  fastify.get("/:id", async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as Record<string, string>;
    const license = await prisma.license.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            user: { select: { id: true, email: true, name: true } },
            template: true,
          },
        },
      },
    });

    if (!license) {
      throw ApiError.notFound("License");
    }

    return sendSuccess(reply, license);
  });

  /**
   * PATCH /api/admin/licenses/:id/extend
   * Extend license expiry
   */
  fastify.patch("/:id/extend", async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as Record<string, string>;
    const schema = z.object({
      days: z.number().int().min(1).max(365),
    });
    const { days } = schema.parse(req.body);

    const license = await prisma.license.findUnique({ where: { id } });
    if (!license) {
      throw ApiError.notFound("License");
    }

    const currentExpiry = license.expiresAt || new Date();
    const newExpiry = new Date(currentExpiry.getTime() + days * 24 * 60 * 60 * 1000);

    const updated = await prisma.license.update({
      where: { id },
      data: {
        expiresAt: newExpiry,
        status: "ACTIVE",
      },
    });

    await prisma.studioAuditLog.create({
      data: {
        adminId: req.user?.id,
        adminEmail: req.user?.email,
        action: "EXTEND_LICENSE",
        entityType: "license",
        entityId: license.id,
        metadata: { days, newExpiry: newExpiry.toISOString() },
      },
    });

    return sendSuccess(reply, updated, `License extended by ${days} days`);
  });

  /**
   * PATCH /api/admin/licenses/:id/revoke
   * Revoke license
   */
  fastify.patch("/:id/revoke", async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as Record<string, string>;
    const schema = z.object({
      reason: z.string().min(1),
    });
    const { reason } = schema.parse(req.body);

    const license = await prisma.license.findUnique({ where: { id } });
    if (!license) {
      throw ApiError.notFound("License");
    }

    const updated = await prisma.license.update({
      where: { id },
      data: {
        status: "REVOKED",
        revokedAt: new Date(),
        revokedReason: reason,
      },
    });

    await prisma.studioAuditLog.create({
      data: {
        adminId: req.user?.id,
        adminEmail: req.user?.email,
        action: "REVOKE_LICENSE",
        entityType: "license",
        entityId: license.id,
        metadata: { reason },
      },
    });

    return sendSuccess(reply, updated, "License revoked");
  });

  /**
   * POST /api/admin/licenses/:id/regenerate
   * Regenerate download token
   */
  fastify.post("/:id/regenerate", async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as Record<string, string>;
    const license = await prisma.license.findUnique({ where: { id } });
    if (!license) {
      throw ApiError.notFound("License");
    }

    if (license.status !== "ACTIVE") {
      throw ApiError.badRequest("Can only regenerate active licenses");
    }

    const newToken = uuid();
    const updated = await prisma.license.update({
      where: { id },
      data: {
        downloadToken: newToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.studioAuditLog.create({
      data: {
        adminId: req.user?.id,
        adminEmail: req.user?.email,
        action: "REGENERATE_TOKEN",
        entityType: "license",
        entityId: license.id,
      },
    });

    return sendSuccess(reply, { downloadToken: updated.downloadToken }, "Download token regenerated");
  });
};

export { routePlugin as licensesRoutes };
