import { Router, Request, Response } from 'express';
import { getSlaService } from '../services/sla.service';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

// =============================================================================
// Router
// =============================================================================

const router = Router();
const slaService = getSlaService();

// =============================================================================
// SLA Policy Endpoints (All Authenticated)
// =============================================================================

/**
 * GET /sla-policies/check-breaches
 * Check for SLA breaches across all active tickets
 * MUST be before /:id route to avoid matching "check-breaches" as an ID
 */
router.get('/check-breaches', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    const breaches = await slaService.checkBreaches(authReq.user.userId);
    res.json({ success: true, data: breaches });
  } catch (error) {
    console.error('[SlaRoutes] Check breaches error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to check SLA breaches' });
  }
});

/**
 * GET /sla-policies
 * List all SLA policies
 */
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    const { search, priority, isActive, page, limit } = req.query;

    const policies = await slaService.list(authReq.user.userId, {
      search: search as string,
      priority: priority as string,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
    res.json({ success: true, data: policies });
  } catch (error) {
    console.error('[SlaRoutes] List error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to list SLA policies' });
  }
});

/**
 * GET /sla-policies/:id
 * Get SLA policy by ID
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    const policy = await slaService.getById(req.params.id, authReq.user.userId);
    if (!policy) {
      res.status(404).json({ error: 'SLA policy not found' });
      return;
    }
    res.json({ success: true, data: policy });
  } catch (error) {
    console.error('[SlaRoutes] Get error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to get SLA policy' });
  }
});

/**
 * POST /sla-policies
 * Create a new SLA policy
 */
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { name, description, priority, firstResponseMinutes, resolutionMinutes, escalationEmail, businessHoursOnly } = req.body;

    if (!name || !priority || !firstResponseMinutes || !resolutionMinutes) {
      res.status(400).json({ error: 'name, priority, firstResponseMinutes, and resolutionMinutes are required' });
      return;
    }

    const policy = await slaService.create({
      userId: authReq.user.userId,
      name,
      description,
      priority,
      firstResponseMinutes: Number(firstResponseMinutes),
      resolutionMinutes: Number(resolutionMinutes),
      escalationEmail,
      businessHoursOnly,
    });

    res.status(201).json({ success: true, data: policy });
  } catch (error) {
    console.error('[SlaRoutes] Create error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to create SLA policy',
    });
  }
});

/**
 * PATCH /sla-policies/:id
 * Update an SLA policy
 */
router.patch('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { name, description, priority, firstResponseMinutes, resolutionMinutes, escalationEmail, businessHoursOnly } = req.body;

    const policy = await slaService.update(req.params.id, authReq.user.userId, {
      name,
      description,
      priority,
      firstResponseMinutes: firstResponseMinutes ? Number(firstResponseMinutes) : undefined,
      resolutionMinutes: resolutionMinutes ? Number(resolutionMinutes) : undefined,
      escalationEmail,
      businessHoursOnly,
    });

    if (!policy) {
      res.status(404).json({ error: 'SLA policy not found' });
      return;
    }

    res.json({ success: true, data: policy });
  } catch (error) {
    console.error('[SlaRoutes] Update error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to update SLA policy',
    });
  }
});

/**
 * DELETE /sla-policies/:id
 * Delete an SLA policy
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    await slaService.delete(req.params.id, authReq.user.userId);
    res.json({ success: true, message: 'SLA policy deleted' });
  } catch (error) {
    console.error('[SlaRoutes] Delete error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to delete SLA policy',
    });
  }
});

/**
 * POST /sla-policies/:id/toggle-active
 * Toggle SLA policy active status
 */
router.post('/:id/toggle-active', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    const policy = await slaService.toggleActive(req.params.id, authReq.user.userId);
    if (!policy) {
      res.status(404).json({ error: 'SLA policy not found' });
      return;
    }
    res.json({ success: true, data: policy });
  } catch (error) {
    console.error('[SlaRoutes] Toggle active error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to toggle SLA policy status',
    });
  }
});

export default router;
