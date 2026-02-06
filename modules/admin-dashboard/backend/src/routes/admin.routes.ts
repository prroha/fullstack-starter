import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { getAdminController } from '../controllers/admin.controller';

// =============================================================================
// Types
// =============================================================================

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// =============================================================================
// Admin Middleware
// =============================================================================

/**
 * Middleware to check if user is an admin
 * Assumes authentication middleware has already run and attached user to request
 */
export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const user = req.user;

  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  next();
}

// =============================================================================
// Router Factory
// =============================================================================

/**
 * Create admin routes with Prisma client
 */
export function createAdminRoutes(prisma: PrismaClient): Router {
  const router = Router();
  const controller = getAdminController(prisma);

  // Apply admin check to all routes
  router.use(requireAdmin);

  // ===========================================================================
  // Dashboard
  // ===========================================================================

  /**
   * GET /admin/stats
   * Get dashboard statistics
   */
  router.get('/stats', (req, res) => controller.getStats(req, res));

  /**
   * GET /admin/activity
   * Get recent activity
   */
  router.get('/activity', (req, res) => controller.getRecentActivity(req, res));

  // ===========================================================================
  // User Management
  // ===========================================================================

  /**
   * GET /admin/users
   * List users with pagination
   */
  router.get('/users', (req, res) => controller.listUsers(req, res));

  /**
   * GET /admin/users/:id
   * Get single user
   */
  router.get('/users/:id', (req, res) => controller.getUser(req, res));

  /**
   * PATCH /admin/users/:id
   * Update user
   */
  router.patch('/users/:id', (req, res) => controller.updateUser(req, res));

  /**
   * DELETE /admin/users/:id
   * Delete user
   */
  router.delete('/users/:id', (req, res) => controller.deleteUser(req, res));

  // ===========================================================================
  // Settings
  // ===========================================================================

  /**
   * GET /admin/settings
   * Get system settings
   */
  router.get('/settings', (req, res) => controller.getSettings(req, res));

  /**
   * PUT /admin/settings
   * Update system settings
   */
  router.put('/settings', (req, res) => controller.updateSettings(req, res));

  return router;
}

export default createAdminRoutes;
