import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { getCourseService } from '../services/course.service.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

// =============================================================================
// Validation Schemas
// =============================================================================

const createCourseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(300),
  description: z.string().min(1, 'Description is required').max(10000),
  shortDescription: z.string().max(500).optional().nullable(),
  thumbnailUrl: z.string().url().optional().nullable(),
  price: z.number().int().nonnegative().optional(),
  compareAtPrice: z.number().int().nonnegative().optional().nullable(),
  level: z.string().max(50).optional().nullable(),
  language: z.string().max(10).optional(),
  maxStudents: z.number().int().positive().optional().nullable(),
  categoryIds: z.array(z.string().uuid()).optional(),
});

// =============================================================================
// Routes
// =============================================================================

const courseService = getCourseService();

// =============================================================================
// Public Endpoints
// =============================================================================

const routes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /courses
   * List published courses with filtering and pagination
   */
  fastify.get('/', async (req: FastifyRequest, reply: FastifyReply) => {
    const { search, category, level, minPrice, maxPrice, page, limit } = req.query as Record<string, string>;

    const result = await courseService.listCourses({
      status: 'PUBLISHED',
      search,
      categorySlug: category,
      level,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    return reply.send({ success: true, data: result });
  });

  /**
   * GET /courses/categories
   * List all course categories
   */
  fastify.get('/categories', async (_req: FastifyRequest, reply: FastifyReply) => {
    const categories = await courseService.listCategories();
    return reply.send({ success: true, data: categories });
  });

  /**
   * GET /courses/:slug
   * Get course details by slug (public)
   */
  fastify.get('/:slug', async (req: FastifyRequest, reply: FastifyReply) => {
    const { slug } = req.params as { slug: string };
    const course = await courseService.getCourseBySlug(slug);
    if (!course) {
      return reply.code(404).send({ error: 'Course not found' });
    }
    return reply.send({ success: true, data: course });
  });

  // =============================================================================
  // Authenticated Endpoints (Instructor)
  // =============================================================================

  /**
   * POST /courses
   * Create a new course (instructor)
   */
  fastify.post('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { title, description, shortDescription, thumbnailUrl, price, compareAtPrice, level, language, maxStudents, categoryIds } = createCourseSchema.parse(req.body);

    const course = await courseService.createCourse({
      title,
      description,
      shortDescription,
      thumbnailUrl,
      instructorId: authReq.user.userId,
      price,
      compareAtPrice,
      level,
      language,
      maxStudents,
      categoryIds,
    });

    return reply.code(201).send({ success: true, data: course });
  });

  /**
   * PATCH /courses/:id
   * Update a course (instructor)
   */
  fastify.patch('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const { title, description, shortDescription, thumbnailUrl, price, compareAtPrice, level, language, maxStudents, categoryIds } = req.body as Record<string, unknown>;

    const course = await courseService.updateCourse(id, {
      title,
      description,
      shortDescription,
      thumbnailUrl,
      price,
      compareAtPrice,
      level,
      language,
      maxStudents,
      categoryIds,
    });

    if (!course) {
      return reply.code(404).send({ error: 'Course not found' });
    }

    return reply.send({ success: true, data: course });
  });

  /**
   * DELETE /courses/:id
   * Delete a course (instructor)
   */
  fastify.delete('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    await courseService.deleteCourse(id);
    return reply.send({ success: true, message: 'Course deleted' });
  });

  /**
   * POST /courses/:id/publish
   * Publish a course
   */
  fastify.post('/:id/publish', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const course = await courseService.publishCourse(id);
    if (!course) {
      return reply.code(404).send({ error: 'Course not found' });
    }
    return reply.send({ success: true, data: course });
  });

  /**
   * POST /courses/:id/unpublish
   * Unpublish a course
   */
  fastify.post('/:id/unpublish', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const course = await courseService.unpublishCourse(id);
    if (!course) {
      return reply.code(404).send({ error: 'Course not found' });
    }
    return reply.send({ success: true, data: course });
  });

  // =============================================================================
  // Categories (Admin)
  // =============================================================================

  /**
   * POST /courses/categories
   * Create a new category
   */
  fastify.post('/categories', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { name, description, iconName } = req.body as { name: string; description?: string; iconName?: string };

    if (!name) {
      return reply.code(400).send({ error: 'Category name is required' });
    }

    const category = await courseService.createCategory({ name, description, iconName });
    return reply.code(201).send({ success: true, data: category });
  });

  // =============================================================================
  // Reviews
  // =============================================================================

  // Review endpoints would go here - listing reviews for a course,
  // creating a review (authenticated), etc.
  // For brevity, these can be added as needed.
};

export default routes;
