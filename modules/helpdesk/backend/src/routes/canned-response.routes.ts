import { Router, Request, Response } from 'express';
import { getCannedResponseService } from '../services/canned-response.service';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

// =============================================================================
// Router
// =============================================================================

const router = Router();
const cannedResponseService = getCannedResponseService();

// =============================================================================
// Canned Response Endpoints (All Authenticated)
// =============================================================================

/**
 * GET /canned-responses/mine
 * Get the current agent's canned responses
 * MUST be before /:id route to avoid matching "mine" as an ID
 */
router.get('/mine', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    const responses = await cannedResponseService.list(authReq.user.userId, {
      createdByAgentId: authReq.user.userId,
    });
    res.json({ success: true, data: responses });
  } catch (error) {
    console.error('[CannedResponseRoutes] Get mine error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to get canned responses' });
  }
});

/**
 * GET /canned-responses
 * List canned responses with filtering and pagination
 */
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { search, categoryId, page, limit } = req.query;

    const result = await cannedResponseService.list(authReq.user.userId, {
      search: search as string,
      categoryId: categoryId as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[CannedResponseRoutes] List error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to list canned responses' });
  }
});

/**
 * GET /canned-responses/:id
 * Get canned response by ID
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    const response = await cannedResponseService.getById(req.params.id, authReq.user.userId);
    if (!response) {
      res.status(404).json({ error: 'Canned response not found' });
      return;
    }
    res.json({ success: true, data: response });
  } catch (error) {
    console.error('[CannedResponseRoutes] Get error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to get canned response' });
  }
});

/**
 * POST /canned-responses
 * Create a new canned response
 */
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { title, content, shortcut, categoryId, isShared } = req.body;

    if (!title || !content) {
      res.status(400).json({ error: 'title and content are required' });
      return;
    }

    const response = await cannedResponseService.create({
      userId: authReq.user.userId,
      title,
      content,
      shortcut,
      categoryId,
      isShared,
    });

    res.status(201).json({ success: true, data: response });
  } catch (error) {
    console.error('[CannedResponseRoutes] Create error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to create canned response',
    });
  }
});

/**
 * PATCH /canned-responses/:id
 * Update a canned response
 */
router.patch('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { title, content, shortcut, categoryId, isShared } = req.body;

    const response = await cannedResponseService.update(req.params.id, authReq.user.userId, {
      title,
      content,
      shortcut,
      categoryId,
      isShared,
    });

    if (!response) {
      res.status(404).json({ error: 'Canned response not found' });
      return;
    }

    res.json({ success: true, data: response });
  } catch (error) {
    console.error('[CannedResponseRoutes] Update error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to update canned response',
    });
  }
});

/**
 * DELETE /canned-responses/:id
 * Delete a canned response
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    await cannedResponseService.delete(req.params.id, authReq.user.userId);
    res.json({ success: true, message: 'Canned response deleted' });
  } catch (error) {
    console.error('[CannedResponseRoutes] Delete error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to delete canned response',
    });
  }
});

export default router;
