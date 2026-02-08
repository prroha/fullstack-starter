/**
 * FAQ Controller
 *
 * Handles HTTP requests for FAQ management.
 * Delegates business logic to faqService.
 */

import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { faqService } from "../services/faq.service";
import { auditService } from "../services/audit.service";
import { successResponse, errorResponse, ErrorCodes } from "../utils/response";
import { z } from "zod";
import { slugSchema, orderableSchema, publishableSchema } from "../utils/validation-schemas";
import { validateOrRespond, sendCsvExport } from "../utils/controller-helpers";

// ============================================================================
// Validation Schemas
// ============================================================================

const faqCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: slugSchema,
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

// ============================================================================
// Controller
// ============================================================================

export const faqController = {
  // ==========================================================================
  // FAQ Categories
  // ==========================================================================

  async getCategories(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const categories = await faqService.getCategories();
      res.json(successResponse({ categories }));
    } catch (error) {
      next(error);
    }
  },

  async createCategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validated = validateOrRespond(faqCategorySchema, req.body, res);
      if (!validated) return;

      const category = await faqService.createCategory(validated);

      await auditService.log({
        userId: req.user.userId,
        action: "CREATE",
        entity: "FaqCategory",
        entityId: category.id,
        changes: { new: validated },
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
      const validated = validateOrRespond(faqCategorySchema.partial(), req.body, res);
      if (!validated) return;

      const existing = await faqService.getCategoryById(id);
      const category = await faqService.updateCategory(id, validated);

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
      const existing = await faqService.deleteCategory(id);

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

  // ==========================================================================
  // FAQs
  // ==========================================================================

  async getFaqs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { categoryId, isActive } = req.query;

      const faqs = await faqService.getFaqs({
        categoryId: categoryId as string | undefined,
        isActive: isActive !== undefined ? isActive === "true" : undefined,
      });

      res.json(successResponse({ faqs }));
    } catch (error) {
      next(error);
    }
  },

  async getFaq(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const faq = await faqService.getFaqById(id);
      res.json(successResponse({ faq }));
    } catch (error) {
      next(error);
    }
  },

  async createFaq(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validated = validateOrRespond(faqSchema, req.body, res);
      if (!validated) return;

      const faq = await faqService.createFaq(validated);

      await auditService.log({
        userId: req.user.userId,
        action: "CREATE",
        entity: "Faq",
        entityId: faq.id,
        changes: { new: validated },
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
      const validated = validateOrRespond(faqSchema.partial(), req.body, res);
      if (!validated) return;

      const existing = await faqService.getFaqById(id);
      const faq = await faqService.updateFaq(id, validated);

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
      const existing = await faqService.deleteFaq(id);

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
      await faqService.reorderFaqs(items);
      res.json(successResponse({ message: "FAQs reordered" }));
    } catch (error) {
      next(error);
    }
  },

  // ==========================================================================
  // Public endpoints (no auth required)
  // ==========================================================================

  async getPublicFaqs(req: Request, res: Response, next: NextFunction) {
    try {
      const { categorySlug } = req.query;
      const faqs = await faqService.getPublicFaqs(categorySlug as string | undefined);
      res.json(successResponse({ faqs }));
    } catch (error) {
      next(error);
    }
  },

  async getPublicCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await faqService.getPublicCategories();
      res.json(successResponse({ categories }));
    } catch (error) {
      next(error);
    }
  },

  /**
   * Export all FAQs as CSV (admin only)
   * GET /api/v1/admin/faqs/export
   */
  async exportFaqs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const faqs = await faqService.getAllForExport();

      sendCsvExport(res, faqs, [
        { header: "ID", accessor: "id" },
        { header: "Category", accessor: (item) => item.category?.name || "" },
        { header: "Question", accessor: "question" },
        { header: "Answer", accessor: "answer" },
        { header: "Order", accessor: "order" },
        { header: "Active", accessor: "isActive" },
        { header: "Created At", accessor: (item) => item.createdAt.toISOString() },
        { header: "Updated At", accessor: (item) => item.updatedAt.toISOString() },
      ], { filenamePrefix: "faqs-export" });
    } catch (error) {
      next(error);
    }
  },
};
