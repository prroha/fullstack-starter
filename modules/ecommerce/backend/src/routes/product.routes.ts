import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { ProductService } from '../services/product.service.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import type { PrismaClient } from '@prisma/client';

function svc(req: FastifyRequest): ProductService {
  return new ProductService((req as FastifyRequest & { db?: PrismaClient }).db!);
}

// =============================================================================
// Routes
// =============================================================================

const routes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /products
   */
  fastify.get('/', async (req: FastifyRequest, reply: FastifyReply) => {
    const { search, category, minPrice, maxPrice, sort, page, limit } = req.query as Record<string, string>;

    const result = await svc(req).listProducts({
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
   */
  fastify.get('/categories', async (req: FastifyRequest, reply: FastifyReply) => {
    const categories = await svc(req).listCategories();
    return reply.send({ success: true, data: categories });
  });

  /**
   * GET /products/:slug
   */
  fastify.get('/:slug', async (req: FastifyRequest, reply: FastifyReply) => {
    const { slug } = req.params as { slug: string };
    const product = await svc(req).getProductBySlug(slug);
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
   */
  fastify.post('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { title, description, shortDescription, price, compareAtPrice, sku, images, categoryIds } = req.body as Record<string, unknown>;

    if (!title || !description) {
      return reply.code(400).send({ error: 'Title and description are required' });
    }

    const product = await svc(req).createProduct({
      title: title as string,
      description: description as string,
      shortDescription: shortDescription as string | undefined,
      price: price as number | undefined,
      compareAtPrice: compareAtPrice as number | undefined,
      sku: sku as string | undefined,
      images: images as string[] | undefined,
      sellerId: authReq.user.userId,
      categoryIds: categoryIds as string[] | undefined,
    });

    return reply.code(201).send({ success: true, data: product });
  });

  /**
   * PATCH /products/:id
   */
  fastify.patch('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const { title, description, shortDescription, price, compareAtPrice, sku, images, categoryIds } = req.body as Record<string, unknown>;

    const product = await svc(req).updateProduct(id, {
      title: title as string | undefined,
      description: description as string | undefined,
      shortDescription: shortDescription as string | undefined,
      price: price as number | undefined,
      compareAtPrice: compareAtPrice as number | undefined,
      sku: sku as string | undefined,
      images: images as string[] | undefined,
      categoryIds: categoryIds as string[] | undefined,
    });

    if (!product) {
      return reply.code(404).send({ error: 'Product not found' });
    }

    return reply.send({ success: true, data: product });
  });

  /**
   * DELETE /products/:id
   */
  fastify.delete('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    await svc(req).deleteProduct(id);
    return reply.send({ success: true, message: 'Product deleted' });
  });

  /**
   * POST /products/:id/publish
   */
  fastify.post('/:id/publish', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const product = await svc(req).publishProduct(id);
    if (!product) {
      return reply.code(404).send({ error: 'Product not found' });
    }
    return reply.send({ success: true, data: product });
  });

  /**
   * POST /products/:id/unpublish
   */
  fastify.post('/:id/unpublish', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const product = await svc(req).unpublishProduct(id);
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
   */
  fastify.post('/categories', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { name, description, imageUrl } = req.body as { name: string; description?: string; imageUrl?: string };

    if (!name) {
      return reply.code(400).send({ error: 'Category name is required' });
    }

    const category = await svc(req).createCategory({ name, description, imageUrl });
    return reply.code(201).send({ success: true, data: category });
  });
};

export default routes;
