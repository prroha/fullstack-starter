import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  getAdminController,
  hasPermission,
  Permission,
  ROLE_PERMISSIONS,
} from '../controllers/admin.controller';

// =============================================================================
// Types
// =============================================================================

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    userId: string;
    email: string;
    role: string;
  };
  dbUser?: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    isActive: boolean;
  };
}

// =============================================================================
// Permission Middleware
// =============================================================================

/**
 * Middleware to check if user has admin or manager role
 * Assumes authentication middleware has already run and attached user to request
 */
export function requireAdminOrManager(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const user = req.user;
  const dbUser = req.dbUser;

  if (!user || !dbUser) {
    res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
    return;
  }

  const role = dbUser.role;
  if (role !== 'ADMIN' && role !== 'MANAGER') {
    res.status(403).json({
      error: 'Admin or Manager access required',
      code: 'INSUFFICIENT_ROLE',
    });
    return;
  }

  next();
}

/**
 * Middleware to check if user is an admin (full access)
 * Assumes authentication middleware has already run and attached user to request
 */
export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const user = req.user;
  const dbUser = req.dbUser;

  if (!user || !dbUser) {
    res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
    return;
  }

  if (dbUser.role !== 'ADMIN') {
    res.status(403).json({ error: 'Admin access required', code: 'ADMIN_REQUIRED' });
    return;
  }

  next();
}

/**
 * Factory to create permission check middleware
 * @param permission - The permission to check
 * @returns Express middleware function
 */
export function requirePermission(permission: Permission) {
  return function (req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    const user = req.user;
    const dbUser = req.dbUser;

    if (!user || !dbUser) {
      res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
      return;
    }

    const role = dbUser.role;

    if (!hasPermission(role, permission)) {
      res.status(403).json({
        error: `Permission denied: ${permission}`,
        code: 'PERMISSION_DENIED',
        requiredPermission: permission,
        userRole: role,
      });
      return;
    }

    next();
  };
}

/**
 * Factory to create middleware that requires any of the specified permissions
 * @param permissions - Array of permissions (user needs at least one)
 * @returns Express middleware function
 */
export function requireAnyPermission(permissions: Permission[]) {
  return function (req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    const user = req.user;
    const dbUser = req.dbUser;

    if (!user || !dbUser) {
      res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
      return;
    }

    const role = dbUser.role;
    const hasAny = permissions.some((permission) => hasPermission(role, permission));

    if (!hasAny) {
      res.status(403).json({
        error: 'Permission denied',
        code: 'PERMISSION_DENIED',
        requiredPermissions: permissions,
        userRole: role,
      });
      return;
    }

    next();
  };
}

/**
 * Factory to create middleware that requires all specified permissions
 * @param permissions - Array of permissions (user needs all)
 * @returns Express middleware function
 */
export function requireAllPermissions(permissions: Permission[]) {
  return function (req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    const user = req.user;
    const dbUser = req.dbUser;

    if (!user || !dbUser) {
      res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
      return;
    }

    const role = dbUser.role;
    const missingPermissions = permissions.filter(
      (permission) => !hasPermission(role, permission)
    );

    if (missingPermissions.length > 0) {
      res.status(403).json({
        error: 'Permission denied',
        code: 'PERMISSION_DENIED',
        missingPermissions,
        userRole: role,
      });
      return;
    }

    next();
  };
}

// =============================================================================
// Helper: Get user permissions endpoint
// =============================================================================

function getUserPermissions(req: AuthenticatedRequest, res: Response): void {
  const dbUser = req.dbUser;

  if (!dbUser) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const permissions = ROLE_PERMISSIONS[dbUser.role] || [];

  res.json({
    success: true,
    role: dbUser.role,
    permissions,
  });
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

  // Apply basic admin/manager check to all routes
  router.use(requireAdminOrManager);

  // ===========================================================================
  // Permissions
  // ===========================================================================

  /**
   * GET /admin/permissions
   * Get current user's permissions
   */
  router.get('/permissions', getUserPermissions);

  // ===========================================================================
  // Dashboard
  // ===========================================================================

  /**
   * GET /admin/stats
   * Get dashboard statistics
   * Required permission: stats:read
   */
  router.get('/stats', requirePermission('stats:read'), (req, res) =>
    controller.getStats(req, res)
  );

  /**
   * GET /admin/activity
   * Get recent activity
   * Required permission: activity:read
   */
  router.get('/activity', requirePermission('activity:read'), (req, res) =>
    controller.getRecentActivity(req, res)
  );

  // ===========================================================================
  // User Management
  // ===========================================================================

  /**
   * GET /admin/users
   * List users with pagination
   * Required permission: users:read
   */
  router.get('/users', requirePermission('users:read'), (req, res) =>
    controller.listUsers(req, res)
  );

  /**
   * GET /admin/users/:id
   * Get single user
   * Required permission: users:read
   */
  router.get('/users/:id', requirePermission('users:read'), (req, res) =>
    controller.getUser(req, res)
  );

  /**
   * PATCH /admin/users/:id
   * Update user
   * Required permission: users:update
   * Note: Role changes require users:manage_roles permission
   */
  router.patch(
    '/users/:id',
    requirePermission('users:update'),
    (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      // Additional check: role changes require manage_roles permission
      if (req.body.role !== undefined) {
        const dbUser = req.dbUser;
        if (!dbUser || !hasPermission(dbUser.role, 'users:manage_roles')) {
          res.status(403).json({
            error: 'Permission denied: cannot change user roles',
            code: 'PERMISSION_DENIED',
            requiredPermission: 'users:manage_roles',
          });
          return;
        }
      }
      next();
    },
    (req, res) => controller.updateUser(req, res)
  );

  /**
   * DELETE /admin/users/:id
   * Delete user
   * Required permission: users:delete (ADMIN only)
   */
  router.delete('/users/:id', requirePermission('users:delete'), (req, res) =>
    controller.deleteUser(req, res)
  );

  // ===========================================================================
  // Settings
  // ===========================================================================

  /**
   * GET /admin/settings
   * Get system settings
   * Required permission: settings:read
   */
  router.get('/settings', requirePermission('settings:read'), (req, res) =>
    controller.getSettings(req, res)
  );

  /**
   * PUT /admin/settings
   * Update system settings
   * Required permission: settings:update (ADMIN only)
   */
  router.put('/settings', requirePermission('settings:update'), (req, res) =>
    controller.updateSettings(req, res)
  );

  /**
   * GET /admin/settings/:key
   * Get a specific setting
   * Required permission: settings:read
   */
  router.get('/settings/:key', requirePermission('settings:read'), (req, res) =>
    controller.getSetting(req, res)
  );

  /**
   * PUT /admin/settings/:key
   * Update a specific setting
   * Required permission: settings:update (ADMIN only)
   */
  router.put('/settings/:key', requirePermission('settings:update'), (req, res) =>
    controller.updateSetting(req, res)
  );

  /**
   * DELETE /admin/settings/:key
   * Reset a setting to default
   * Required permission: settings:update (ADMIN only)
   */
  router.delete('/settings/:key', requirePermission('settings:update'), (req, res) =>
    controller.resetSetting(req, res)
  );

  return router;
}

export default createAdminRoutes;
