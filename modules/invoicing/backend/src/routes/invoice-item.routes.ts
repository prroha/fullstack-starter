import { Router, Request, Response } from 'express';
import { getInvoiceItemService } from '../services/invoice-item.service';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

// =============================================================================
// Router
// =============================================================================

const router = Router({ mergeParams: true });
const invoiceItemService = getInvoiceItemService();

// =============================================================================
// Invoice Item Endpoints (All Authenticated)
// =============================================================================

/**
 * POST /invoices/:invoiceId/items
 * Add an item to an invoice
 */
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { invoiceId } = req.params;
    const { description, quantity, unitPrice, taxRateId } = req.body;

    if (!description || quantity === undefined || unitPrice === undefined) {
      res.status(400).json({ error: 'description, quantity, and unitPrice are required' });
      return;
    }

    const item = await invoiceItemService.add(invoiceId, authReq.user.userId, {
      description,
      quantity: Number(quantity),
      unitPrice: Number(unitPrice),
      taxRateId,
    });

    res.status(201).json({ success: true, data: item });
  } catch (error) {
    console.error('[InvoiceItemRoutes] Add error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to add invoice item',
    });
  }
});

/**
 * PATCH /invoices/:invoiceId/items/:itemId
 * Update an invoice item
 */
router.patch('/:itemId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { description, quantity, unitPrice, taxRateId } = req.body;

    const item = await invoiceItemService.update(req.params.itemId, authReq.user.userId, {
      description,
      quantity: quantity !== undefined ? Number(quantity) : undefined,
      unitPrice: unitPrice !== undefined ? Number(unitPrice) : undefined,
      taxRateId,
    });

    if (!item) {
      res.status(404).json({ error: 'Invoice item not found' });
      return;
    }

    res.json({ success: true, data: item });
  } catch (error) {
    console.error('[InvoiceItemRoutes] Update error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to update invoice item',
    });
  }
});

/**
 * DELETE /invoices/:invoiceId/items/:itemId
 * Delete an invoice item
 */
router.delete('/:itemId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    await invoiceItemService.delete(req.params.itemId, authReq.user.userId);
    res.json({ success: true, message: 'Invoice item deleted' });
  } catch (error) {
    console.error('[InvoiceItemRoutes] Delete error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to delete invoice item',
    });
  }
});

/**
 * POST /invoices/:invoiceId/items/reorder
 * Reorder invoice items
 */
router.post('/reorder', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { invoiceId } = req.params;
    const { itemIds } = req.body;

    if (!itemIds || !Array.isArray(itemIds)) {
      res.status(400).json({ error: 'itemIds array is required' });
      return;
    }

    const items = await invoiceItemService.reorder(invoiceId, authReq.user.userId, itemIds);
    res.json({ success: true, data: items });
  } catch (error) {
    console.error('[InvoiceItemRoutes] Reorder error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to reorder invoice items',
    });
  }
});

export default router;
