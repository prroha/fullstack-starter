import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { InstructorService } from '../services/instructor.service.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import type { PrismaClient } from '@prisma/client';

// =============================================================================
// Helper
// =============================================================================

function svc(req: FastifyRequest): InstructorService {
  return new InstructorService((req as FastifyRequest & { db?: PrismaClient }).db!);
}

// =============================================================================
// Routes
// =============================================================================

const routes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /instructor/stats
   * Get instructor dashboard statistics
   */
  fastify.get('/stats', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const stats = await svc(req).getDashboardStats(authReq.user.userId);
    return reply.send({ success: true, data: stats });
  });

  /**
   * GET /instructor/courses/analytics
   * Get per-course analytics
   */
  fastify.get('/courses/analytics', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const analytics = await svc(req).getCourseAnalytics(authReq.user.userId);
    return reply.send({ success: true, data: analytics });
  });

  /**
   * GET /instructor/earnings
   * Get earnings breakdown
   */
  fastify.get('/earnings', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { period, startDate, endDate } = req.query as Record<string, string>;

    const earnings = await svc(req).getEarnings(
      authReq.user.userId,
      (period as 'daily' | 'weekly' | 'monthly') || 'monthly',
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );

    return reply.send({ success: true, data: earnings });
  });

  /**
   * GET /instructor/enrollments/recent
   * Get recent enrollments across all courses
   */
  fastify.get('/enrollments/recent', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { limit } = req.query as Record<string, string>;

    const enrollments = await svc(req).getRecentEnrollments(authReq.user.userId, limit ? Number(limit) : 10);
    return reply.send({ success: true, data: enrollments });
  });

  /**
   * GET /instructor/reviews/recent
   * Get recent reviews across all courses
   */
  fastify.get('/reviews/recent', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { limit } = req.query as Record<string, string>;

    const reviews = await svc(req).getRecentReviews(authReq.user.userId, limit ? Number(limit) : 10);
    return reply.send({ success: true, data: reviews });
  });
};

export default routes;
