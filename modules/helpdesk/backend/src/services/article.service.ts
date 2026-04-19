// =============================================================================
// Knowledge Base Article Service
// =============================================================================
// Business logic for knowledge base articles: CRUD, publishing workflow,
// search, slug-based lookup, and customer feedback tracking.
// Uses dependency-injected PrismaClient for all database operations.

import type { PrismaClient } from '@prisma/client';

// =============================================================================
// Types
// =============================================================================

export type ArticleStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface ArticleCreateInput {
  userId: string;
  categoryId?: string;
  title: string;
  slug?: string;
  content: string;
  excerpt?: string;
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
}

export interface ArticleUpdateInput {
  categoryId?: string;
  title?: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
}

export interface ArticleFilters {
  status?: string;
  categoryId?: string;
  search?: string;
  tag?: string;
  page?: number;
  limit?: number;
}

export interface ArticleFeedbackInput {
  articleId: string;
  helpful: boolean;
  comment?: string;
}

// =============================================================================
// Article Service
// =============================================================================

export class ArticleService {
  constructor(private db: PrismaClient) {}

  /**
   * Generate a URL-friendly slug from a title.
   * Appends a numeric suffix if the slug already exists.
   */
  private async generateSlug(userId: string, title: string, excludeId?: string): Promise<string> {
    let slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const whereClause: Record<string, unknown> = { userId, slug };
    if (excludeId) whereClause.id = { not: excludeId };

    const exists = await this.db.knowledgeBaseArticle.findFirst({ where: whereClause as never });
    if (exists) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    return slug;
  }

  /**
   * Create a new knowledge base article. Starts as DRAFT.
   * Automatically generates a slug if not provided.
   */
  async create(input: ArticleCreateInput) {
    const slug = input.slug || await this.generateSlug(input.userId, input.title);

    // Validate slug uniqueness if explicitly provided
    if (input.slug) {
      const slugExists = await this.db.knowledgeBaseArticle.findFirst({
        where: { userId: input.userId, slug: input.slug },
      });
      if (slugExists) {
        throw new Error('An article with this slug already exists');
      }
    }

    return this.db.knowledgeBaseArticle.create({
      data: {
        userId: input.userId,
        categoryId: input.categoryId || null,
        title: input.title,
        slug,
        content: input.content,
        excerpt: input.excerpt || null,
        status: 'DRAFT',
        tags: input.tags || [],
        metaTitle: input.metaTitle || null,
        metaDescription: input.metaDescription || null,
      },
      include: { category: true },
    });
  }

  /**
   * Update an existing article. Validates ownership and slug uniqueness.
   */
  async update(id: string, userId: string, input: ArticleUpdateInput) {
    const belongs = await this.db.knowledgeBaseArticle.findFirst({ where: { id, userId } });
    if (!belongs) {
      throw new Error('Article not found');
    }

    // Validate slug uniqueness if being changed
    if (input.slug) {
      const slugExists = await this.db.knowledgeBaseArticle.findFirst({
        where: { userId, slug: input.slug, id: { not: id } },
      });
      if (slugExists) {
        throw new Error('An article with this slug already exists');
      }
    }

    // Auto-generate slug if title changed and no explicit slug provided
    if (input.title && !input.slug) {
      input.slug = await this.generateSlug(userId, input.title, id);
    }

    return this.db.knowledgeBaseArticle.update({
      where: { id },
      data: {
        ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
        ...(input.title !== undefined && { title: input.title }),
        ...(input.slug !== undefined && { slug: input.slug }),
        ...(input.content !== undefined && { content: input.content }),
        ...(input.excerpt !== undefined && { excerpt: input.excerpt }),
        ...(input.tags !== undefined && { tags: input.tags }),
        ...(input.metaTitle !== undefined && { metaTitle: input.metaTitle }),
        ...(input.metaDescription !== undefined && { metaDescription: input.metaDescription }),
      },
      include: { category: true },
    });
  }

  /**
   * Delete an article. Validates ownership.
   */
  async delete(id: string, userId: string): Promise<void> {
    const belongs = await this.db.knowledgeBaseArticle.findFirst({ where: { id, userId } });
    if (!belongs) {
      throw new Error('Article not found');
    }

    await this.db.knowledgeBaseArticle.delete({ where: { id } });
  }

