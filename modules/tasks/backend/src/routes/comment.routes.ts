import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { getCommentService } from '../services/comment.service.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

// =============================================================================
// Routes
// =============================================================================

const commentService = getCommentService();

// =============================================================================
// Comment Endpoints (All Authenticated)
// =============================================================================
// Note: Create and list are nested under /tasks/:id/comments in task.routes.ts.
// This file handles update and delete by comment ID.

const routes: FastifyPluginAsync = async (fastify) => {
  /**
   * PATCH /comments/:id
   * Update a comment
   */
  fastify.patch('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };
    const { content } = req.body as { content: string };

    if (!content) {
      return reply.code(400).send({ error: 'content is required' });
    }

    const comment = await commentService.update(id, authReq.user.userId, { content });
    if (!comment) {
      return reply.code(404).send({ error: 'Comment not found' });
    }

    return reply.send({ success: true, data: comment });
  });

  /**
   * DELETE /comments/:id
   * Delete a comment
   */
  fastify.delete('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    await commentService.delete(id, authReq.user.userId);
    return reply.send({ success: true, message: 'Comment deleted' });
  });
};

export default routes;
