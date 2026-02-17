import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { getServiceService } from '../services/service.service.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

// =============================================================================
// Routes
// =============================================================================

const serviceService = getServiceService();

// =============================================================================
// Public Endpoints
// =============================================================================

const routes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /services
   * List services with filtering and pagination
   */
  fastify.get('/', async (req: FastifyRequest, reply: FastifyReply) => {
    const { search, category, minPrice, maxPrice, minDuration, maxDuration, page, limit } = req.query as Record<string, string>;

    const result = await serviceService.listServices({
      search,
      categorySlug: category,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      minDuration: minDuration ? Number(minDuration) : undefined,
      maxDuration: maxDuration ? Number(maxDuration) : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    return reply.send({ success: true, data: result });
  });

  /**
   * GET /services/categories
   * List all service categories
   */
  fastify.get('/categories', async (_req: FastifyRequest, reply: FastifyReply) => {
    const categories = await serviceService.listCategories();
    return reply.send({ success: true, data: categories });
  });

  /**
   * GET /services/:slug
   * Get service details by slug (public) with providers and avgRating
   */
  fastify.get('/:slug', async (req: FastifyRequest, reply: FastifyReply) => {
    const { slug } = req.params as { slug: string };
    const service = await serviceService.getServiceBySlug(slug);
    if (!service) {
      return reply.code(404).send({ error: 'Service not found' });
    }
    return reply.send({ success: true, data: service });
  });

  // =============================================================================
  // Authenticated Endpoints (Admin)
  // =============================================================================

  /**
   * POST /services
   * Create a new service (admin)
   */
  fastify.post('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { name, description, shortDescription, thumbnailUrl, price, duration, categoryIds } = req.body as Record<string, unknown>;

    if (!name || !description || !duration) {
      return reply.code(400).send({ error: 'Name, description, and duration are required' });
    }

    const service = await serviceService.createService({
      name,
      description,
      shortDescription,
      thumbnailUrl,
      price,
      duration,
      categoryIds,
      createdById: authReq.user.userId,
    });

    return reply.code(201).send({ success: true, data: service });
  });

  /**
   * PATCH /services/:id
   * Update a service
   */
  fastify.patch('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const { name, description, shortDescription, thumbnailUrl, price, duration, categoryIds } = req.body as Record<string, unknown>;

    const service = await serviceService.updateService(id, {
      name,
      description,
      shortDescription,
      thumbnailUrl,
      price,
      duration,
      categoryIds,
    });

    if (!service) {
      return reply.code(404).send({ error: 'Service not found' });
    }

    return reply.send({ success: true, data: service });
  });

  /**
   * DELETE /services/:id
   * Delete a service
   */
  fastify.delete('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    await serviceService.deleteService(id);
    return reply.send({ success: true, message: 'Service deleted' });
  });

  /**
   * POST /services/:id/publish
   * Publish a service
   */
  fastify.post('/:id/publish', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const service = await serviceService.publishService(id);
    if (!service) {
      return reply.code(404).send({ error: 'Service not found' });
    }
    return reply.send({ success: true, data: service });
  });

  /**
   * POST /services/:id/unpublish
   * Unpublish a service
   */
  fastify.post('/:id/unpublish', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const service = await serviceService.unpublishService(id);
    if (!service) {
      return reply.code(404).send({ error: 'Service not found' });
    }
    return reply.send({ success: true, data: service });
  });

  // =============================================================================
  // Categories (Admin)
  // =============================================================================

  /**
   * POST /services/categories
   * Create a new service category
   */
  fastify.post('/categories', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { name, description, iconName } = req.body as { name: string; description?: string; iconName?: string };

    if (!name) {
      return reply.code(400).send({ error: 'Category name is required' });
    }

    const category = await serviceService.createCategory({ name, description, iconName });
    return reply.code(201).send({ success: true, data: category });
  });
};

export default routes;
