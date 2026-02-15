import { Router, Request, Response } from 'express';
import { getCommentService } from '../services/comment.service';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

// =============================================================================
// Router
// =============================================================================

const router = Router();
const commentService = getCommentService();

// =============================================================================
// Comment Endpoints (All Authenticated)
// =============================================================================
// Note: Create and list are nested under /tasks/:id/comments in task.routes.ts.
// This file handles update and delete by comment ID.

/**
 * PATCH /comments/:id
 * Update a comment
 */
router.patch('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { content } = req.body;

    if (!content) {
      res.status(400).json({ error: 'content is required' });
      return;
    }

    const comment = await commentService.update(req.params.id, authReq.user.userId, { content });
    if (!comment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }

    res.json({ success: true, data: comment });
  } catch (error) {
    console.error('[CommentRoutes] Update error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to update comment',
    });
  }
});

/**
 * DELETE /comments/:id
 * Delete a comment
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    await commentService.delete(req.params.id, authReq.user.userId);
    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    console.error('[CommentRoutes] Delete error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to delete comment',
    });
  }
});

export default router;
