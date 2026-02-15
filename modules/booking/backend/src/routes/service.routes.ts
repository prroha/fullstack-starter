import { Router, Request, Response } from 'express';
import { getServiceService } from '../services/service.service';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

// =============================================================================
// Router
// =============================================================================

const router = Router();
const serviceService = getServiceService();

// =============================================================================
// Public Endpoints
// =============================================================================

/**
 * GET /services
 * List services with filtering and pagination
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, category, minPrice, maxPrice, minDuration, maxDuration, page, limit } = req.query;

    const result = await serviceService.listServices({
      search: search as string,
      categorySlug: category as string,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      minDuration: minDuration ? Number(minDuration) : undefined,
      maxDuration: maxDuration ? Number(maxDuration) : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[ServiceRoutes] List error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to list services' });
  }
});

/**
 * GET /services/categories
 * List all service categories
 */
router.get('/categories', async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await serviceService.listCategories();
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('[ServiceRoutes] Categories error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to list categories' });
  }
});

/**
 * GET /services/:slug
 * Get service details by slug (public) with providers and avgRating
 */
router.get('/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const service = await serviceService.getServiceBySlug(req.params.slug);
    if (!service) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }
    res.json({ success: true, data: service });
  } catch (error) {
    console.error('[ServiceRoutes] Get by slug error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to get service' });
  }
});

// =============================================================================
// Authenticated Endpoints (Admin)
// =============================================================================

/**
 * POST /services
 * Create a new service (admin)
 */
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { name, description, shortDescription, thumbnailUrl, price, duration, categoryIds } = req.body;

    if (!name || !description || !duration) {
      res.status(400).json({ error: 'Name, description, and duration are required' });
      return;
    }

    const service = await serviceService.createService({
      name,
      description,
      shortDescription,
      thumbnailUrl,
      price,
      duration,
      categoryIds,
      createdById: authReq.user.userId,
    });

    res.status(201).json({ success: true, data: service });
  } catch (error) {
    console.error('[ServiceRoutes] Create error:', error instanceof Error ? error.message : error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to create service',
    });
  }
});

/**
 * PATCH /services/:id
 * Update a service
 */
router.patch('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, shortDescription, thumbnailUrl, price, duration, categoryIds } = req.body;

    const service = await serviceService.updateService(req.params.id, {
      name,
      description,
      shortDescription,
      thumbnailUrl,
      price,
      duration,
      categoryIds,
    });

    if (!service) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    res.json({ success: true, data: service });
  } catch (error) {
    console.error('[ServiceRoutes] Update error:', error instanceof Error ? error.message : error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to update service',
    });
  }
});

/**
 * DELETE /services/:id
 * Delete a service
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    await serviceService.deleteService(req.params.id);
    res.json({ success: true, message: 'Service deleted' });
  } catch (error) {
    console.error('[ServiceRoutes] Delete error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

/**
 * POST /services/:id/publish
 * Publish a service
 */
router.post('/:id/publish', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const service = await serviceService.publishService(req.params.id);
    if (!service) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }
    res.json({ success: true, data: service });
  } catch (error) {
    console.error('[ServiceRoutes] Publish error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to publish service' });
  }
});

/**
 * POST /services/:id/unpublish
 * Unpublish a service
 */
router.post('/:id/unpublish', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const service = await serviceService.unpublishService(req.params.id);
    if (!service) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }
    res.json({ success: true, data: service });
  } catch (error) {
    console.error('[ServiceRoutes] Unpublish error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to unpublish service' });
  }
});

// =============================================================================
// Categories (Admin)
// =============================================================================

/**
 * POST /services/categories
 * Create a new service category
 */
router.post('/categories', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, iconName } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Category name is required' });
      return;
    }

    const category = await serviceService.createCategory({ name, description, iconName });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    console.error('[ServiceRoutes] Create category error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

export default router;
