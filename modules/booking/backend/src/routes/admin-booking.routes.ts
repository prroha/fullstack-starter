import { Router, Request, Response } from 'express';
import { getBookingService } from '../services/booking.service';
import { authMiddleware } from '../middleware/auth';

// =============================================================================
// Router
// =============================================================================

const router = Router();
const bookingService = getBookingService();

// =============================================================================
// Admin Booking Endpoints (All Authenticated — Admin Only)
// =============================================================================

/**
 * GET /admin/bookings
 * List all bookings with full filtering and pagination
 */
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search, providerId, serviceId, startDate, endDate, page, limit } = req.query;

    const result = await bookingService.listAllBookings({
      status: status as string,
      search: search as string,
      providerId: providerId as string,
      serviceId: serviceId as string,
      startDate: startDate as string,
      endDate: endDate as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[AdminBookingRoutes] List error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to list bookings' });
  }
});

/**
 * GET /admin/bookings/stats
 * Get booking dashboard statistics
 */
router.get('/stats', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await bookingService.getBookingStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('[AdminBookingRoutes] Stats error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to get booking stats' });
  }
});

/**
 * PATCH /admin/bookings/:id/status
 * Update booking status (admin override)
 */
router.patch('/:id/status', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ error: 'status is required' });
      return;
    }

    const booking = await bookingService.updateBookingStatus(req.params.id, status);
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    console.error('[AdminBookingRoutes] Update status error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to update booking status',
    });
  }
});

/**
 * GET /admin/bookings/export
 * Export bookings as CSV
 */
router.get('/export', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, startDate, endDate } = req.query;

    const csv = await bookingService.exportBookings({
      status: status as string,
      startDate: startDate as string,
      endDate: endDate as string,
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=bookings-export.csv');
    res.send(csv);
  } catch (error) {
    console.error('[AdminBookingRoutes] Export error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to export bookings' });
  }
});

export default router;
