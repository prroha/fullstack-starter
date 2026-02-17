import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import {
  getAdminController,
  hasPermission,
  Permission,
  ROLE_PERMISSIONS,
} from '../controllers/admin.controller.js';

// =============================================================================
// Types
// =============================================================================

interface AuthenticatedRequest extends FastifyRequest {
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
export async function requireAdminOrManager(
  req: AuthenticatedRequest,
  reply: FastifyReply
) {
  const user = req.user;
  const dbUser = req.dbUser;

  if (!user || !dbUser) {
    return reply.code(401).send({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
  }

  const role = dbUser.role;
  if (role !== 'ADMIN' && role !== 'MANAGER') {
    return reply.code(403).send({
      error: 'Admin or Manager access required',
      code: 'INSUFFICIENT_ROLE',
    });
  }
}

/**
 * Middleware to check if user is an admin (full access)
 * Assumes authentication middleware has already run and attached user to request
 */
export async function requireAdmin(
  req: AuthenticatedRequest,
  reply: FastifyReply
) {
  const user = req.user;
  const dbUser = req.dbUser;

  if (!user || !dbUser) {
    return reply.code(401).send({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
  }

  if (dbUser.role !== 'ADMIN') {
    return reply.code(403).send({ error: 'Admin access required', code: 'ADMIN_REQUIRED' });
  }
}

/**
 * Factory to create permission check middleware
 * @param permission - The permission to check
 * @returns Fastify preHandler function
 */
export function requirePermission(permission: Permission) {
  return async function (req: AuthenticatedRequest, reply: FastifyReply) {
    const user = req.user;
    const dbUser = req.dbUser;

    if (!user || !dbUser) {
      return reply.code(401).send({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
    }

    const role = dbUser.role;

    if (!hasPermission(role, permission)) {
      return reply.code(403).send({
        error: `Permission denied: ${permission}`,
        code: 'PERMISSION_DENIED',
        requiredPermission: permission,
        userRole: role,
      });
    }
  };
}

/**
 * Factory to create middleware that requires any of the specified permissions
 * @param permissions - Array of permissions (user needs at least one)
 * @returns Fastify preHandler function
 */
export function requireAnyPermission(permissions: Permission[]) {
  return async function (req: AuthenticatedRequest, reply: FastifyReply) {
    const user = req.user;
    const dbUser = req.dbUser;

    if (!user || !dbUser) {
      return reply.code(401).send({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
    }

    const role = dbUser.role;
    const hasAny = permissions.some((permission) => hasPermission(role, permission));

    if (!hasAny) {
      return reply.code(403).send({
        error: 'Permission denied',
        code: 'PERMISSION_DENIED',
        requiredPermissions: permissions,
        userRole: role,
      });
    }
  };
}

/**
 * Factory to create middleware that requires all specified permissions
 * @param permissions - Array of permissions (user needs all)
 * @returns Fastify preHandler function
 */
export function requireAllPermissions(permissions: Permission[]) {
  return async function (req: AuthenticatedRequest, reply: FastifyReply) {
    const user = req.user;
    const dbUser = req.dbUser;

    if (!user || !dbUser) {
      return reply.code(401).send({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
    }

    const role = dbUser.role;
    const missingPermissions = permissions.filter(
      (permission) => !hasPermission(role, permission)
    );

    if (missingPermissions.length > 0) {
      return reply.code(403).send({
        error: 'Permission denied',
        code: 'PERMISSION_DENIED',
        missingPermissions,
        userRole: role,
      });
    }
  };
}

// =============================================================================
// Helper: Get user permissions endpoint
// =============================================================================

function getUserPermissions(req: AuthenticatedRequest, reply: FastifyReply) {
  const dbUser = req.dbUser;

  if (!dbUser) {
    return reply.code(401).send({ error: 'Authentication required' });
  }

  const permissions = ROLE_PERMISSIONS[dbUser.role] || [];

  return reply.send({
    success: true,
    role: dbUser.role,
    permissions,
  });
}

// =============================================================================
// Plugin Factory
// =============================================================================

/**
 * Create admin routes with Prisma client
 */
export function createAdminRoutes(prisma: PrismaClient): FastifyPluginAsync {
  const routes: FastifyPluginAsync = async (fastify) => {
    const controller = getAdminController(prisma);

    // Apply basic admin/manager check to all routes
    fastify.addHook('preHandler', requireAdminOrManager);

    // ===========================================================================
    // Permissions
    // ===========================================================================

    /**
     * GET /admin/permissions
     * Get current user's permissions
     */
    fastify.get('/permissions', async (req: FastifyRequest, reply: FastifyReply) =>
      getUserPermissions(req as AuthenticatedRequest, reply)
    );

    // ===========================================================================
    // Dashboard
    // ===========================================================================

    /**
     * GET /admin/stats
     * Get dashboard statistics
     * Required permission: stats:read
     */
    fastify.get('/stats', { preHandler: [requirePermission('stats:read')] }, async (req, reply) =>
      controller.getStats(req, reply)
    );

    /**
     * GET /admin/activity
     * Get recent activity
     * Required permission: activity:read
     */
    fastify.get('/activity', { preHandler: [requirePermission('activity:read')] }, async (req, reply) =>
      controller.getRecentActivity(req, reply)
    );

    // ===========================================================================
    // User Management
    // ===========================================================================

    /**
     * GET /admin/users
     * List users with pagination
     * Required permission: users:read
     */
    fastify.get('/users', { preHandler: [requirePermission('users:read')] }, async (req, reply) =>
      controller.listUsers(req, reply)
    );

    /**
     * GET /admin/users/:id
     * Get single user
     * Required permission: users:read
     */
    fastify.get('/users/:id', { preHandler: [requirePermission('users:read')] }, async (req, reply) =>
      controller.getUser(req, reply)
    );

    /**
     * PATCH /admin/users/:id
     * Update user
     * Required permission: users:update
     * Note: Role changes require users:manage_roles permission
     */
    fastify.patch(
      '/users/:id',
      {
        preHandler: [
          requirePermission('users:update'),
          async (req: AuthenticatedRequest, reply: FastifyReply) => {
            // Additional check: role changes require manage_roles permission
            if ((req.body as Record<string, unknown>)?.role !== undefined) {
              const dbUser = req.dbUser;
              if (!dbUser || !hasPermission(dbUser.role, 'users:manage_roles')) {
                return reply.code(403).send({
                  error: 'Permission denied: cannot change user roles',
                  code: 'PERMISSION_DENIED',
                  requiredPermission: 'users:manage_roles',
                });
              }
            }
          },
        ],
      },
      async (req, reply) => controller.updateUser(req, reply)
    );

    /**
     * DELETE /admin/users/:id
     * Delete user
     * Required permission: users:delete (ADMIN only)
     */
    fastify.delete('/users/:id', { preHandler: [requirePermission('users:delete')] }, async (req, reply) =>
      controller.deleteUser(req, reply)
    );

    // ===========================================================================
    // Settings
    // ===========================================================================

    /**
     * GET /admin/settings
     * Get system settings
     * Required permission: settings:read
     */
    fastify.get('/settings', { preHandler: [requirePermission('settings:read')] }, async (req, reply) =>
      controller.getSettings(req, reply)
    );

    /**
     * PUT /admin/settings
     * Update system settings
     * Required permission: settings:update (ADMIN only)
     */
    fastify.put('/settings', { preHandler: [requirePermission('settings:update')] }, async (req, reply) =>
      controller.updateSettings(req, reply)
    );

    /**
     * GET /admin/settings/:key
     * Get a specific setting
     * Required permission: settings:read
     */
    fastify.get('/settings/:key', { preHandler: [requirePermission('settings:read')] }, async (req, reply) =>
      controller.getSetting(req, reply)
    );

    /**
     * PUT /admin/settings/:key
     * Update a specific setting
     * Required permission: settings:update (ADMIN only)
     */
    fastify.put('/settings/:key', { preHandler: [requirePermission('settings:update')] }, async (req, reply) =>
      controller.updateSetting(req, reply)
    );

    /**
     * DELETE /admin/settings/:key
     * Reset a setting to default
     * Required permission: settings:update (ADMIN only)
     */
    fastify.delete('/settings/:key', { preHandler: [requirePermission('settings:update')] }, async (req, reply) =>
      controller.resetSetting(req, reply)
    );
  };

  return routes;
}

export default createAdminRoutes;
