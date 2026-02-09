import { Router } from "express";
import { z } from "zod";
import { v4 as uuid } from "uuid";
import { prisma } from "../../config/db.js";
import { sendSuccess, sendPaginated, parsePaginationParams, createPaginationInfo } from "../../utils/response.js";
import { ApiError } from "../../utils/errors.js";

const router = Router();

/**
 * GET /api/admin/licenses
 * List all licenses
 */
router.get("/", async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePaginationParams(req.query as { page?: string; limit?: string });
    const { status, search } = req.query;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { licenseKey: { contains: search as string, mode: "insensitive" } },
        { order: { orderNumber: { contains: search as string, mode: "insensitive" } } },
        { order: { customerEmail: { contains: search as string, mode: "insensitive" } } },
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

    sendPaginated(res, licenses, createPaginationInfo(page, limit, total));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/licenses/:id
 * Get single license
 */
router.get("/:id", async (req, res, next) => {
  try {
    const license = await prisma.license.findUnique({
      where: { id: req.params.id },
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

    sendSuccess(res, license);
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/licenses/:id/extend
 * Extend license expiry
 */
router.patch("/:id/extend", async (req, res, next) => {
  try {
    const schema = z.object({
      days: z.number().int().min(1).max(365),
    });
    const { days } = schema.parse(req.body);

    const license = await prisma.license.findUnique({ where: { id: req.params.id } });
    if (!license) {
      throw ApiError.notFound("License");
    }

    const currentExpiry = license.expiresAt || new Date();
    const newExpiry = new Date(currentExpiry.getTime() + days * 24 * 60 * 60 * 1000);

    const updated = await prisma.license.update({
      where: { id: req.params.id },
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

    sendSuccess(res, updated, `License extended by ${days} days`);
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/licenses/:id/revoke
 * Revoke license
 */
router.patch("/:id/revoke", async (req, res, next) => {
  try {
    const schema = z.object({
      reason: z.string().min(1),
    });
    const { reason } = schema.parse(req.body);

    const license = await prisma.license.findUnique({ where: { id: req.params.id } });
    if (!license) {
      throw ApiError.notFound("License");
    }

    const updated = await prisma.license.update({
      where: { id: req.params.id },
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

    sendSuccess(res, updated, "License revoked");
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/licenses/:id/regenerate
 * Regenerate download token
 */
router.post("/:id/regenerate", async (req, res, next) => {
  try {
    const license = await prisma.license.findUnique({ where: { id: req.params.id } });
    if (!license) {
      throw ApiError.notFound("License");
    }

    if (license.status !== "ACTIVE") {
      throw ApiError.badRequest("Can only regenerate active licenses");
    }

    const newToken = uuid();
    const updated = await prisma.license.update({
      where: { id: req.params.id },
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

    sendSuccess(res, { downloadToken: updated.downloadToken }, "Download token regenerated");
  } catch (error) {
    next(error);
  }
});

export { router as licensesRoutes };
