// =============================================================================
// Knowledge Base Article Service
// =============================================================================
// Business logic for knowledge base articles: CRUD, publishing workflow,
// search, slug-based lookup, and customer feedback tracking.
// Uses placeholder db operations - replace with actual Prisma client.

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

interface ArticleRecord {
  id: string;
  userId: string;
  categoryId: string | null;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  status: ArticleStatus;
  tags: string[];
  metaTitle: string | null;
  metaDescription: string | null;
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  publishedAt: Date | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface FeedbackRecord {
  id: string;
  articleId: string;
  helpful: boolean;
  comment: string | null;
  createdAt: Date;
}

// =============================================================================
// Database Operations (Placeholder)
// =============================================================================
// Replace with actual Prisma client:
// import { db } from '../../../../core/backend/src/lib/db';

const dbOperations = {
  async createArticle(data: {
    userId: string;
    categoryId: string | null;
    title: string;
    slug: string;
    content: string;
    excerpt: string | null;
    status: ArticleStatus;
    tags: string[];
    metaTitle: string | null;
    metaDescription: string | null;
  }): Promise<ArticleRecord> {
    // Replace with: return db.helpdeskArticle.create({ data, include: { category: true } });
    console.log('[DB] Creating article:', data.title, 'slug:', data.slug);
    return {
      id: 'article_' + Date.now(),
      ...data,
      viewCount: 0,
      helpfulCount: 0,
      notHelpfulCount: 0,
      publishedAt: null,
      archivedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  async updateArticle(id: string, data: Partial<ArticleRecord>): Promise<ArticleRecord | null> {
    // Replace with: return db.helpdeskArticle.update({ where: { id }, data: { ...data, updatedAt: new Date() }, include: { category: true } });
    console.log('[DB] Updating article:', id);
    return null;
  },

  async deleteArticle(id: string): Promise<void> {
    // Replace with: await db.helpdeskArticle.delete({ where: { id } });
    console.log('[DB] Deleting article:', id);
  },

  async findArticleById(id: string): Promise<ArticleRecord | null> {
    // Replace with: return db.helpdeskArticle.findUnique({ where: { id }, include: { category: true } });
    console.log('[DB] Finding article by ID:', id);
    return null;
  },

  async findArticleBySlug(userId: string, slug: string): Promise<ArticleRecord | null> {
    // Replace with: return db.helpdeskArticle.findFirst({ where: { userId, slug }, include: { category: true } });
    console.log('[DB] Finding article by slug:', slug, 'for user:', userId);
    return null;
  },

  async findArticles(userId: string, filters: ArticleFilters): Promise<{ items: ArticleRecord[]; total: number }> {
    // Replace with:
    // const where = {
    //   userId,
    //   status: filters.status || undefined,
    //   categoryId: filters.categoryId || undefined,
    //   tags: filters.tag ? { has: filters.tag } : undefined,
    //   OR: filters.search ? [
    //     { title: { contains: filters.search, mode: 'insensitive' } },
    //     { content: { contains: filters.search, mode: 'insensitive' } },
    //     { excerpt: { contains: filters.search, mode: 'insensitive' } },
    //   ] : undefined,
    // };
    // const [items, total] = await Promise.all([
    //   db.helpdeskArticle.findMany({ where, skip: ((filters.page || 1) - 1) * (filters.limit || 20), take: filters.limit || 20, include: { category: true }, orderBy: { updatedAt: 'desc' } }),
    //   db.helpdeskArticle.count({ where }),
    // ]);
    console.log('[DB] Finding articles for user:', userId, filters);
    return { items: [], total: 0 };
  },

  async searchPublishedArticles(userId: string, query: string, limit: number): Promise<ArticleRecord[]> {
    // Replace with:
    // return db.helpdeskArticle.findMany({
    //   where: {
    //     userId,
    //     status: 'PUBLISHED',
    //     OR: [
    //       { title: { contains: query, mode: 'insensitive' } },
    //       { content: { contains: query, mode: 'insensitive' } },
    //       { tags: { hasSome: [query] } },
    //     ],
    //   },
    //   take: limit,
    //   orderBy: [{ viewCount: 'desc' }, { helpfulCount: 'desc' }],
    //   include: { category: true },
    // });
    console.log('[DB] Searching published articles for user:', userId, 'query:', query);
    return [];
  },

  async incrementViewCount(id: string): Promise<void> {
    // Replace with: await db.helpdeskArticle.update({ where: { id }, data: { viewCount: { increment: 1 } } });
    console.log('[DB] Incrementing view count for article:', id);
  },

  async createFeedback(data: {
    articleId: string;
    helpful: boolean;
    comment: string | null;
  }): Promise<FeedbackRecord> {
    // Replace with: return db.helpdeskArticleFeedback.create({ data });
    console.log('[DB] Creating feedback for article:', data.articleId, 'helpful:', data.helpful);
    return {
      id: 'feedback_' + Date.now(),
      ...data,
      createdAt: new Date(),
    };
  },

  async incrementHelpfulCount(articleId: string): Promise<void> {
    // Replace with: await db.helpdeskArticle.update({ where: { id: articleId }, data: { helpfulCount: { increment: 1 } } });
    console.log('[DB] Incrementing helpful count for article:', articleId);
  },

  async incrementNotHelpfulCount(articleId: string): Promise<void> {
    // Replace with: await db.helpdeskArticle.update({ where: { id: articleId }, data: { notHelpfulCount: { increment: 1 } } });
    console.log('[DB] Incrementing not-helpful count for article:', articleId);
  },

  async checkSlugExists(userId: string, slug: string, excludeId?: string): Promise<boolean> {
    // Replace with:
    // const where: any = { userId, slug };
    // if (excludeId) where.id = { not: excludeId };
    // return !!(await db.helpdeskArticle.findFirst({ where }));
    console.log('[DB] Checking if slug exists:', slug);
    return false;
  },

  async checkArticleBelongsToUser(articleId: string, userId: string): Promise<boolean> {
    // Replace with: return !!(await db.helpdeskArticle.findFirst({ where: { id: articleId, userId } }));
    console.log('[DB] Checking article ownership:', articleId, userId);
    return false;
  },
};

// =============================================================================
// Article Service
// =============================================================================

export class ArticleService {
  /**
   * Generate a URL-friendly slug from a title.
   * Appends a numeric suffix if the slug already exists.
   */
  private async generateSlug(userId: string, title: string, excludeId?: string): Promise<string> {
    let slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const exists = await dbOperations.checkSlugExists(userId, slug, excludeId);
    if (exists) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    return slug;
  }

  /**
   * Create a new knowledge base article. Starts as DRAFT.
   * Automatically generates a slug if not provided.
   */
  async create(input: ArticleCreateInput): Promise<ArticleRecord> {
    const slug = input.slug || await this.generateSlug(input.userId, input.title);

    // Validate slug uniqueness if explicitly provided
    if (input.slug) {
      const slugExists = await dbOperations.checkSlugExists(input.userId, input.slug);
      if (slugExists) {
        throw new Error('An article with this slug already exists');
      }
    }

    return dbOperations.createArticle({
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
    });
  }

  /**
   * Update an existing article. Validates ownership and slug uniqueness.
   */
  async update(id: string, userId: string, input: ArticleUpdateInput): Promise<ArticleRecord | null> {
    const belongs = await dbOperations.checkArticleBelongsToUser(id, userId);
    if (!belongs) {
      throw new Error('Article not found');
    }

    // Validate slug uniqueness if being changed
    if (input.slug) {
      const slugExists = await dbOperations.checkSlugExists(userId, input.slug, id);
      if (slugExists) {
        throw new Error('An article with this slug already exists');
      }
    }

    // Auto-generate slug if title changed and no explicit slug provided
    if (input.title && !input.slug) {
      input.slug = await this.generateSlug(userId, input.title, id);
    }

    return dbOperations.updateArticle(id, input as Partial<ArticleRecord>);
  }

  /**
   * Delete an article. Validates ownership.
   */
  async delete(id: string, userId: string): Promise<void> {
    const belongs = await dbOperations.checkArticleBelongsToUser(id, userId);
    if (!belongs) {
      throw new Error('Article not found');
    }

    return dbOperations.deleteArticle(id);
  }

  /**
   * Get a single article by ID with ownership check.
   * Increments view count for published articles.
   */
  async getById(id: string, userId: string): Promise<ArticleRecord | null> {
    const belongs = await dbOperations.checkArticleBelongsToUser(id, userId);
    if (!belongs) {
      return null;
    }

    const article = await dbOperations.findArticleById(id);

    if (article && article.status === 'PUBLISHED') {
      await dbOperations.incrementViewCount(id);
    }

    return article;
  }

  /**
   * Get a published article by its URL slug. Increments view count.
   */
  async getBySlug(userId: string, slug: string): Promise<ArticleRecord | null> {
    const article = await dbOperations.findArticleBySlug(userId, slug);

    if (article && article.status === 'PUBLISHED') {
      await dbOperations.incrementViewCount(article.id);
    }

    return article;
  }

  /**
   * List articles with filtering, search, and pagination
   */
  async list(userId: string, filters: ArticleFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const result = await dbOperations.findArticles(userId, {
      ...filters,
      page,
      limit,
    });

    return {
      items: result.items,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    };
  }

  /**
   * Publish a draft article. Sets publishedAt timestamp and changes status to PUBLISHED.
   */
  async publish(id: string, userId: string): Promise<ArticleRecord | null> {
    const belongs = await dbOperations.checkArticleBelongsToUser(id, userId);
    if (!belongs) {
      throw new Error('Article not found');
    }

    const article = await dbOperations.findArticleById(id);
    if (!article) {
      throw new Error('Article not found');
    }

    if (article.status === 'PUBLISHED') {
      throw new Error('Article is already published');
    }

    return dbOperations.updateArticle(id, {
      status: 'PUBLISHED',
      publishedAt: new Date(),
      archivedAt: null,
    } as Partial<ArticleRecord>);
  }

  /**
   * Archive a published article. Sets archivedAt timestamp and hides from public view.
   */
  async archive(id: string, userId: string): Promise<ArticleRecord | null> {
    const belongs = await dbOperations.checkArticleBelongsToUser(id, userId);
    if (!belongs) {
      throw new Error('Article not found');
    }

    const article = await dbOperations.findArticleById(id);
    if (!article) {
      throw new Error('Article not found');
    }

    if (article.status === 'ARCHIVED') {
      throw new Error('Article is already archived');
    }

    return dbOperations.updateArticle(id, {
      status: 'ARCHIVED',
      archivedAt: new Date(),
    } as Partial<ArticleRecord>);
  }

  /**
   * Record reader feedback (helpful / not helpful) for an article.
   * Updates the article's aggregate feedback counts.
   */
  async recordFeedback(userId: string, input: ArticleFeedbackInput): Promise<FeedbackRecord> {
    const belongs = await dbOperations.checkArticleBelongsToUser(input.articleId, userId);
    if (!belongs) {
      throw new Error('Article not found');
    }

    const feedback = await dbOperations.createFeedback({
      articleId: input.articleId,
      helpful: input.helpful,
      comment: input.comment || null,
    });

    if (input.helpful) {
      await dbOperations.incrementHelpfulCount(input.articleId);
    } else {
      await dbOperations.incrementNotHelpfulCount(input.articleId);
    }

    return feedback;
  }

  /**
   * Search published articles by keyword. Returns results ranked by popularity.
   * Used for the customer-facing knowledge base search.
   */
  async search(userId: string, query: string, limit: number = 10): Promise<ArticleRecord[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    return dbOperations.searchPublishedArticles(userId, query.trim(), limit);
  }
}

// =============================================================================
// Factory
// =============================================================================

let articleServiceInstance: ArticleService | null = null;

export function getArticleService(): ArticleService {
  if (!articleServiceInstance) {
    articleServiceInstance = new ArticleService();
  }
  return articleServiceInstance;
}

export default ArticleService;
