/**
 * Content Page Service
 *
 * Business logic for CMS content page management.
 */

import { db } from "../lib/db.js";
import { ApiError } from "../middleware/error.middleware.js";
import { ErrorCodes } from "../utils/response.js";

// ============================================================================
// Types
// ============================================================================

export interface CreateContentPageInput {
  slug: string;
  title: string;
  content: string;
  metaTitle?: string | null;
  metaDesc?: string | null;
  isPublished?: boolean;
}

export interface UpdateContentPageInput {
  slug?: string;
  title?: string;
  content?: string;
  metaTitle?: string | null;
  metaDesc?: string | null;
  isPublished?: boolean;
}

export interface GetContentPagesParams {
  isPublished?: boolean;
  page?: number;
  limit?: number;
}

// ============================================================================
// Service Class
// ============================================================================

class ContentService {
  /**
   * Get paginated list of content pages (admin)
   */
  async getAll(params: GetContentPagesParams = {}) {
    const { isPublished, page = 1, limit = 20 } = params;

    const where: Record<string, unknown> = {};
    if (isPublished !== undefined) where.isPublished = isPublished;

    const skip = (page - 1) * limit;

    const [pages, total] = await Promise.all([
      db.contentPage.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      db.contentPage.count({ where }),
    ]);

    return { pages, total, page, limit };
  }

  /**
   * Get content page by ID
   */
  async getById(id: string) {
    const page = await db.contentPage.findUnique({ where: { id } });
    if (!page) {
      throw ApiError.notFound("Page not found");
    }
    return page;
  }

  /**
   * Get content page by slug (public)
   */
  async getBySlug(slug: string) {
    const page = await db.contentPage.findUnique({
      where: { slug },
      select: {
        slug: true,
        title: true,
        content: true,
        metaTitle: true,
        metaDesc: true,
        updatedAt: true,
      },
    });

    if (!page) {
      throw ApiError.notFound("Page not found");
    }

    return page;
  }

  /**
   * Create content page
   */
  async create(input: CreateContentPageInput) {
    // Check if slug already exists
    const existing = await db.contentPage.findUnique({ where: { slug: input.slug } });
    if (existing) {
      throw ApiError.conflict("Slug already exists", ErrorCodes.CONFLICT);
    }

    return db.contentPage.create({ data: input });
  }

  /**
   * Update content page
   */
  async update(id: string, input: UpdateContentPageInput) {
    const existing = await db.contentPage.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound("Page not found");
    }

    // If changing slug, check for conflicts
    if (input.slug && input.slug !== existing.slug) {
      const slugExists = await db.contentPage.findUnique({ where: { slug: input.slug } });
      if (slugExists) {
        throw ApiError.conflict("Slug already exists", ErrorCodes.CONFLICT);
      }
    }

    return db.contentPage.update({
      where: { id },
      data: input,
    });
  }

  /**
   * Delete content page
   */
  async delete(id: string) {
    const existing = await db.contentPage.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound("Page not found");
    }

    await db.contentPage.delete({ where: { id } });
    return existing;
  }

  /**
   * Get all content pages for export
   */
  async getAllForExport() {
    return db.contentPage.findMany({
      orderBy: { updatedAt: "desc" },
    });
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const contentService = new ContentService();
