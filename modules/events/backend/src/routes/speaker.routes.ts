import { Router, Request, Response } from 'express';
import { getSpeakerService } from '../services/speaker.service';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

// =============================================================================
// Router
// =============================================================================

const router = Router();
const speakerService = getSpeakerService();

// =============================================================================
// Speaker Endpoints (All Authenticated)
// =============================================================================

/**
 * POST /speakers/reorder
 * Reorder speakers
 * MUST be before /:id route
 */
router.post('/reorder', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { ids } = req.body;

    if (!Array.isArray(ids)) {
      res.status(400).json({ error: 'ids array is required' });
      return;
    }

    await speakerService.reorder(authReq.user.userId, ids);
    res.json({ success: true, message: 'Speakers reordered' });
  } catch (error) {
    console.error('[SpeakerRoutes] Reorder error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to reorder speakers',
    });
  }
});

/**
 * PATCH /speakers/:id
 * Update a speaker
 */
router.patch('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { name, email, bio, avatarUrl, title, company } = req.body;

    const speaker = await speakerService.update(req.params.id, authReq.user.userId, {
      name,
      email,
      bio,
      avatarUrl,
      title,
      company,
    });

    if (!speaker) {
      res.status(404).json({ error: 'Speaker not found' });
      return;
    }

    res.json({ success: true, data: speaker });
  } catch (error) {
    console.error('[SpeakerRoutes] Update error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to update speaker',
    });
  }
});

/**
 * DELETE /speakers/:id
 * Delete a speaker
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    await speakerService.delete(req.params.id, authReq.user.userId);
    res.json({ success: true, message: 'Speaker deleted' });
  } catch (error) {
    console.error('[SpeakerRoutes] Delete error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to delete speaker',
    });
  }
});

export default router;
