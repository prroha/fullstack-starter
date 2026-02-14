import { Router, Request, Response } from 'express';
import { getVenueService } from '../services/venue.service';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

// =============================================================================
// Router
// =============================================================================

const router = Router();
const venueService = getVenueService();

// =============================================================================
// Venue Endpoints (All Authenticated)
// =============================================================================

/**
 * GET /venues/stats
 * Get venue stats
 * MUST be before /:id route
 */
router.get('/stats', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    const stats = await venueService.getStats(authReq.user.userId);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('[VenueRoutes] Stats error:', error);
    res.status(500).json({ error: 'Failed to get venue stats' });
  }
});

/**
 * GET /venues
 * List venues with filtering and pagination
 */
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { search, isVirtual, page, limit } = req.query;

    const result = await venueService.list(authReq.user.userId, {
      search: search as string,
      isVirtual: isVirtual === 'true' ? true : isVirtual === 'false' ? false : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[VenueRoutes] List error:', error);
    res.status(500).json({ error: 'Failed to list venues' });
  }
});

/**
 * GET /venues/:id
 * Get venue by ID
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    const venue = await venueService.getById(req.params.id, authReq.user.userId);
    if (!venue) {
      res.status(404).json({ error: 'Venue not found' });
      return;
    }
    res.json({ success: true, data: venue });
  } catch (error) {
    console.error('[VenueRoutes] Get error:', error);
    res.status(500).json({ error: 'Failed to get venue' });
  }
});

/**
 * POST /venues
 * Create a new venue
 */
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { name, address, city, state, country, capacity, isVirtual, meetingUrl } = req.body;

    if (!name) {
      res.status(400).json({ error: 'name is required' });
      return;
    }

    const venue = await venueService.create({
      userId: authReq.user.userId,
      name,
      address,
      city,
      state,
      country,
      capacity,
      isVirtual,
      meetingUrl,
    });

    res.status(201).json({ success: true, data: venue });
  } catch (error) {
    console.error('[VenueRoutes] Create error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to create venue',
    });
  }
});

/**
 * PATCH /venues/:id
 * Update a venue
 */
router.patch('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { name, address, city, state, country, capacity, isVirtual, meetingUrl } = req.body;

    const venue = await venueService.update(req.params.id, authReq.user.userId, {
      name,
      address,
      city,
      state,
      country,
      capacity,
      isVirtual,
      meetingUrl,
    });

    if (!venue) {
      res.status(404).json({ error: 'Venue not found' });
      return;
    }

    res.json({ success: true, data: venue });
  } catch (error) {
    console.error('[VenueRoutes] Update error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to update venue',
    });
  }
});

/**
 * DELETE /venues/:id
 * Delete a venue
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    await venueService.delete(req.params.id, authReq.user.userId);
    res.json({ success: true, message: 'Venue deleted' });
  } catch (error) {
    console.error('[VenueRoutes] Delete error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to delete venue',
    });
  }
});

export default router;
