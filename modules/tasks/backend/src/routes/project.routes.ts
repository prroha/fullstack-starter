import { Router, Request, Response } from 'express';
import { getProjectService } from '../services/project.service';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

// =============================================================================
// Router
// =============================================================================

const router = Router();
const projectService = getProjectService();

// =============================================================================
// Project Endpoints (All Authenticated)
// =============================================================================

/**
 * GET /projects
 * List all projects for the authenticated user
 */
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const includeArchived = req.query.includeArchived === 'true';

    const projects = await projectService.list(authReq.user.userId, includeArchived);
    res.json({ success: true, data: projects });
  } catch (error) {
    console.error('[ProjectRoutes] List error:', error);
    res.status(500).json({ error: 'Failed to list projects' });
  }
});

/**
 * POST /projects/reorder
 * Reorder projects
 * MUST be before /:id routes to avoid matching "reorder" as an ID
 */
router.post('/reorder', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { ids } = req.body;

    if (!Array.isArray(ids)) {
      res.status(400).json({ error: 'ids array is required' });
      return;
    }

    await projectService.reorder(authReq.user.userId, ids);
    res.json({ success: true, message: 'Projects reordered' });
  } catch (error) {
    console.error('[ProjectRoutes] Reorder error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to reorder projects',
    });
  }
});

/**
 * GET /projects/:id
 * Get project by ID
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    const project = await projectService.getById(req.params.id, authReq.user.userId);
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json({ success: true, data: project });
  } catch (error) {
    console.error('[ProjectRoutes] Get error:', error);
    res.status(500).json({ error: 'Failed to get project' });
  }
});

/**
 * GET /projects/:id/stats
 * Get stats for a specific project
 */
router.get('/:id/stats', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    const stats = await projectService.getStats(req.params.id, authReq.user.userId);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('[ProjectRoutes] Stats error:', error);
    res.status(500).json({ error: 'Failed to get project stats' });
  }
});

/**
 * POST /projects
 * Create a new project
 */
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { name, description, color, icon } = req.body;

    if (!name) {
      res.status(400).json({ error: 'name is required' });
      return;
    }

    const project = await projectService.create({
      userId: authReq.user.userId,
      name,
      description,
      color,
      icon,
    });

    res.status(201).json({ success: true, data: project });
  } catch (error) {
    console.error('[ProjectRoutes] Create error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to create project',
    });
  }
});

/**
 * PATCH /projects/:id
 * Update a project
 */
router.patch('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { name, description, color, icon } = req.body;

    const project = await projectService.update(req.params.id, authReq.user.userId, {
      name,
      description,
      color,
      icon,
    });

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    res.json({ success: true, data: project });
  } catch (error) {
    console.error('[ProjectRoutes] Update error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to update project',
    });
  }
});

/**
 * DELETE /projects/:id
 * Delete a project
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    await projectService.delete(req.params.id, authReq.user.userId);
    res.json({ success: true, message: 'Project deleted' });
  } catch (error) {
    console.error('[ProjectRoutes] Delete error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to delete project',
    });
  }
});

/**
 * POST /projects/:id/archive
 * Archive a project
 */
router.post('/:id/archive', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    const project = await projectService.archive(req.params.id, authReq.user.userId);
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json({ success: true, data: project });
  } catch (error) {
    console.error('[ProjectRoutes] Archive error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to archive project',
    });
  }
});

/**
 * POST /projects/:id/unarchive
 * Unarchive a project
 */
router.post('/:id/unarchive', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    const project = await projectService.unarchive(req.params.id, authReq.user.userId);
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json({ success: true, data: project });
  } catch (error) {
    console.error('[ProjectRoutes] Unarchive error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to unarchive project',
    });
  }
});

export default router;
