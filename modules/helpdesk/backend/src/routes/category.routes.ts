import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { getCategoryService } from '../services/category.service.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

// =============================================================================
// Routes
// =============================================================================

const categoryService = getCategoryService();

// =============================================================================
// Category Endpoints (All Authenticated)
// =============================================================================

const routes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /categories/reorder
   * Reorder categories by providing an ordered array of IDs
   * MUST be before /:id route to avoid matching "reorder" as an ID
   */
  fastify.post('/reorder', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { ids } = req.body as { ids: string[] };

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return reply.code(400).send({ error: 'ids must be a non-empty array' });
    }

    const updates = ids.map((id: string, index: number) => ({ id, sortOrder: index + 1 }));
    await categoryService.reorder(authReq.user.userId, updates);
    return reply.send({ success: true, message: 'Categories reordered' });
  });

  /**
   * GET /categories
   * List all categories
   */
  fastify.get('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { search, isActive, parentId, page, limit } = req.query as Record<string, string>;

    const categories = await categoryService.list(authReq.user.userId, {
      search,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      parentId,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
    });
    return reply.send({ success: true, data: categories });
  });

  /**
   * GET /categories/:id
   * Get category by ID
   */
  fastify.get('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    const category = await categoryService.getById(id, authReq.user.userId);
    if (!category) {
      return reply.code(404).send({ error: 'Category not found' });
    }
    return reply.send({ success: true, data: category });
  });

  /**
   * POST /categories
   * Create a new category
   */
  fastify.post('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { name, description, color, parentId } = req.body as Record<string, unknown>;

    if (!name) {
      return reply.code(400).send({ error: 'name is required' });
    }

    const category = await categoryService.create({
      userId: authReq.user.userId,
      name,
      description,
      color,
      parentId,
    });

    return reply.code(201).send({ success: true, data: category });
  });

  /**
   * PATCH /categories/:id
   * Update a category
   */
  fastify.patch('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };
    const { name, description, color, parentId } = req.body as Record<string, unknown>;

    const category = await categoryService.update(id, authReq.user.userId, {
      name,
      description,
      color,
      parentId,
    });

    if (!category) {
      return reply.code(404).send({ error: 'Category not found' });
    }

    return reply.send({ success: true, data: category });
  });

  /**
   * DELETE /categories/:id
   * Delete a category
   */
  fastify.delete('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    await categoryService.delete(id, authReq.user.userId);
    return reply.send({ success: true, message: 'Category deleted' });
  });

  /**
   * POST /categories/:id/toggle-active
   * Toggle category active status
   */
  fastify.post('/:id/toggle-active', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    const category = await categoryService.toggleActive(id, authReq.user.userId);
    if (!category) {
      return reply.code(404).send({ error: 'Category not found' });
    }
    return reply.send({ success: true, data: category });
  });
};

export default routes;
