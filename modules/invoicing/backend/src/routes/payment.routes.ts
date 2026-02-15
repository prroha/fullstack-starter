import { Router, Request, Response } from 'express';
import { getPaymentService } from '../services/payment.service';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

// =============================================================================
// Router
// =============================================================================

const router = Router({ mergeParams: true });
const paymentService = getPaymentService();

// =============================================================================
// Payment Endpoints (All Authenticated)
// =============================================================================

/**
 * GET /invoices/:invoiceId/payments
 * List payments for an invoice
 */
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { invoiceId } = req.params;

    const payments = await paymentService.list(invoiceId, authReq.user.userId);
    res.json({ success: true, data: payments });
  } catch (error) {
    console.error('[PaymentRoutes] List error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to list payments' });
  }
});

/**
 * POST /invoices/:invoiceId/payments
 * Record a payment for an invoice
 */
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { invoiceId } = req.params;
    const { amount, method, paidAt, reference } = req.body;

    if (!amount || !method || !paidAt) {
      res.status(400).json({ error: 'amount, method, and paidAt are required' });
      return;
    }

    const payment = await paymentService.record(authReq.user.userId, {
      invoiceId,
      amount: Number(amount),
      method,
      paidAt,
      reference,
    });

    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    console.error('[PaymentRoutes] Record error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to record payment',
    });
  }
});

/**
 * DELETE /invoices/:invoiceId/payments/:paymentId
 * Delete a payment
 */
router.delete('/:paymentId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    await paymentService.delete(req.params.paymentId, authReq.user.userId);
    res.json({ success: true, message: 'Payment deleted' });
  } catch (error) {
    console.error('[PaymentRoutes] Delete error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to delete payment',
    });
  }
});

export default router;
