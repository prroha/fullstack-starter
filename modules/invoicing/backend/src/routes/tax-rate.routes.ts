import { Router, Request, Response } from 'express';
import { getTaxRateService } from '../services/tax-rate.service';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

// =============================================================================
// Router
// =============================================================================

const router = Router();
const taxRateService = getTaxRateService();

// =============================================================================
// Tax Rate Endpoints (All Authenticated)
// =============================================================================

/**
 * GET /tax-rates
 * List all tax rates
 */
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    const taxRates = await taxRateService.list(authReq.user.userId);
    res.json({ success: true, data: taxRates });
  } catch (error) {
    console.error('[TaxRateRoutes] List error:', error);
    res.status(500).json({ error: 'Failed to list tax rates' });
  }
});

/**
 * POST /tax-rates
 * Create a new tax rate
 */
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { name, rate, isDefault } = req.body;

    if (!name || rate === undefined) {
      res.status(400).json({ error: 'name and rate are required' });
      return;
    }

    const taxRate = await taxRateService.create({
      userId: authReq.user.userId,
      name,
      rate: Number(rate),
      isDefault,
    });

    res.status(201).json({ success: true, data: taxRate });
  } catch (error) {
    console.error('[TaxRateRoutes] Create error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to create tax rate',
    });
  }
});

/**
 * PATCH /tax-rates/:id
 * Update a tax rate
 */
router.patch('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { name, rate, isDefault } = req.body;

    const taxRate = await taxRateService.update(req.params.id, authReq.user.userId, {
      name,
      rate: rate !== undefined ? Number(rate) : undefined,
      isDefault,
    });

    if (!taxRate) {
      res.status(404).json({ error: 'Tax rate not found' });
      return;
    }

    res.json({ success: true, data: taxRate });
  } catch (error) {
    console.error('[TaxRateRoutes] Update error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to update tax rate',
    });
  }
});

/**
 * DELETE /tax-rates/:id
 * Delete a tax rate
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    await taxRateService.delete(req.params.id, authReq.user.userId);
    res.json({ success: true, message: 'Tax rate deleted' });
  } catch (error) {
    console.error('[TaxRateRoutes] Delete error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to delete tax rate',
    });
  }
});

/**
 * POST /tax-rates/:id/default
 * Set a tax rate as the default
 */
router.post('/:id/default', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    const taxRate = await taxRateService.setDefault(req.params.id, authReq.user.userId);
    if (!taxRate) {
      res.status(404).json({ error: 'Tax rate not found' });
      return;
    }
    res.json({ success: true, data: taxRate });
  } catch (error) {
    console.error('[TaxRateRoutes] Set default error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to set default tax rate',
    });
  }
});

export default router;
