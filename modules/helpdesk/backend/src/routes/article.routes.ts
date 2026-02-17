import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { getArticleService } from '../services/article.service.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

// =============================================================================
// Routes
// =============================================================================

const articleService = getArticleService();

// =============================================================================
// Article Endpoints (All Authenticated)
// =============================================================================

const routes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /articles/search
   * Search articles by query string
   * MUST be before /:id route to avoid matching "search" as an ID
   */
  fastify.get('/search', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { q } = req.query as Record<string, string>;

    const results = await articleService.search(authReq.user.userId, q);
    return reply.send({ success: true, data: results });
  });

  /**
   * GET /articles
   * List articles with filtering and pagination
   */
  fastify.get('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { search, status, categoryId, page, limit } = req.query as Record<string, string>;

    const result = await articleService.list(authReq.user.userId, {
      search,
      status,
      categoryId,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    return reply.send({ success: true, data: result });
  });

  /**
   * GET /articles/:id
   * Get article by ID
   */
  fastify.get('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    const article = await articleService.getById(id, authReq.user.userId);
    if (!article) {
      return reply.code(404).send({ error: 'Article not found' });
    }
    return reply.send({ success: true, data: article });
  });

  /**
   * POST /articles
   * Create a new article
   */
  fastify.post('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { title, slug, content, excerpt, categoryId, tags, metaTitle, metaDescription } = req.body as Record<string, unknown>;

    if (!title || !content) {
      return reply.code(400).send({ error: 'title and content are required' });
    }

    const article = await articleService.create({
      userId: authReq.user.userId,
      title,
      slug,
      content,
      excerpt,
      categoryId,
      tags,
      metaTitle,
      metaDescription,
    });

    return reply.code(201).send({ success: true, data: article });
  });

  /**
   * PATCH /articles/:id
   * Update an article
   */
  fastify.patch('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };
    const { title, slug, content, excerpt, categoryId, tags, metaTitle, metaDescription } = req.body as Record<string, unknown>;

    const article = await articleService.update(id, authReq.user.userId, {
      title,
      slug,
      content,
      excerpt,
      categoryId,
      tags,
      metaTitle,
      metaDescription,
    });

    if (!article) {
      return reply.code(404).send({ error: 'Article not found' });
    }

    return reply.send({ success: true, data: article });
  });

  /**
   * DELETE /articles/:id
   * Delete an article
   */
  fastify.delete('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    await articleService.delete(id, authReq.user.userId);
    return reply.send({ success: true, message: 'Article deleted' });
  });

  /**
   * POST /articles/:id/publish
   * Publish an article
   */
  fastify.post('/:id/publish', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    const article = await articleService.publish(id, authReq.user.userId);
    if (!article) {
      return reply.code(404).send({ error: 'Article not found' });
    }
    return reply.send({ success: true, data: article });
  });

  /**
   * POST /articles/:id/archive
   * Archive an article
   */
  fastify.post('/:id/archive', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    const article = await articleService.archive(id, authReq.user.userId);
    if (!article) {
      return reply.code(404).send({ error: 'Article not found' });
    }
    return reply.send({ success: true, data: article });
  });

  /**
   * POST /articles/:id/feedback
   * Submit feedback on an article (helpful/not helpful)
   */
  fastify.post('/:id/feedback', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };
    const { helpful, comment } = req.body as Record<string, unknown>;

    if (helpful === undefined) {
      return reply.code(400).send({ error: 'helpful is required' });
    }

    const feedback = await articleService.recordFeedback(authReq.user.userId, {
      articleId: id,
      helpful,
      comment,
    });
    return reply.send({ success: true, data: feedback });
  });
};

export default routes;
