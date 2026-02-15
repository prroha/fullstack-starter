import { Router, Request, Response } from 'express';
import { getRecurringService } from '../services/recurring.service';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

// =============================================================================
// Router
// =============================================================================

const router = Router();
const recurringService = getRecurringService();

// =============================================================================
// Recurring Invoice Endpoints (All Authenticated)
// =============================================================================

/**
 * GET /recurring
 * List recurring invoices with pagination
 */
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { page, limit } = req.query;

    const result = await recurringService.list(authReq.user.userId, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[RecurringRoutes] List error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to list recurring invoices' });
  }
});

/**
 * GET /recurring/:id
 * Get recurring invoice by ID
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    const recurring = await recurringService.getById(req.params.id, authReq.user.userId);
    if (!recurring) {
      res.status(404).json({ error: 'Recurring invoice not found' });
      return;
    }
    res.json({ success: true, data: recurring });
  } catch (error) {
    console.error('[RecurringRoutes] Get error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to get recurring invoice' });
  }
});

/**
 * POST /recurring
 * Create a new recurring invoice
 */
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const {
      clientId,
      frequency,
      startDate,
      endDate,
      templateItems,
      currency,
      notes,
      terms,
      maxOccurrences,
    } = req.body;

    if (!clientId || !frequency || !startDate || !templateItems) {
      res.status(400).json({ error: 'clientId, frequency, startDate, and templateItems are required' });
      return;
    }

    if (!Array.isArray(templateItems) || templateItems.length === 0) {
      res.status(400).json({ error: 'templateItems must be a non-empty array' });
      return;
    }

    const recurring = await recurringService.create({
      userId: authReq.user.userId,
      clientId,
      frequency,
      startDate,
      endDate,
      templateItems,
      currency,
      notes,
      terms,
      maxOccurrences,
    });

    res.status(201).json({ success: true, data: recurring });
  } catch (error) {
    console.error('[RecurringRoutes] Create error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to create recurring invoice',
    });
  }
});

/**
 * PATCH /recurring/:id
 * Update a recurring invoice
 */
router.patch('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const {
      clientId,
      frequency,
      startDate,
      endDate,
      templateItems,
      currency,
      notes,
      terms,
      maxOccurrences,
    } = req.body;

    const recurring = await recurringService.update(req.params.id, authReq.user.userId, {
      clientId,
      frequency,
      startDate,
      endDate,
      templateItems,
      currency,
      notes,
      terms,
      maxOccurrences,
    });

    if (!recurring) {
      res.status(404).json({ error: 'Recurring invoice not found' });
      return;
    }

    res.json({ success: true, data: recurring });
  } catch (error) {
    console.error('[RecurringRoutes] Update error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to update recurring invoice',
    });
  }
});

/**
 * POST /recurring/:id/pause
 * Pause a recurring invoice
 */
router.post('/:id/pause', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    const recurring = await recurringService.pause(req.params.id, authReq.user.userId);
    if (!recurring) {
      res.status(404).json({ error: 'Recurring invoice not found' });
      return;
    }
    res.json({ success: true, data: recurring });
  } catch (error) {
    console.error('[RecurringRoutes] Pause error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to pause recurring invoice',
    });
  }
});

/**
 * POST /recurring/:id/resume
 * Resume a paused recurring invoice
 */
router.post('/:id/resume', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    const recurring = await recurringService.resume(req.params.id, authReq.user.userId);
    if (!recurring) {
      res.status(404).json({ error: 'Recurring invoice not found' });
      return;
    }
    res.json({ success: true, data: recurring });
  } catch (error) {
    console.error('[RecurringRoutes] Resume error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to resume recurring invoice',
    });
  }
});

/**
 * POST /recurring/:id/cancel
 * Cancel a recurring invoice
 */
router.post('/:id/cancel', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    const recurring = await recurringService.cancel(req.params.id, authReq.user.userId);
    if (!recurring) {
      res.status(404).json({ error: 'Recurring invoice not found' });
      return;
    }
    res.json({ success: true, data: recurring });
  } catch (error) {
    console.error('[RecurringRoutes] Cancel error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to cancel recurring invoice',
    });
  }
});

export default router;
