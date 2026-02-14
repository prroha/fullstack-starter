import { Router, Request, Response } from 'express';
import { getSettingsService } from '../services/settings.service';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

// =============================================================================
// Router
// =============================================================================

const router = Router();
const settingsService = getSettingsService();

// =============================================================================
// Settings Endpoints (All Authenticated)
// =============================================================================

/**
 * GET /settings
 * Get user task settings (creates defaults if none exist)
 */
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    const settings = await settingsService.get(authReq.user.userId);
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('[SettingsRoutes] Get error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

/**
 * PATCH /settings
 * Update user task settings
 */
router.patch('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { defaultView, defaultProjectId, showCompletedTasks } = req.body;

    const settings = await settingsService.update(authReq.user.userId, {
      defaultView,
      defaultProjectId,
      showCompletedTasks,
    });

    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('[SettingsRoutes] Update error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to update settings',
    });
  }
});

export default router;
