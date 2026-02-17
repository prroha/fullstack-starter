import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { getProductService } from '../services/product.service.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

// =============================================================================
// Routes
// =============================================================================

const productService = getProductService();

// =============================================================================
// Public Endpoints
// =============================================================================

const routes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /products
   * List published products with filtering and pagination
   */
  fastify.get('/', async (req: FastifyRequest, reply: FastifyReply) => {
    const { search, category, minPrice, maxPrice, sort, page, limit } = req.query as Record<string, string>;

    const result = await productService.listProducts({
      status: 'ACTIVE',
      search,
      categorySlug: category,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      sort,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    return reply.send({ success: true, data: result });
  });

  /**
   * GET /products/categories
   * List all product categories
   */
  fastify.get('/categories', async (_req: FastifyRequest, reply: FastifyReply) => {
    const categories = await productService.listCategories();
    return reply.send({ success: true, data: categories });
  });

  /**
   * GET /products/:slug
   * Get product details by slug (public)
   */
  fastify.get('/:slug', async (req: FastifyRequest, reply: FastifyReply) => {
    const { slug } = req.params as { slug: string };
    const product = await productService.getProductBySlug(slug);
    if (!product) {
      return reply.code(404).send({ error: 'Product not found' });
    }
    return reply.send({ success: true, data: product });
  });

  // =============================================================================
  // Authenticated Endpoints (Seller)
  // =============================================================================

  /**
   * POST /products
   * Create a new product (seller)
   */
  fastify.post('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { title, description, shortDescription, price, compareAtPrice, sku, images, categoryIds, variants } = req.body as Record<string, unknown>;

    if (!title || !description) {
      return reply.code(400).send({ error: 'Title and description are required' });
    }

    const product = await productService.createProduct({
      title,
      description,
      shortDescription,
      price,
      compareAtPrice,
      sku,
      images,
      sellerId: authReq.user.userId,
      categoryIds,
      variants,
    });

    return reply.code(201).send({ success: true, data: product });
  });

  /**
   * PATCH /products/:id
   * Update a product (seller)
   */
  fastify.patch('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const { title, description, shortDescription, price, compareAtPrice, sku, images, categoryIds, variants } = req.body as Record<string, unknown>;

    const product = await productService.updateProduct(id, {
      title,
      description,
      shortDescription,
      price,
      compareAtPrice,
      sku,
      images,
      categoryIds,
      variants,
    });

    if (!product) {
      return reply.code(404).send({ error: 'Product not found' });
    }

    return reply.send({ success: true, data: product });
  });

  /**
   * DELETE /products/:id
   * Delete a product (seller)
   */
  fastify.delete('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    await productService.deleteProduct(id);
    return reply.send({ success: true, message: 'Product deleted' });
  });

  /**
   * POST /products/:id/publish
   * Publish a product
   */
  fastify.post('/:id/publish', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const product = await productService.publishProduct(id);
    if (!product) {
      return reply.code(404).send({ error: 'Product not found' });
    }
    return reply.send({ success: true, data: product });
  });

  /**
   * POST /products/:id/unpublish
   * Unpublish a product
   */
  fastify.post('/:id/unpublish', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const product = await productService.unpublishProduct(id);
    if (!product) {
      return reply.code(404).send({ error: 'Product not found' });
    }
    return reply.send({ success: true, data: product });
  });

  // =============================================================================
  // Categories (Admin)
  // =============================================================================

  /**
   * POST /products/categories
   * Create a new category
   */
  fastify.post('/categories', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { name, description, imageUrl } = req.body as { name: string; description?: string; imageUrl?: string };

    if (!name) {
      return reply.code(400).send({ error: 'Category name is required' });
    }

    const category = await productService.createCategory({ name, description, imageUrl });
    return reply.code(201).send({ success: true, data: category });
  });
};

export default routes;
