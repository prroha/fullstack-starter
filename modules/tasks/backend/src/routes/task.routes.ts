import { Router, Request, Response } from 'express';
import { getTaskService } from '../services/task.service';
import { getCommentService } from '../services/comment.service';
import { getLabelService } from '../services/label.service';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

// =============================================================================
// Router
// =============================================================================

const router = Router();
const taskService = getTaskService();
const commentService = getCommentService();
const labelService = getLabelService();

// =============================================================================
// Task Endpoints (All Authenticated)
// =============================================================================

/**
 * GET /tasks/stats
 * Get dashboard stats
 * MUST be before /:id route to avoid matching "stats" as an ID
 */
router.get('/stats', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    const stats = await taskService.getDashboardStats(authReq.user.userId);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('[TaskRoutes] Stats error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to get task stats' });
  }
});

/**
 * GET /tasks
 * List tasks with filtering and pagination
 */
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { search, status, priority, projectId, assigneeId, labelId, dueBefore, dueAfter, showCompleted, page, limit } = req.query;

    const result = await taskService.list(authReq.user.userId, {
      search: search as string,
      status: status as string,
      priority: priority as string,
      projectId: projectId as string,
      assigneeId: assigneeId as string,
      labelId: labelId as string,
      dueBefore: dueBefore as string,
      dueAfter: dueAfter as string,
      showCompleted: showCompleted === 'true',
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[TaskRoutes] List error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to list tasks' });
  }
});

/**
 * GET /tasks/:id
 * Get task by ID (includes project, comments, labels)
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    const task = await taskService.getById(req.params.id, authReq.user.userId);
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    res.json({ success: true, data: task });
  } catch (error) {
    console.error('[TaskRoutes] Get error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to get task' });
  }
});

/**
 * POST /tasks
 * Create a new task
 */
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { title, description, projectId, assigneeId, status, priority, dueDate } = req.body;

    if (!title) {
      res.status(400).json({ error: 'title is required' });
      return;
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

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    console.error('[TaskRoutes] Create error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to create task',
    });
  }
});

/**
 * PATCH /tasks/:id
 * Update a task
 */
router.patch('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { title, description, projectId, assigneeId, status, priority, dueDate } = req.body;

    const task = await taskService.update(req.params.id, authReq.user.userId, {
      title,
      description,
      projectId,
      assigneeId,
      status,
      priority,
      dueDate,
    });

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    res.json({ success: true, data: task });
  } catch (error) {
    console.error('[TaskRoutes] Update error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to update task',
    });
  }
});

/**
 * DELETE /tasks/:id
 * Delete a task
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    await taskService.delete(req.params.id, authReq.user.userId);
    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    console.error('[TaskRoutes] Delete error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to delete task',
    });
  }
});

/**
 * POST /tasks/reorder
 * Reorder tasks
 * MUST be before /:id routes to avoid matching "reorder" as an ID
 */
router.post('/reorder', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { ids } = req.body;

    if (!Array.isArray(ids)) {
      res.status(400).json({ error: 'ids array is required' });
      return;
    }

    await taskService.reorder(authReq.user.userId, ids);
    res.json({ success: true, message: 'Tasks reordered' });
  } catch (error) {
    console.error('[TaskRoutes] Reorder error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to reorder tasks',
    });
  }
});

/**
 * POST /tasks/:id/status
 * Update task status
 */
router.post('/:id/status', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ error: 'status is required' });
      return;
    }

    const task = await taskService.changeStatus(req.params.id, authReq.user.userId, status);
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    res.json({ success: true, data: task });
  } catch (error) {
    console.error('[TaskRoutes] Status update error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to update task status',
    });
  }
});

/**
 * POST /tasks/:id/assign
 * Assign a task
 */
router.post('/:id/assign', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { assigneeId } = req.body;

    const task = await taskService.assign(req.params.id, authReq.user.userId, assigneeId || null);
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    res.json({ success: true, data: task });
  } catch (error) {
    console.error('[TaskRoutes] Assign error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to assign task',
    });
  }
});

// =============================================================================
// Nested Comment Endpoints
// =============================================================================

/**
 * GET /tasks/:id/comments
 * Get comments for a task
 */
router.get('/:id/comments', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    const comments = await commentService.listByTask(req.params.id, authReq.user.userId);
    res.json({ success: true, data: comments });
  } catch (error) {
    console.error('[TaskRoutes] Get comments error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to get comments' });
  }
});

/**
 * POST /tasks/:id/comments
 * Add a comment to a task
 */
router.post('/:id/comments', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { content } = req.body;

    if (!content) {
      res.status(400).json({ error: 'content is required' });
      return;
    }

    const comment = await commentService.create({
      taskId: req.params.id,
      userId: authReq.user.userId,
      content,
    });

    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    console.error('[TaskRoutes] Add comment error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to add comment',
    });
  }
});

// =============================================================================
// Nested Label Endpoints
// =============================================================================

/**
 * POST /tasks/:id/labels
 * Add a label to a task
 */
router.post('/:id/labels', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { labelId } = req.body;

    if (!labelId) {
      res.status(400).json({ error: 'labelId is required' });
      return;
    }

    await labelService.addToTask(req.params.id, labelId, authReq.user.userId);
    res.json({ success: true, message: 'Label added to task' });
  } catch (error) {
    console.error('[TaskRoutes] Add label error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to add label to task',
    });
  }
});

/**
 * DELETE /tasks/:id/labels/:labelId
 * Remove a label from a task
 */
router.delete('/:id/labels/:labelId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    await labelService.removeFromTask(req.params.id, req.params.labelId, authReq.user.userId);
    res.json({ success: true, message: 'Label removed from task' });
  } catch (error) {
    console.error('[TaskRoutes] Remove label error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to remove label from task',
    });
  }
});

export default router;
