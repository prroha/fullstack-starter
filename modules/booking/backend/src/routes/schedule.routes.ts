import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { ScheduleService } from '../services/schedule.service.js';
import { authMiddleware } from '../middleware/auth.js';
import type { PrismaClient } from '@prisma/client';

// =============================================================================
// Helper
// =============================================================================

function svc(req: FastifyRequest): ScheduleService {
  return new ScheduleService((req as FastifyRequest & { db?: PrismaClient }).db!);
}

// =============================================================================
// Schedule Endpoints (All Authenticated)
// =============================================================================

const routes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /schedules/:providerId
   * Get weekly schedule for a provider
   */
  fastify.get('/:providerId', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { providerId } = req.params as { providerId: string };
    const schedule = await svc(req).getWeeklySchedule(providerId);
    return reply.send({ success: true, data: schedule });
  });

  /**
   * PUT /schedules/:providerId
   * Update the full 7-day weekly schedule for a provider
   */
  fastify.put('/:providerId', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { providerId } = req.params as { providerId: string };
    const { schedules } = req.body as { schedules: unknown[] };

    if (!schedules || !Array.isArray(schedules)) {
      return reply.code(400).send({ error: 'schedules array is required' });
    }

    const result = await svc(req).updateWeeklySchedule(providerId, schedules);
    return reply.send({ success: true, data: result });
  });

  // =============================================================================
  // Schedule Overrides
  // =============================================================================

  /**
   * GET /schedules/:providerId/overrides
   * List schedule overrides for a date range
   */
  fastify.get('/:providerId/overrides', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { providerId } = req.params as { providerId: string };
    const { startDate, endDate } = req.query as Record<string, string>;

    const overrides = await svc(req).listOverrides(providerId, startDate, endDate);

    return reply.send({ success: true, data: overrides });
  });

  /**
   * POST /schedules/:providerId/overrides
   * Add a schedule override (e.g., day off, special hours)
   */
  fastify.post('/:providerId/overrides', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { providerId } = req.params as { providerId: string };
    const { date, isAvailable, startTime, endTime, reason } = req.body as Record<string, unknown>;

    if (!date) {
      return reply.code(400).send({ error: 'date is required' });
    }

    const override = await svc(req).createOverride(providerId, {
      date,
      isAvailable,
      startTime,
      endTime,
      reason,
    });

    return reply.code(201).send({ success: true, data: override });
  });

  /**
   * DELETE /schedules/:providerId/overrides/:id
   * Remove a schedule override
   */
  fastify.delete('/:providerId/overrides/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    await svc(req).deleteOverride(id);
    return reply.send({ success: true, message: 'Schedule override removed' });
  });
};

export default routes;
