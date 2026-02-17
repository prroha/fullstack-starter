import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { getProjectService } from '../services/project.service.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

// =============================================================================
// Routes
// =============================================================================

const projectService = getProjectService();

// =============================================================================
// Project Endpoints (All Authenticated)
// =============================================================================

const routes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /projects
   * List all projects for the authenticated user
   */
  fastify.get('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { includeArchived } = req.query as Record<string, string>;

    const projects = await projectService.list(authReq.user.userId, includeArchived === 'true');
    return reply.send({ success: true, data: projects });
  });

  /**
   * POST /projects/reorder
   * Reorder projects
   * MUST be before /:id routes to avoid matching "reorder" as an ID
   */
  fastify.post('/reorder', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { ids } = req.body as { ids: unknown };

    if (!Array.isArray(ids)) {
      return reply.code(400).send({ error: 'ids array is required' });
    }

    await projectService.reorder(authReq.user.userId, ids);
    return reply.send({ success: true, message: 'Projects reordered' });
  });

  /**
   * GET /projects/:id
   * Get project by ID
   */
  fastify.get('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    const project = await projectService.getById(id, authReq.user.userId);
    if (!project) {
      return reply.code(404).send({ error: 'Project not found' });
    }
    return reply.send({ success: true, data: project });
  });

  /**
   * GET /projects/:id/stats
   * Get stats for a specific project
   */
  fastify.get('/:id/stats', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    const stats = await projectService.getStats(id, authReq.user.userId);
    return reply.send({ success: true, data: stats });
  });

  /**
   * POST /projects
   * Create a new project
   */
  fastify.post('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { name, description, color, icon } = req.body as Record<string, unknown>;

    if (!name) {
      return reply.code(400).send({ error: 'name is required' });
    }

    const project = await projectService.create({
      userId: authReq.user.userId,
      name,
      description,
      color,
      icon,
    });

    return reply.code(201).send({ success: true, data: project });
  });

  /**
   * PATCH /projects/:id
   * Update a project
   */
  fastify.patch('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };
    const { name, description, color, icon } = req.body as Record<string, unknown>;

    const project = await projectService.update(id, authReq.user.userId, {
      name,
      description,
      color,
      icon,
    });

    if (!project) {
      return reply.code(404).send({ error: 'Project not found' });
    }

    return reply.send({ success: true, data: project });
  });

  /**
   * DELETE /projects/:id
   * Delete a project
   */
  fastify.delete('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    await projectService.delete(id, authReq.user.userId);
    return reply.send({ success: true, message: 'Project deleted' });
  });

  /**
   * POST /projects/:id/archive
   * Archive a project
   */
  fastify.post('/:id/archive', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    const project = await projectService.archive(id, authReq.user.userId);
    if (!project) {
      return reply.code(404).send({ error: 'Project not found' });
    }
    return reply.send({ success: true, data: project });
  });

  /**
   * POST /projects/:id/unarchive
   * Unarchive a project
   */
  fastify.post('/:id/unarchive', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    const project = await projectService.unarchive(id, authReq.user.userId);
    if (!project) {
      return reply.code(404).send({ error: 'Project not found' });
    }
    return reply.send({ success: true, data: project });
  });
};

export default routes;
