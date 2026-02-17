import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { getLessonService } from '../services/lesson.service.js';
import { authMiddleware } from '../middleware/auth.js';

// =============================================================================
// Routes
// =============================================================================

const lessonService = getLessonService();

// =============================================================================
// Section Endpoints
// =============================================================================

const routes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /lessons/sections/:courseId
   * List all sections for a course (with lessons)
   */
  fastify.get('/sections/:courseId', async (req: FastifyRequest, reply: FastifyReply) => {
    const { courseId } = req.params as { courseId: string };
    const sections = await lessonService.listSections(courseId);
    return reply.send({ success: true, data: sections });
  });

  /**
   * POST /lessons/sections
   * Create a new section
   */
  fastify.post('/sections', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { courseId, title, description } = req.body as { courseId: string; title: string; description?: string };

    if (!courseId || !title) {
      return reply.code(400).send({ error: 'courseId and title are required' });
    }

    const section = await lessonService.createSection({ courseId, title, description });
    return reply.code(201).send({ success: true, data: section });
  });

  /**
   * PATCH /lessons/sections/:id
   * Update a section
   */
  fastify.patch('/sections/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const { title, description } = req.body as { title?: string; description?: string };
    const section = await lessonService.updateSection(id, { title, description });

    if (!section) {
      return reply.code(404).send({ error: 'Section not found' });
    }

    return reply.send({ success: true, data: section });
  });

  /**
   * DELETE /lessons/sections/:id
   * Delete a section and its lessons
   */
  fastify.delete('/sections/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    await lessonService.deleteSection(id);
    return reply.send({ success: true, message: 'Section deleted' });
  });

  /**
   * PUT /lessons/sections/:courseId/reorder
   * Reorder sections within a course
   */
  fastify.put('/sections/:courseId/reorder', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { courseId } = req.params as { courseId: string };
    const { orderedIds } = req.body as { orderedIds: string[] };

    if (!Array.isArray(orderedIds)) {
      return reply.code(400).send({ error: 'orderedIds array is required' });
    }

    await lessonService.reorderSections(courseId, orderedIds);
    return reply.send({ success: true, message: 'Sections reordered' });
  });

  // =============================================================================
  // Lesson Endpoints
  // =============================================================================

  /**
   * GET /lessons/:id
   * Get a single lesson
   */
  fastify.get('/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const lesson = await lessonService.getLesson(id);
    if (!lesson) {
      return reply.code(404).send({ error: 'Lesson not found' });
    }
    return reply.send({ success: true, data: lesson });
  });

  /**
   * POST /lessons
   * Create a new lesson within a section
   */
  fastify.post('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { sectionId, title, description, type, contentUrl, contentText, duration, isFree } = req.body as Record<string, unknown>;

    if (!sectionId || !title) {
      return reply.code(400).send({ error: 'sectionId and title are required' });
    }

    const lesson = await lessonService.createLesson({
      sectionId,
      title,
      description,
      type,
      contentUrl,
      contentText,
      duration,
      isFree,
    });

    return reply.code(201).send({ success: true, data: lesson });
  });

  /**
   * PATCH /lessons/:id
   * Update a lesson
   */
  fastify.patch('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const { title, description, type, contentUrl, contentText, duration, isFree } = req.body as Record<string, unknown>;

    const lesson = await lessonService.updateLesson(id, {
      title,
      description,
      type,
      contentUrl,
      contentText,
      duration,
      isFree,
    });

    if (!lesson) {
      return reply.code(404).send({ error: 'Lesson not found' });
    }

    return reply.send({ success: true, data: lesson });
  });

  /**
   * DELETE /lessons/:id
   * Delete a lesson
   */
  fastify.delete('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    await lessonService.deleteLesson(id);
    return reply.send({ success: true, message: 'Lesson deleted' });
  });

  /**
   * PUT /lessons/reorder/:sectionId
   * Reorder lessons within a section
   */
  fastify.put('/reorder/:sectionId', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { sectionId } = req.params as { sectionId: string };
    const { orderedIds } = req.body as { orderedIds: string[] };

    if (!Array.isArray(orderedIds)) {
      return reply.code(400).send({ error: 'orderedIds array is required' });
    }

    await lessonService.reorderLessons(sectionId, orderedIds);
    return reply.send({ success: true, message: 'Lessons reordered' });
  });
};

export default routes;
