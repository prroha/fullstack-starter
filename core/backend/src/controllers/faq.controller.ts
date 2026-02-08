import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { db } from "../lib/db";
import { auditService } from "../services/audit.service";
import { successResponse, errorResponse, ErrorCodes } from "../utils/response";
import { z } from "zod";

// Validation schemas
const faqCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

const faqSchema = z.object({
  categoryId: z.string().uuid().nullable().optional(),
  question: z.string().min(1).max(500),
  answer: z.string().min(1),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const faqController = {
  // ============================================================================
  // FAQ Categories
  // ============================================================================

  async getCategories(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const categories = await db.faqCategory.findMany({
        include: { _count: { select: { faqs: true } } },
        orderBy: { order: "asc" },
      });

      res.json(successResponse({ categories }));
    } catch (error) {
      next(error);
    }
  },

  async createCategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const parsed = faqCategorySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json(errorResponse(ErrorCodes.VALIDATION_ERROR, "Invalid input"));
      }

      const category = await db.faqCategory.create({
        data: parsed.data,
      });

      await auditService.log({
        userId: req.user.userId,
        action: "CREATE",
        entity: "FaqCategory",
        entityId: category.id,
        changes: { new: parsed.data },
        req,
      });

      res.status(201).json(successResponse({ category }));
    } catch (error) {
      next(error);
    }
  },

  async updateCategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const parsed = faqCategorySchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json(errorResponse(ErrorCodes.VALIDATION_ERROR, "Invalid input"));
      }

      const existing = await db.faqCategory.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, "Category not found"));
      }

      const category = await db.faqCategory.update({
        where: { id },
        data: parsed.data,
      });

      await auditService.log({
        userId: req.user.userId,
        action: "UPDATE",
        entity: "FaqCategory",
        entityId: id,
        changes: { old: existing, new: category },
        req,
      });

      res.json(successResponse({ category }));
    } catch (error) {
      next(error);
    }
  },

  async deleteCategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;

      const existing = await db.faqCategory.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, "Category not found"));
      }

      await db.faqCategory.delete({ where: { id } });

      await auditService.log({
        userId: req.user.userId,
        action: "DELETE",
        entity: "FaqCategory",
        entityId: id,
        changes: { old: existing },
        req,
      });

      res.json(successResponse({ message: "Category deleted" }));
    } catch (error) {
      next(error);
    }
  },

  // ============================================================================
  // FAQs
  // ============================================================================

  async getFaqs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { categoryId, isActive } = req.query;

      const where: Record<string, unknown> = {};
      if (categoryId) where.categoryId = categoryId as string;
      if (isActive !== undefined) where.isActive = isActive === "true";

      const faqs = await db.faq.findMany({
        where,
        include: { category: { select: { id: true, name: true, slug: true } } },
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      });

      res.json(successResponse({ faqs }));
    } catch (error) {
      next(error);
    }
  },

  async getFaq(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;

      const faq = await db.faq.findUnique({
        where: { id },
        include: { category: { select: { id: true, name: true, slug: true } } },
      });

      if (!faq) {
        return res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, "FAQ not found"));
      }

      res.json(successResponse({ faq }));
    } catch (error) {
      next(error);
    }
  },

  async createFaq(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const parsed = faqSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json(errorResponse(ErrorCodes.VALIDATION_ERROR, "Invalid input"));
      }

      const faq = await db.faq.create({
        data: {
          ...parsed.data,
          categoryId: parsed.data.categoryId || null,
        },
        include: { category: { select: { id: true, name: true, slug: true } } },
      });

      await auditService.log({
        userId: req.user.userId,
        action: "CREATE",
        entity: "Faq",
        entityId: faq.id,
        changes: { new: parsed.data },
        req,
      });

      res.status(201).json(successResponse({ faq }));
    } catch (error) {
      next(error);
    }
  },

  async updateFaq(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const parsed = faqSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json(errorResponse(ErrorCodes.VALIDATION_ERROR, "Invalid input"));
      }

      const existing = await db.faq.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, "FAQ not found"));
      }

      const faq = await db.faq.update({
        where: { id },
        data: {
          ...parsed.data,
          categoryId: parsed.data.categoryId === null ? null : parsed.data.categoryId,
        },
        include: { category: { select: { id: true, name: true, slug: true } } },
      });

      await auditService.log({
        userId: req.user.userId,
        action: "UPDATE",
        entity: "Faq",
        entityId: id,
        changes: { old: existing, new: faq },
        req,
      });

      res.json(successResponse({ faq }));
    } catch (error) {
      next(error);
    }
  },

  async deleteFaq(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;

      const existing = await db.faq.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, "FAQ not found"));
      }

      await db.faq.delete({ where: { id } });

      await auditService.log({
        userId: req.user.userId,
        action: "DELETE",
        entity: "Faq",
        entityId: id,
        changes: { old: existing },
        req,
      });

      res.json(successResponse({ message: "FAQ deleted" }));
    } catch (error) {
      next(error);
    }
  },

  async reorderFaqs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { items } = req.body as { items: { id: string; order: number }[] };

      await db.$transaction(
        items.map((item) =>
          db.faq.update({
            where: { id: item.id },
            data: { order: item.order },
          })
        )
      );

      res.json(successResponse({ message: "FAQs reordered" }));
    } catch (error) {
      next(error);
    }
  },

  // ============================================================================
  // Public endpoints (no auth required)
  // ============================================================================

  async getPublicFaqs(req: Request, res: Response, next: NextFunction) {
    try {
      const { categorySlug } = req.query;

      const where: Record<string, unknown> = { isActive: true };
      if (categorySlug) {
        const category = await db.faqCategory.findUnique({
          where: { slug: categorySlug as string },
        });
        if (category) {
          where.categoryId = category.id;
        }
      }

      const faqs = await db.faq.findMany({
        where,
        include: { category: { select: { id: true, name: true, slug: true } } },
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      });

      res.json(successResponse({ faqs }));
    } catch (error) {
      next(error);
    }
  },

  async getPublicCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await db.faqCategory.findMany({
        where: { isActive: true },
        include: {
          faqs: {
            where: { isActive: true },
            orderBy: { order: "asc" },
          },
        },
        orderBy: { order: "asc" },
      });

      res.json(successResponse({ categories }));
    } catch (error) {
      next(error);
    }
  },
};
