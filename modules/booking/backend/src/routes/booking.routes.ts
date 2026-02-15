import { Router, Request, Response } from 'express';
import { getBookingService } from '../services/booking.service';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

// =============================================================================
// Router
// =============================================================================

const router = Router();
const bookingService = getBookingService();

// =============================================================================
// Booking Endpoints (All Authenticated)
// =============================================================================

/**
 * POST /bookings
 * Create a new booking
 */
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { serviceId, providerId, date, startTime, notes } = req.body;

    if (!serviceId || !providerId || !date || !startTime) {
      res.status(400).json({ error: 'serviceId, providerId, date, and startTime are required' });
      return;
    }

    const booking = await bookingService.createBooking({
      userId: authReq.user.userId,
      serviceId,
      providerId,
      date,
      startTime,
      notes,
    });

    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    console.error('[BookingRoutes] Create error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to create booking',
    });
  }
});

/**
 * GET /bookings
 * List current user's bookings with filtering and pagination
 */
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { status, page, limit } = req.query;

    const result = await bookingService.listUserBookings({
      userId: authReq.user.userId,
      status: status as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[BookingRoutes] List error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to list bookings' });
  }
});

/**
 * GET /bookings/:id
 * Get booking detail
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const booking = await bookingService.getBookingById(req.params.id);
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }
    res.json({ success: true, data: booking });
  } catch (error) {
    console.error('[BookingRoutes] Get error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to get booking' });
  }
});

/**
 * POST /bookings/:id/cancel
 * Cancel a booking
 */
router.post('/:id/cancel', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { reason } = req.body;

    const booking = await bookingService.cancelBooking(req.params.id, reason);
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    console.error('[BookingRoutes] Cancel error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to cancel booking',
    });
  }
});

/**
 * POST /bookings/:id/reschedule
 * Reschedule a booking to a new date and time
 */
router.post('/:id/reschedule', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { date, startTime } = req.body;

    if (!date || !startTime) {
      res.status(400).json({ error: 'date and startTime are required' });
      return;
    }

    const booking = await bookingService.rescheduleBooking(req.params.id, { date, startTime });
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    console.error('[BookingRoutes] Reschedule error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to reschedule booking',
    });
  }
});

// =============================================================================
// Provider Actions
// =============================================================================

/**
 * POST /bookings/:id/confirm
 * Confirm a pending booking (provider)
 */
router.post('/:id/confirm', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const booking = await bookingService.confirmBooking(req.params.id);
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }
    res.json({ success: true, data: booking });
  } catch (error) {
    console.error('[BookingRoutes] Confirm error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to confirm booking',
    });
  }
});

/**
 * POST /bookings/:id/complete
 * Mark a booking as completed (provider)
 */
router.post('/:id/complete', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const booking = await bookingService.completeBooking(req.params.id);
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }
    res.json({ success: true, data: booking });
  } catch (error) {
    console.error('[BookingRoutes] Complete error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to complete booking',
    });
  }
});

/**
 * POST /bookings/:id/no-show
 * Mark a booking as no-show (provider)
 */
router.post('/:id/no-show', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const booking = await bookingService.markNoShow(req.params.id);
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }
    res.json({ success: true, data: booking });
  } catch (error) {
    console.error('[BookingRoutes] No-show error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to mark booking as no-show',
    });
  }
});

export default router;
