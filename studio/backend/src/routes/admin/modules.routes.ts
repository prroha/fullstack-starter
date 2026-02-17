import { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { prisma } from "../../config/db.js";
import { sendSuccess, sendPaginated, parsePaginationParams, createPaginationInfo } from "../../utils/response.js";
import { ApiError } from "../../utils/errors.js";

const moduleSchema = z.object({
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  name: z.string().min(2).max(100),
  description: z.string().min(10),
  category: z.string(),
  iconName: z.string().optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

const routePlugin: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/admin/modules
   * List all modules with their features
   */
  fastify.get("/", async (req: FastifyRequest, reply: FastifyReply) => {
    const query = req.query as Record<string, string>;
    const { page, limit, skip } = parsePaginationParams(query as { page?: string; limit?: string });
    const { search, category, isActive } = query;

    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (isActive !== undefined) where.isActive = isActive === "true";
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
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

    return sendPaginated(reply, modules, createPaginationInfo(page, limit, total));
  });

  /**
   * GET /api/admin/modules/categories
   * Get unique module categories
   */
  fastify.get("/categories", async (_req: FastifyRequest, reply: FastifyReply) => {
    const categories = await prisma.module.findMany({
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    });

    return sendSuccess(reply, categories.map(c => c.category));
  });

  /**
   * GET /api/admin/modules/:id
   * Get single module with features
   */
  fastify.get("/:id", async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as Record<string, string>;
    const module = await prisma.module.findUnique({
      where: { id },
      include: {
        features: { orderBy: { displayOrder: "asc" } },
      },
    });

    if (!module) {
      throw ApiError.notFound("Module");
    }

    return sendSuccess(reply, module);
  });

  /**
   * POST /api/admin/modules
   * Create new module
   */
  fastify.post("/", async (req: FastifyRequest, reply: FastifyReply) => {
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

    return sendSuccess(reply, module, "Module created", 201);
  });

  /**
   * PUT /api/admin/modules/:id
   * Update module
   */
  fastify.put("/:id", async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as Record<string, string>;
    const data = moduleSchema.partial().parse(req.body);

    const existing = await prisma.module.findUnique({ where: { id } });
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
      where: { id },
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

    return sendSuccess(reply, module, "Module updated");
  });

  /**
   * DELETE /api/admin/modules/:id
   * Delete module (only if no features)
   */
  fastify.delete("/:id", async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as Record<string, string>;
    const module = await prisma.module.findUnique({
      where: { id },
      include: { _count: { select: { features: true } } },
    });

    if (!module) {
      throw ApiError.notFound("Module");
    }

    if (module._count.features > 0) {
      throw ApiError.badRequest("Cannot delete module with features. Delete features first.");
    }

    await prisma.module.delete({ where: { id } });

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

    return sendSuccess(reply, null, "Module deleted");
  });
};

export { routePlugin as modulesRoutes };
