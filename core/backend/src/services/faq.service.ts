/**
 * FAQ Service
 *
 * Business logic for FAQ and FAQ Category management.
 * Extracted from faq.controller.ts for proper separation of concerns.
 */

import { db } from "../lib/db.js";
import { ApiError } from "../middleware/error.middleware.js";

// ============================================================================
// Types
// ============================================================================

export interface CreateFaqCategoryInput {
  name: string;
  slug: string;
  order?: number;
  isActive?: boolean;
}

export interface UpdateFaqCategoryInput {
  name?: string;
  slug?: string;
  order?: number;
  isActive?: boolean;
}

export interface CreateFaqInput {
  categoryId?: string | null;
  question: string;
  answer: string;
  order?: number;
  isActive?: boolean;
}

export interface UpdateFaqInput {
  categoryId?: string | null;
  question?: string;
  answer?: string;
  order?: number;
  isActive?: boolean;
}

export interface GetFaqsParams {
  categoryId?: string;
  isActive?: boolean;
}

export interface ReorderItem {
  id: string;
  order: number;
}

// ============================================================================
// Service Class
// ============================================================================

class FaqService {
  // ==========================================================================
  // FAQ Categories
  // ==========================================================================

  /**
   * Get all FAQ categories with FAQ count
   */
  async getCategories() {
    return db.faqCategory.findMany({
      include: { _count: { select: { faqs: true } } },
      orderBy: { order: "asc" },
    });
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id: string) {
    const category = await db.faqCategory.findUnique({ where: { id } });
    if (!category) {
      throw ApiError.notFound("Category not found");
    }
    return category;
  }

  /**
   * Create a new FAQ category
   */
  async createCategory(input: CreateFaqCategoryInput) {
    return db.faqCategory.create({
      data: input,
    });
  }

  /**
   * Update FAQ category
   */
  async updateCategory(id: string, input: UpdateFaqCategoryInput) {
    const existing = await db.faqCategory.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound("Category not found");
    }

    return db.faqCategory.update({
      where: { id },
      data: input,
    });
  }

  /**
   * Delete FAQ category
   */
  async deleteCategory(id: string) {
    const existing = await db.faqCategory.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound("Category not found");
    }

    await db.faqCategory.delete({ where: { id } });
    return existing;
  }

  // ==========================================================================
  // FAQs
  // ==========================================================================

  /**
   * Get FAQs with optional filtering
   */
  async getFaqs(params: GetFaqsParams = {}) {
    const where: Record<string, unknown> = {};
    if (params.categoryId) where.categoryId = params.categoryId;
    if (params.isActive !== undefined) where.isActive = params.isActive;

    return db.faq.findMany({
      where,
      include: { category: { select: { id: true, name: true, slug: true } } },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });
  }

  /**
   * Get FAQ by ID
   */
  async getFaqById(id: string) {
    const faq = await db.faq.findUnique({
      where: { id },
      include: { category: { select: { id: true, name: true, slug: true } } },
    });

    if (!faq) {
      throw ApiError.notFound("FAQ not found");
    }

    return faq;
  }

  /**
   * Create a new FAQ
   */
  async createFaq(input: CreateFaqInput) {
    return db.faq.create({
      data: {
        ...input,
        categoryId: input.categoryId || null,
      },
      include: { category: { select: { id: true, name: true, slug: true } } },
    });
  }

  /**
   * Update FAQ
   */
  async updateFaq(id: string, input: UpdateFaqInput) {
    const existing = await db.faq.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound("FAQ not found");
    }

    return db.faq.update({
      where: { id },
      data: {
        ...input,
        categoryId: input.categoryId === null ? null : input.categoryId,
      },
      include: { category: { select: { id: true, name: true, slug: true } } },
    });
  }

  /**
   * Delete FAQ
   */
  async deleteFaq(id: string) {
    const existing = await db.faq.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound("FAQ not found");
    }

    await db.faq.delete({ where: { id } });
    return existing;
  }

  /**
   * Reorder FAQs
   */
  async reorderFaqs(items: ReorderItem[]) {
    await db.$transaction(
      items.map((item) =>
        db.faq.update({
          where: { id: item.id },
          data: { order: item.order },
        })
      )
    );
  }

  // ==========================================================================
  // Public Endpoints
  // ==========================================================================

  /**
   * Get active FAQs (public)
   */
  async getPublicFaqs(categorySlug?: string) {
    const where: Record<string, unknown> = { isActive: true };

    if (categorySlug) {
      const category = await db.faqCategory.findUnique({
        where: { slug: categorySlug },
      });
      if (category) {
        where.categoryId = category.id;
      }
    }

    return db.faq.findMany({
      where,
      include: { category: { select: { id: true, name: true, slug: true } } },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });
  }

  /**
   * Get active categories with their FAQs (public)
   */
  async getPublicCategories() {
    return db.faqCategory.findMany({
      where: { isActive: true },
      include: {
        faqs: {
          where: { isActive: true },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { order: "asc" },
    });
  }

  /**
   * Get all FAQs for export
   */
  async getAllForExport() {
    return db.faq.findMany({
      include: { category: { select: { name: true } } },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const faqService = new FaqService();
