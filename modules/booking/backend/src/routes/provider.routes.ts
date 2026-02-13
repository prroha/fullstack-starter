import { Router, Request, Response } from 'express';
import { getProviderService } from '../services/provider.service';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

// =============================================================================
// Router
// =============================================================================

const router = Router();
const providerService = getProviderService();

// =============================================================================
// Public Endpoints
// =============================================================================

/**
 * GET /providers
 * List active providers
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit } = req.query;

    const result = await providerService.listProviders({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[ProviderRoutes] List error:', error);
    res.status(500).json({ error: 'Failed to list providers' });
  }
});

/**
 * GET /providers/:id
 * Get provider profile with services and rating
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const provider = await providerService.getProviderById(req.params.id);
    if (!provider) {
      res.status(404).json({ error: 'Provider not found' });
      return;
    }
    res.json({ success: true, data: provider });
  } catch (error) {
    console.error('[ProviderRoutes] Get by id error:', error);
    res.status(500).json({ error: 'Failed to get provider' });
  }
});

/**
 * GET /providers/:id/availability
 * Get available time slots for a specific provider, service, and date
 */
router.get('/:id/availability', async (req: Request, res: Response): Promise<void> => {
  try {
    const { serviceId, date } = req.query;

    if (!serviceId || !date) {
      res.status(400).json({ error: 'serviceId and date are required' });
      return;
    }

    const slots = await providerService.getAvailability(
      req.params.id,
      serviceId as string,
      date as string,
    );

    res.json({ success: true, data: slots });
  } catch (error) {
    console.error('[ProviderRoutes] Availability error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get availability',
    });
  }
});

// =============================================================================
// Authenticated Endpoints
// =============================================================================

/**
 * POST /providers
 * Create a provider profile
 */
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { bio, specialties, avatarUrl, phone, location } = req.body;

    const provider = await providerService.createProvider({
      userId: authReq.user.userId,
      bio,
      specialties,
      avatarUrl,
      phone,
      location,
    });

    res.status(201).json({ success: true, data: provider });
  } catch (error) {
    console.error('[ProviderRoutes] Create error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to create provider profile',
    });
  }
});

/**
 * PATCH /providers/:id
 * Update a provider profile
 */
router.patch('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { bio, specialties, avatarUrl, phone, location } = req.body;

    const provider = await providerService.updateProvider(req.params.id, {
      bio,
      specialties,
      avatarUrl,
      phone,
      location,
    });

    if (!provider) {
      res.status(404).json({ error: 'Provider not found' });
      return;
    }

    res.json({ success: true, data: provider });
  } catch (error) {
    console.error('[ProviderRoutes] Update error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to update provider profile',
    });
  }
});

/**
 * POST /providers/:id/services
 * Link a service to a provider
 */
router.post('/:id/services', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { serviceId } = req.body;

    if (!serviceId) {
      res.status(400).json({ error: 'serviceId is required' });
      return;
    }

    const result = await providerService.linkService(req.params.id, serviceId);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('[ProviderRoutes] Link service error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to link service',
    });
  }
});

/**
 * DELETE /providers/:id/services/:serviceId
 * Unlink a service from a provider
 */
router.delete('/:id/services/:serviceId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    await providerService.unlinkService(req.params.id, req.params.serviceId);
    res.json({ success: true, message: 'Service unlinked from provider' });
  } catch (error) {
    console.error('[ProviderRoutes] Unlink service error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to unlink service',
    });
  }
});

export default router;
