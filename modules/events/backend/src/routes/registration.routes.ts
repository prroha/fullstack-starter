import { Router, Request, Response } from 'express';
import { getRegistrationService } from '../services/registration.service';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

// =============================================================================
// Router
// =============================================================================

const router = Router();
const registrationService = getRegistrationService();

// =============================================================================
// Registration Endpoints (All Authenticated)
// =============================================================================

/**
 * GET /registrations
 * List all registrations with filtering and pagination
 */
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { search, status, eventId, page, limit } = req.query;

    const result = await registrationService.listAll(authReq.user.userId, {
      search: search as string,
      status: status as string,
      eventId: eventId as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[RegistrationRoutes] List error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to list registrations' });
  }
});

/**
 * POST /registrations/:id/confirm
 * Confirm a registration
 */
router.post('/:id/confirm', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    const registration = await registrationService.confirm(req.params.id, authReq.user.userId);
    if (!registration) {
      res.status(404).json({ error: 'Registration not found' });
      return;
    }
    res.json({ success: true, data: registration });
  } catch (error) {
    console.error('[RegistrationRoutes] Confirm error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to confirm registration',
    });
  }
});

/**
 * POST /registrations/:id/check-in
 * Check in a registration
 */
router.post('/:id/check-in', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    const registration = await registrationService.checkIn(req.params.id, authReq.user.userId);
    if (!registration) {
      res.status(404).json({ error: 'Registration not found' });
      return;
    }
    res.json({ success: true, data: registration });
  } catch (error) {
    console.error('[RegistrationRoutes] Check-in error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to check in',
    });
  }
});

/**
 * POST /registrations/:id/cancel
 * Cancel a registration
 */
router.post('/:id/cancel', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    const registration = await registrationService.cancel(req.params.id, authReq.user.userId);
    if (!registration) {
      res.status(404).json({ error: 'Registration not found' });
      return;
    }
    res.json({ success: true, data: registration });
  } catch (error) {
    console.error('[RegistrationRoutes] Cancel error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to cancel registration',
    });
  }
});

export default router;
