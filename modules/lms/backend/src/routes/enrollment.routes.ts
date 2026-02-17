import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { getEnrollmentService } from '../services/enrollment.service.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

// =============================================================================
// Routes
// =============================================================================

const enrollmentService = getEnrollmentService();

// =============================================================================
// Enrollment Endpoints
// =============================================================================

const routes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /enrollments
   * Enroll current user in a course
   */
  fastify.post('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { courseId } = req.body as { courseId: string };

    if (!courseId) {
      return reply.code(400).send({ error: 'courseId is required' });
    }

    const enrollment = await enrollmentService.enroll({
      userId: authReq.user.userId,
      courseId,
    });

    return reply.code(201).send({ success: true, data: enrollment });
  });

  /**
   * GET /enrollments
   * Get current user's enrollments
   */
  fastify.get('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const enrollments = await enrollmentService.getUserEnrollments(authReq.user.userId);
    return reply.send({ success: true, data: enrollments });
  });

  /**
   * GET /enrollments/course/:courseId
   * Get enrollments for a specific course (instructor view)
   */
  fastify.get('/course/:courseId', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { courseId } = req.params as { courseId: string };
    const enrollments = await enrollmentService.getCourseEnrollments(courseId);
    return reply.send({ success: true, data: enrollments });
  });

  /**
   * GET /enrollments/:enrollmentId/progress
   * Get progress details for an enrollment
   */
  fastify.get('/:enrollmentId/progress', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { enrollmentId } = req.params as { enrollmentId: string };
    const progress = await enrollmentService.getProgress(enrollmentId);
    return reply.send({ success: true, data: progress });
  });

  /**
   * POST /enrollments/:enrollmentId/progress
   * Update lesson progress (time spent, position, etc.)
   */
  fastify.post('/:enrollmentId/progress', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { enrollmentId } = req.params as { enrollmentId: string };
    const { lessonId, completed, timeSpent, lastPosition } = req.body as { lessonId: string; completed?: boolean; timeSpent?: number; lastPosition?: number };

    if (!lessonId) {
      return reply.code(400).send({ error: 'lessonId is required' });
    }

    const progress = await enrollmentService.updateProgress({
      enrollmentId,
      lessonId,
      completed,
      timeSpent,
      lastPosition,
    });

    return reply.send({ success: true, data: progress });
  });

  /**
   * POST /enrollments/:enrollmentId/complete/:lessonId
   * Mark a lesson as completed
   */
  fastify.post('/:enrollmentId/complete/:lessonId', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { enrollmentId, lessonId } = req.params as { enrollmentId: string; lessonId: string };
    const progress = await enrollmentService.completeLesson(enrollmentId, lessonId);
    return reply.send({ success: true, data: progress });
  });

  /**
   * POST /enrollments/:enrollmentId/drop
   * Drop an enrollment
   */
  fastify.post('/:enrollmentId/drop', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { enrollmentId } = req.params as { enrollmentId: string };
    const enrollment = await enrollmentService.dropEnrollment(enrollmentId);
    return reply.send({ success: true, data: enrollment });
  });
};

export default routes;
