import { Router, Request, Response } from 'express';
import { getInvoiceService } from '../services/invoice.service';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

// =============================================================================
// Router
// =============================================================================

const router = Router();
const invoiceService = getInvoiceService();

// =============================================================================
// Invoice Endpoints (All Authenticated)
// =============================================================================

/**
 * GET /invoices/stats
 * Get dashboard stats (total, paid, outstanding, overdue, etc.)
 * MUST be before /:id route to avoid matching "stats" as an ID
 */
router.get('/stats', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    const stats = await invoiceService.getStats(authReq.user.userId);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('[InvoiceRoutes] Stats error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to get invoice stats' });
  }
});

/**
 * GET /invoices
 * List invoices with filtering and pagination
 */
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { search, status, clientId, dateFrom, dateTo, page, limit } = req.query;

    const result = await invoiceService.list(authReq.user.userId, {
      search: search as string,
      status: status as string,
      clientId: clientId as string,
      dateFrom: dateFrom as string,
      dateTo: dateTo as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[InvoiceRoutes] List error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to list invoices' });
  }
});

/**
 * GET /invoices/:id
 * Get invoice by ID (includes items, payments, activities, client)
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    const invoice = await invoiceService.getById(req.params.id, authReq.user.userId);
    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }
    res.json({ success: true, data: invoice });
  } catch (error) {
    console.error('[InvoiceRoutes] Get error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to get invoice' });
  }
});

/**
 * POST /invoices
 * Create a new invoice
 */
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { clientId, issueDate, dueDate, currency, notes, terms, discountAmount, items } = req.body;

    if (!clientId || !issueDate || !dueDate) {
      res.status(400).json({ error: 'clientId, issueDate, and dueDate are required' });
      return;
    }

    const invoice = await invoiceService.create({
      userId: authReq.user.userId,
      clientId,
      issueDate,
      dueDate,
      currency,
      notes,
      terms,
      discountAmount,
      items,
    });

    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    console.error('[InvoiceRoutes] Create error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to create invoice',
    });
  }
});

/**
 * PATCH /invoices/:id
 * Update an invoice
 */
router.patch('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { clientId, issueDate, dueDate, currency, notes, terms, discountAmount } = req.body;

    const invoice = await invoiceService.update(req.params.id, authReq.user.userId, {
      clientId,
      issueDate,
      dueDate,
      currency,
      notes,
      terms,
      discountAmount,
    });

    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    res.json({ success: true, data: invoice });
  } catch (error) {
    console.error('[InvoiceRoutes] Update error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to update invoice',
    });
  }
});

/**
 * DELETE /invoices/:id
 * Delete an invoice (only DRAFT invoices can be deleted)
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    await invoiceService.delete(req.params.id, authReq.user.userId);
    res.json({ success: true, message: 'Invoice deleted' });
  } catch (error) {
    console.error('[InvoiceRoutes] Delete error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to delete invoice',
    });
  }
});

/**
 * POST /invoices/:id/send
 * Mark invoice as sent
 */
router.post('/:id/send', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    const invoice = await invoiceService.send(req.params.id, authReq.user.userId);
    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }
    res.json({ success: true, data: invoice });
  } catch (error) {
    console.error('[InvoiceRoutes] Send error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to send invoice',
    });
  }
});

/**
 * POST /invoices/:id/void
 * Void an invoice
 */
router.post('/:id/void', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    const invoice = await invoiceService.void(req.params.id, authReq.user.userId);
    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }
    res.json({ success: true, data: invoice });
  } catch (error) {
    console.error('[InvoiceRoutes] Void error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to void invoice',
    });
  }
});

/**
 * POST /invoices/:id/duplicate
 * Duplicate an invoice (creates a new DRAFT copy)
 */
router.post('/:id/duplicate', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    const invoice = await invoiceService.duplicate(req.params.id, authReq.user.userId);
    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }
    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    console.error('[InvoiceRoutes] Duplicate error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to duplicate invoice',
    });
  }
});

export default router;
