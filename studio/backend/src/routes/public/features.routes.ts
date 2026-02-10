import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/db.js";
import { sendSuccess, sendPaginated, parsePaginationParams, createPaginationInfo } from "../../utils/response.js";
import { ApiError } from "../../utils/errors.js";

const router = Router();

// Query parameter validation schemas
const listFeaturesQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().max(100).optional(),
  category: z.string().max(50).optional(),
  tier: z.enum(["basic", "starter", "pro", "business", "enterprise"]).optional(),
});

const slugParamSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-_.]+$/),
});

const categoryParamSchema = z.object({
  category: z.string().min(1).max(50).regex(/^[a-z0-9-_]+$/),
});

/**
 * GET /api/features
 * List all active features with their modules
 */
router.get("/", async (req, res, next) => {
  try {
    // Validate query parameters
    const queryResult = listFeaturesQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      throw ApiError.validation(queryResult.error.flatten().fieldErrors);
    }
    const { search, category, tier } = queryResult.data;
    const { page, limit, skip } = parsePaginationParams(req.query as { page?: string; limit?: string });

    const where: Record<string, unknown> = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (tier) {
      where.OR = [
        { tier: null },
        { tier: tier },
        // Include lower tiers
        ...(tier === "enterprise" ? [{ tier: "business" }, { tier: "pro" }, { tier: "starter" }, { tier: "basic" }] : []),
        ...(tier === "business" ? [{ tier: "pro" }, { tier: "starter" }, { tier: "basic" }] : []),
        ...(tier === "pro" ? [{ tier: "starter" }, { tier: "basic" }] : []),
        ...(tier === "starter" ? [{ tier: "basic" }] : []),
      ];
    }

    // Handle category filter via module relationship
    const moduleWhere = category ? { category, isActive: true } : { isActive: true };

    const [features, modules, total] = await Promise.all([
      prisma.feature.findMany({
        where: {
          ...where,
          module: moduleWhere,
        },
        skip,
        take: limit,
        orderBy: [{ module: { displayOrder: "asc" } }, { displayOrder: "asc" }],
        include: {
          module: {
            select: {
              id: true,
              name: true,
              slug: true,
              category: true,
              iconName: true,
            },
          },
        },
      }),
      prisma.module.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: "asc" },
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          category: true,
          iconName: true,
          displayOrder: true,
        },
      }),
      prisma.feature.count({
        where: {
          ...where,
          module: moduleWhere,
        },
      }),
    ]);

    // Return features and modules together
    sendSuccess(res, {
      items: features,
      modules,
      pagination: createPaginationInfo(page, limit, total),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/features/:slug
 * Get single feature by slug
 */
router.get("/:slug", async (req, res, next) => {
  try {
    // Validate slug parameter
    const paramResult = slugParamSchema.safeParse(req.params);
    if (!paramResult.success) {
      throw ApiError.validation(paramResult.error.flatten().fieldErrors);
    }

    const feature = await prisma.feature.findFirst({
      where: {
        slug: paramResult.data.slug,
        isActive: true,
      },
      include: {
        module: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: true,
            description: true,
            iconName: true,
          },
        },
      },
    });

    if (!feature) {
      throw ApiError.notFound("Feature");
    }

    sendSuccess(res, feature);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/features/category/:category
 * Get features by category
 */
router.get("/category/:category", async (req, res, next) => {
  try {
    // Validate category parameter
    const paramResult = categoryParamSchema.safeParse(req.params);
    if (!paramResult.success) {
      throw ApiError.validation(paramResult.error.flatten().fieldErrors);
    }
    const { category } = paramResult.data;
    const { page, limit, skip } = parsePaginationParams(req.query as { page?: string; limit?: string });

    const [features, total] = await Promise.all([
      prisma.feature.findMany({
        where: {
          isActive: true,
          module: {
            category,
            isActive: true,
          },
        },
        skip,
        take: limit,
        orderBy: [{ module: { displayOrder: "asc" } }, { displayOrder: "asc" }],
        include: {
          module: {
            select: {
              id: true,
              name: true,
              slug: true,
              category: true,
              iconName: true,
            },
          },
        },
      }),
      prisma.feature.count({
        where: {
          isActive: true,
          module: {
            category,
            isActive: true,
          },
        },
      }),
    ]);

    sendPaginated(res, features, createPaginationInfo(page, limit, total));
  } catch (error) {
    next(error);
  }
});

export { router as publicFeaturesRoutes };
