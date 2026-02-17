import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { getTaskService } from '../services/task.service.js';
import { getCommentService } from '../services/comment.service.js';
import { getLabelService } from '../services/label.service.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

// =============================================================================
// Routes
// =============================================================================

const taskService = getTaskService();
const commentService = getCommentService();
const labelService = getLabelService();

// =============================================================================
// Task Endpoints (All Authenticated)
// =============================================================================

const routes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /tasks/stats
   * Get dashboard stats
   * MUST be before /:id route to avoid matching "stats" as an ID
   */
  fastify.get('/stats', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;

    const stats = await taskService.getDashboardStats(authReq.user.userId);
    return reply.send({ success: true, data: stats });
  });

  /**
   * POST /tasks/reorder
   * Reorder tasks
   * MUST be before /:id routes to avoid matching "reorder" as an ID
   */
  fastify.post('/reorder', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { ids } = req.body as { ids: unknown };

    if (!Array.isArray(ids)) {
      return reply.code(400).send({ error: 'ids array is required' });
    }

    await taskService.reorder(authReq.user.userId, ids);
    return reply.send({ success: true, message: 'Tasks reordered' });
  });

  /**
   * GET /tasks
   * List tasks with filtering and pagination
   */
  fastify.get('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { search, status, priority, projectId, assigneeId, labelId, dueBefore, dueAfter, showCompleted, page, limit } = req.query as Record<string, string>;

    const result = await taskService.list(authReq.user.userId, {
      search,
      status,
      priority,
      projectId,
      assigneeId,
      labelId,
      dueBefore,
      dueAfter,
      showCompleted: showCompleted === 'true',
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    return reply.send({ success: true, data: result });
  });

  /**
   * GET /tasks/:id
   * Get task by ID (includes project, comments, labels)
   */
  fastify.get('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    const task = await taskService.getById(id, authReq.user.userId);
    if (!task) {
      return reply.code(404).send({ error: 'Task not found' });
    }
    return reply.send({ success: true, data: task });
  });

  /**
   * POST /tasks
   * Create a new task
   */
  fastify.post('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { title, description, projectId, assigneeId, status, priority, dueDate } = req.body as Record<string, unknown>;

    if (!title) {
      return reply.code(400).send({ error: 'title is required' });
    }

    const task = await taskService.create({
      userId: authReq.user.userId,
      title,
      description,
      projectId,
      assigneeId,
      status,
      priority,
      dueDate,
    });

    return reply.code(201).send({ success: true, data: task });
  });

  /**
   * PATCH /tasks/:id
   * Update a task
   */
  fastify.patch('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };
    const { title, description, projectId, assigneeId, status, priority, dueDate } = req.body as Record<string, unknown>;

    const task = await taskService.update(id, authReq.user.userId, {
      title,
      description,
      projectId,
      assigneeId,
      status,
      priority,
      dueDate,
    });

    if (!task) {
      return reply.code(404).send({ error: 'Task not found' });
    }

    return reply.send({ success: true, data: task });
  });

  /**
   * DELETE /tasks/:id
   * Delete a task
   */
  fastify.delete('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    await taskService.delete(id, authReq.user.userId);
    return reply.send({ success: true, message: 'Task deleted' });
  });

  /**
   * POST /tasks/:id/status
   * Update task status
   */
  fastify.post('/:id/status', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };
    const { status } = req.body as { status: string };

    if (!status) {
      return reply.code(400).send({ error: 'status is required' });
    }

    const task = await taskService.changeStatus(id, authReq.user.userId, status);
    if (!task) {
      return reply.code(404).send({ error: 'Task not found' });
    }
    return reply.send({ success: true, data: task });
  });

  /**
   * POST /tasks/:id/assign
   * Assign a task
   */
  fastify.post('/:id/assign', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };
    const { assigneeId } = req.body as { assigneeId: string };

    const task = await taskService.assign(id, authReq.user.userId, assigneeId || null);
    if (!task) {
      return reply.code(404).send({ error: 'Task not found' });
    }
    return reply.send({ success: true, data: task });
  });

  // =============================================================================
  // Nested Comment Endpoints
  // =============================================================================

  /**
   * GET /tasks/:id/comments
   * Get comments for a task
   */
  fastify.get('/:id/comments', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    const comments = await commentService.listByTask(id, authReq.user.userId);
    return reply.send({ success: true, data: comments });
  });

  /**
   * POST /tasks/:id/comments
   * Add a comment to a task
   */
  fastify.post('/:id/comments', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };
    const { content } = req.body as { content: string };

    if (!content) {
      return reply.code(400).send({ error: 'content is required' });
    }

    const comment = await commentService.create({
      taskId: id,
      userId: authReq.user.userId,
      content,
    });

    return reply.code(201).send({ success: true, data: comment });
  });

  // =============================================================================
  // Nested Label Endpoints
  // =============================================================================

  /**
   * POST /tasks/:id/labels
   * Add a label to a task
   */
  fastify.post('/:id/labels', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };
    const { labelId } = req.body as { labelId: string };

    if (!labelId) {
      return reply.code(400).send({ error: 'labelId is required' });
    }

    await labelService.addToTask(id, labelId, authReq.user.userId);
    return reply.send({ success: true, message: 'Label added to task' });
  });

  /**
   * DELETE /tasks/:id/labels/:labelId
   * Remove a label from a task
   */
  fastify.delete('/:id/labels/:labelId', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id, labelId } = req.params as { id: string; labelId: string };

    await labelService.removeFromTask(id, labelId, authReq.user.userId);
    return reply.send({ success: true, message: 'Label removed from task' });
  });
};

export default routes;
