import { Router, Request, Response } from 'express';
import { getCategoryService } from '../services/category.service';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

// =============================================================================
// Router
// =============================================================================

const router = Router();
const categoryService = getCategoryService();

// =============================================================================
// Category Endpoints (All Authenticated)
// =============================================================================

/**
 * GET /categories
 * List all categories
 */
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    const { search, isActive, parentId, page, limit } = req.query;

    const categories = await categoryService.list(authReq.user.userId, {
      search: search as string,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      parentId: parentId as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
    });
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('[CategoryRoutes] List error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to list categories' });
  }
});

/**
 * GET /categories/:id
 * Get category by ID
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    const category = await categoryService.getById(req.params.id, authReq.user.userId);
    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    res.json({ success: true, data: category });
  } catch (error) {
    console.error('[CategoryRoutes] Get error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to get category' });
  }
});

/**
 * POST /categories
 * Create a new category
 */
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { name, description, color, parentId } = req.body;

    if (!name) {
      res.status(400).json({ error: 'name is required' });
      return;
    }

    const category = await categoryService.create({
      userId: authReq.user.userId,
      name,
      description,
      color,
      parentId,
    });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    console.error('[CategoryRoutes] Create error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to create category',
    });
  }
});

/**
 * PATCH /categories/:id
 * Update a category
 */
router.patch('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { name, description, color, parentId } = req.body;

    const category = await categoryService.update(req.params.id, authReq.user.userId, {
      name,
      description,
      color,
      parentId,
    });

    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    res.json({ success: true, data: category });
  } catch (error) {
    console.error('[CategoryRoutes] Update error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to update category',
    });
  }
});

/**
 * DELETE /categories/:id
 * Delete a category
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    await categoryService.delete(req.params.id, authReq.user.userId);
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    console.error('[CategoryRoutes] Delete error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to delete category',
    });
  }
});

/**
 * POST /categories/reorder
 * Reorder categories by providing an ordered array of IDs
 */
router.post('/reorder', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: 'ids must be a non-empty array' });
      return;
    }

    const updates = ids.map((id: string, index: number) => ({ id, sortOrder: index + 1 }));
    await categoryService.reorder(authReq.user.userId, updates);
    res.json({ success: true, message: 'Categories reordered' });
  } catch (error) {
    console.error('[CategoryRoutes] Reorder error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to reorder categories',
    });
  }
});

/**
 * POST /categories/:id/toggle-active
 * Toggle category active status
 */
router.post('/:id/toggle-active', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    const category = await categoryService.toggleActive(req.params.id, authReq.user.userId);
    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    res.json({ success: true, data: category });
  } catch (error) {
    console.error('[CategoryRoutes] Toggle active error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to toggle category status',
    });
  }
});

export default router;
