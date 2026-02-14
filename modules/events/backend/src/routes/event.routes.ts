import { Router, Request, Response } from 'express';
import { getEventService } from '../services/event.service';
import { getSpeakerService } from '../services/speaker.service';
import { getRegistrationService } from '../services/registration.service';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

// =============================================================================
// Router
// =============================================================================

const router = Router();
const eventService = getEventService();
const speakerService = getSpeakerService();
const registrationService = getRegistrationService();

// =============================================================================
// Event Endpoints (All Authenticated)
// =============================================================================

/**
 * GET /events/stats, GET /events/dashboard-stats
 * Get dashboard stats
 * MUST be before /:id route to avoid matching "stats" as an ID
 */
const handleGetStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    const stats = await eventService.getDashboardStats(authReq.user.userId);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('[EventRoutes] Stats error:', error);
    res.status(500).json({ error: 'Failed to get event stats' });
  }
};

router.get('/stats', authMiddleware, handleGetStats);
router.get('/dashboard-stats', authMiddleware, handleGetStats);

/**
 * GET /events
 * List events with filtering and pagination
 */
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { search, status, type, categoryId, venueId, startAfter, startBefore, page, limit } = req.query;

    const result = await eventService.list(authReq.user.userId, {
      search: search as string,
      status: status as string,
      type: type as string,
      categoryId: categoryId as string,
      venueId: venueId as string,
      startAfter: startAfter as string,
      startBefore: startBefore as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[EventRoutes] List error:', error);
    res.status(500).json({ error: 'Failed to list events' });
  }
});

/**
 * GET /events/:id
 * Get event by ID (includes category, venue, speakers, registrations)
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    const event = await eventService.getById(req.params.id, authReq.user.userId);
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    res.json({ success: true, data: event });
  } catch (error) {
    console.error('[EventRoutes] Get error:', error);
    res.status(500).json({ error: 'Failed to get event' });
  }
});

/**
 * POST /events
 * Create a new event
 */
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { title, description, categoryId, venueId, type, status, startDate, endDate, capacity, price, currency, imageUrl, isFeatured } = req.body;

    if (!title || !startDate || !endDate) {
      res.status(400).json({ error: 'title, startDate, and endDate are required' });
      return;
    }

    const event = await eventService.create({
      userId: authReq.user.userId,
      title,
      description,
      categoryId,
      venueId,
      type,
      status,
      startDate,
      endDate,
      capacity,
      price,
      currency,
      imageUrl,
      isFeatured,
    });

    res.status(201).json({ success: true, data: event });
  } catch (error) {
    console.error('[EventRoutes] Create error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to create event',
    });
  }
});

/**
 * PATCH /events/:id
 * Update an event
 */
router.patch('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { title, description, categoryId, venueId, type, status, startDate, endDate, capacity, price, currency, imageUrl, isFeatured } = req.body;

    const event = await eventService.update(req.params.id, authReq.user.userId, {
      title,
      description,
      categoryId,
      venueId,
      type,
      status,
      startDate,
      endDate,
      capacity,
      price,
      currency,
      imageUrl,
      isFeatured,
    });

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    res.json({ success: true, data: event });
  } catch (error) {
    console.error('[EventRoutes] Update error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to update event',
    });
  }
});

/**
 * DELETE /events/:id
 * Delete an event
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    await eventService.delete(req.params.id, authReq.user.userId);
    res.json({ success: true, message: 'Event deleted' });
  } catch (error) {
    console.error('[EventRoutes] Delete error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to delete event',
    });
  }
});

/**
 * POST /events/:id/publish
 * Publish an event
 */
router.post('/:id/publish', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    const event = await eventService.publish(req.params.id, authReq.user.userId);
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    res.json({ success: true, data: event });
  } catch (error) {
    console.error('[EventRoutes] Publish error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to publish event',
    });
  }
});

/**
 * POST /events/:id/cancel
 * Cancel an event
 */
router.post('/:id/cancel', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    const event = await eventService.cancel(req.params.id, authReq.user.userId);
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    res.json({ success: true, data: event });
  } catch (error) {
    console.error('[EventRoutes] Cancel error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to cancel event',
    });
  }
});

/**
 * POST /events/:id/complete
 * Mark event as completed
 */
router.post('/:id/complete', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    const event = await eventService.complete(req.params.id, authReq.user.userId);
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    res.json({ success: true, data: event });
  } catch (error) {
    console.error('[EventRoutes] Complete error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to complete event',
    });
  }
});

// =============================================================================
// Nested Speaker Endpoints
// =============================================================================

/**
 * GET /events/:id/speakers
 * Get speakers for an event
 */
router.get('/:id/speakers', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const speakers = await speakerService.listByEvent(req.params.id);
    res.json({ success: true, data: speakers });
  } catch (error) {
    console.error('[EventRoutes] Get speakers error:', error);
    res.status(500).json({ error: 'Failed to get speakers' });
  }
});

/**
 * POST /events/:id/speakers
 * Add a speaker to an event
 */
router.post('/:id/speakers', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { name, email, bio, avatarUrl, title, company } = req.body;

    if (!name) {
      res.status(400).json({ error: 'name is required' });
      return;
    }

    const speaker = await speakerService.create({
      eventId: req.params.id,
      userId: authReq.user.userId,
      name,
      email,
      bio,
      avatarUrl,
      title,
      company,
    });

    res.status(201).json({ success: true, data: speaker });
  } catch (error) {
    console.error('[EventRoutes] Add speaker error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to add speaker',
    });
  }
});

// =============================================================================
// Nested Registration Endpoints
// =============================================================================

/**
 * GET /events/:id/registrations
 * Get registrations for an event
 */
router.get('/:id/registrations', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const registrations = await registrationService.listByEvent(req.params.id);
    res.json({ success: true, data: registrations });
  } catch (error) {
    console.error('[EventRoutes] Get registrations error:', error);
    res.status(500).json({ error: 'Failed to get registrations' });
  }
});

/**
 * POST /events/:id/registrations
 * Register for an event
 */
router.post('/:id/registrations', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { attendeeName, attendeeEmail, notes } = req.body;

    if (!attendeeName || !attendeeEmail) {
      res.status(400).json({ error: 'attendeeName and attendeeEmail are required' });
      return;
    }

    const registration = await registrationService.register({
      eventId: req.params.id,
      userId: authReq.user.userId,
      attendeeName,
      attendeeEmail,
      notes,
    });

    res.status(201).json({ success: true, data: registration });
  } catch (error) {
    console.error('[EventRoutes] Register error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to register for event',
    });
  }
});

export default router;
