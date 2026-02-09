import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/db.js";
import { sendSuccess, sendPaginated, parsePaginationParams, createPaginationInfo } from "../../utils/response.js";
import { ApiError } from "../../utils/errors.js";

const router = Router();

const moduleSchema = z.object({
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  name: z.string().min(2).max(100),
  description: z.string().min(10),
  category: z.string(),
  iconName: z.string().optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/admin/modules
 * List all modules with their features
 */
router.get("/", async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePaginationParams(req.query as { page?: string; limit?: string });
    const { search, category, isActive } = req.query;

    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (isActive !== undefined) where.isActive = isActive === "true";
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: "insensitive" } },
        { slug: { contains: search as string, mode: "insensitive" } },
      ];
    }

    const [modules, total] = await Promise.all([
      prisma.module.findMany({
        where,
        skip,
        take: limit,
        orderBy: { displayOrder: "asc" },
        include: {
          features: {
            select: { id: true, name: true, slug: true, price: true, isActive: true },
            orderBy: { displayOrder: "asc" },
          },
        },
      }),
      prisma.module.count({ where }),
    ]);

    sendPaginated(res, modules, createPaginationInfo(page, limit, total));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/modules/categories
 * Get unique module categories
 */
router.get("/categories", async (_req, res, next) => {
  try {
    const categories = await prisma.module.findMany({
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    });

    sendSuccess(res, categories.map(c => c.category));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/modules/:id
 * Get single module with features
 */
router.get("/:id", async (req, res, next) => {
  try {
    const module = await prisma.module.findUnique({
      where: { id: req.params.id },
      include: {
        features: { orderBy: { displayOrder: "asc" } },
      },
    });

    if (!module) {
      throw ApiError.notFound("Module");
    }

    sendSuccess(res, module);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/modules
 * Create new module
 */
router.post("/", async (req, res, next) => {
  try {
    const data = moduleSchema.parse(req.body);

    const existing = await prisma.module.findUnique({ where: { slug: data.slug } });
    if (existing) {
      throw ApiError.conflict("Module with this slug already exists");
    }

    const module = await prisma.module.create({ data });

    await prisma.studioAuditLog.create({
      data: {
        adminId: req.user?.id,
        adminEmail: req.user?.email,
        action: "CREATE",
        entityType: "module",
        entityId: module.id,
        newValues: data,
      },
    });

    sendSuccess(res, module, "Module created", 201);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/modules/:id
 * Update module
 */
router.put("/:id", async (req, res, next) => {
  try {
    const data = moduleSchema.partial().parse(req.body);

    const existing = await prisma.module.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      throw ApiError.notFound("Module");
    }

    if (data.slug && data.slug !== existing.slug) {
      const slugExists = await prisma.module.findUnique({ where: { slug: data.slug } });
      if (slugExists) {
        throw ApiError.conflict("Module with this slug already exists");
      }
    }

    const module = await prisma.module.update({
      where: { id: req.params.id },
      data,
    });

    await prisma.studioAuditLog.create({
      data: {
        adminId: req.user?.id,
        adminEmail: req.user?.email,
        action: "UPDATE",
        entityType: "module",
        entityId: module.id,
        oldValues: existing,
        newValues: data,
      },
    });

    sendSuccess(res, module, "Module updated");
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/admin/modules/:id
 * Delete module (only if no features)
 */
router.delete("/:id", async (req, res, next) => {
  try {
    const module = await prisma.module.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { features: true } } },
    });

    if (!module) {
      throw ApiError.notFound("Module");
    }

    if (module._count.features > 0) {
      throw ApiError.badRequest("Cannot delete module with features. Delete features first.");
    }

    await prisma.module.delete({ where: { id: req.params.id } });

    await prisma.studioAuditLog.create({
      data: {
        adminId: req.user?.id,
        adminEmail: req.user?.email,
        action: "DELETE",
        entityType: "module",
        entityId: module.id,
        oldValues: module,
      },
    });

    sendSuccess(res, null, "Module deleted");
  } catch (error) {
    next(error);
  }
});

export { router as modulesRoutes };