  /**
   * Get a single article by ID with ownership check.
   * Increments view count for published articles.
   */
  async getById(id: string, userId: string) {
    const article = await this.db.knowledgeBaseArticle.findFirst({
      where: { id, userId },
      include: { category: true },
    });

    if (article && article.status === 'PUBLISHED') {
      await this.db.knowledgeBaseArticle.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      });
    }

    return article;
  }

  /**
   * Get a published article by its URL slug. Increments view count.
   */
  async getBySlug(userId: string, slug: string) {
    const article = await this.db.knowledgeBaseArticle.findFirst({
      where: { userId, slug },
      include: { category: true },
    });

    if (article && article.status === 'PUBLISHED') {
      await this.db.knowledgeBaseArticle.update({
        where: { id: article.id },
        data: { viewCount: { increment: 1 } },
      });
    }

    return article;
  }

  /**
   * List articles with filtering, search, and pagination
   */
  async list(userId: string, filters: ArticleFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const where: Record<string, unknown> = { userId };

    if (filters.status) where.status = filters.status;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.tag) where.tags = { has: filters.tag };

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { content: { contains: filters.search, mode: 'insensitive' } },
        { excerpt: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.db.knowledgeBaseArticle.findMany({
        where: where as never,
        skip: (page - 1) * limit,
        take: limit,
        include: { category: true },
        orderBy: { updatedAt: 'desc' },
      }),
      this.db.knowledgeBaseArticle.count({ where: where as never }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Publish a draft article. Sets publishedAt timestamp and changes status to PUBLISHED.
   */
  async publish(id: string, userId: string) {
    const article = await this.db.knowledgeBaseArticle.findFirst({ where: { id, userId } });
    if (!article) {
      throw new Error('Article not found');
    }

    if (article.status === 'PUBLISHED') {
      throw new Error('Article is already published');
    }

    return this.db.knowledgeBaseArticle.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        archivedAt: null,
      },
      include: { category: true },
    });
  }

  /**
   * Archive a published article. Sets archivedAt timestamp and hides from public view.
   */
  async archive(id: string, userId: string) {
    const article = await this.db.knowledgeBaseArticle.findFirst({ where: { id, userId } });
    if (!article) {
      throw new Error('Article not found');
    }

    if (article.status === 'ARCHIVED') {
      throw new Error('Article is already archived');
    }

    return this.db.knowledgeBaseArticle.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
        archivedAt: new Date(),
      },
      include: { category: true },
    });
  }

  /**
   * Record reader feedback (helpful / not helpful) for an article.
   * Updates the article's aggregate feedback counts.
   */
  async recordFeedback(userId: string, input: ArticleFeedbackInput) {
    const belongs = await this.db.knowledgeBaseArticle.findFirst({
      where: { id: input.articleId, userId },
    });
    if (!belongs) {
      throw new Error('Article not found');
    }

    // Update the article's aggregate counts
    if (input.helpful) {
      await this.db.knowledgeBaseArticle.update({
        where: { id: input.articleId },
        data: { helpfulCount: { increment: 1 } },
      });
    } else {
      await this.db.knowledgeBaseArticle.update({
        where: { id: input.articleId },
        data: { notHelpfulCount: { increment: 1 } },
      });
    }

    return {
      id: `feedback_${Date.now()}`,
      articleId: input.articleId,
      helpful: input.helpful,
      comment: input.comment || null,
      createdAt: new Date(),
    };
  }

  /**
   * Search published articles by keyword. Returns results ranked by popularity.
   * Used for the customer-facing knowledge base search.
   */
  async search(userId: string, query: string, limit: number = 10) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    return this.db.knowledgeBaseArticle.findMany({
      where: {
        userId,
        status: 'PUBLISHED',
        OR: [
          { title: { contains: query.trim(), mode: 'insensitive' } },
          { content: { contains: query.trim(), mode: 'insensitive' } },
          { tags: { hasSome: [query.trim()] } },
        ],
      } as never,
      take: limit,
      orderBy: [{ viewCount: 'desc' }, { helpfulCount: 'desc' }],
      include: { category: true },
    });
  }
}

// =============================================================================
// Factory
// =============================================================================

export function createArticleService(db: PrismaClient): ArticleService {
  return new ArticleService(db);
}

let instance: ArticleService | null = null;

export function getArticleService(db?: PrismaClient): ArticleService {
  if (db) return createArticleService(db);
  if (!instance) {
    const { db: globalDb } = require('../../../../core/backend/src/lib/db.js');
    instance = new ArticleService(globalDb);
  }
  return instance;
}

export default ArticleService;
