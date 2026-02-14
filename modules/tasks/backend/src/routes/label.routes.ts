import { Router, Request, Response } from 'express';
import { getLabelService } from '../services/label.service';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

// =============================================================================
// Router
// =============================================================================

const router = Router();
const labelService = getLabelService();

// =============================================================================
// Label Endpoints (All Authenticated)
// =============================================================================

/**
 * GET /labels
 * List all labels for the authenticated user
 */
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    const labels = await labelService.list(authReq.user.userId);
    res.json({ success: true, data: labels });
  } catch (error) {
    console.error('[LabelRoutes] List error:', error);
    res.status(500).json({ error: 'Failed to list labels' });
  }
});

/**
 * POST /labels
 * Create a new label
 */
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { name, color } = req.body;

    if (!name) {
      res.status(400).json({ error: 'name is required' });
      return;
    }

    const label = await labelService.create({
      userId: authReq.user.userId,
      name,
      color,
    });

    res.status(201).json({ success: true, data: label });
  } catch (error) {
    console.error('[LabelRoutes] Create error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to create label',
    });
  }
});

/**
 * PATCH /labels/:id
 * Update a label
 */
router.patch('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { name, color } = req.body;

    const label = await labelService.update(req.params.id, authReq.user.userId, { name, color });
    if (!label) {
      res.status(404).json({ error: 'Label not found' });
      return;
    }

    res.json({ success: true, data: label });
  } catch (error) {
    console.error('[LabelRoutes] Update error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to update label',
    });
  }
});

/**
 * DELETE /labels/:id
 * Delete a label
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    await labelService.delete(req.params.id, authReq.user.userId);
    res.json({ success: true, message: 'Label deleted' });
  } catch (error) {
    console.error('[LabelRoutes] Delete error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to delete label',
    });
  }
});

export default router;
