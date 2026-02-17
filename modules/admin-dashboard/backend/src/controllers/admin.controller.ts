import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient, Prisma, UserRole } from '@prisma/client';

// =============================================================================
// Types
// =============================================================================

export interface PaginationQuery {
  page?: string;
  limit?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UserListQuery extends PaginationQuery {
  role?: string;
  status?: string;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  usersByRole: Record<string, number>;
}

export interface SystemSettings {
  appName: string;
  supportEmail: string;
  maintenanceMode: boolean;
  allowRegistration: boolean;
  requireEmailVerification: boolean;
  maxLoginAttempts: number;
  sessionTimeout: number;
  [key: string]: string | boolean | number;
}

export interface ActivityEntry {
  id: string;
  type: ActivityType;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  metadata: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export type ActivityType =
  | 'user_created'
  | 'user_updated'
  | 'user_deleted'
  | 'user_role_changed'
  | 'user_deactivated'
  | 'user_reactivated'
  | 'settings_updated'
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'password_changed'
  | 'admin_action';

// Permission types for RBAC
export type Permission =
  | 'users:read'
  | 'users:create'
  | 'users:update'
  | 'users:delete'
  | 'users:manage_roles'
  | 'settings:read'
  | 'settings:update'
  | 'activity:read'
  | 'stats:read';

// Role permissions mapping
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  ADMIN: [
    'users:read',
    'users:create',
    'users:update',
    'users:delete',
    'users:manage_roles',
    'settings:read',
    'settings:update',
    'activity:read',
    'stats:read',
  ],
  MANAGER: [
    'users:read',
    'users:update',
    'settings:read',
    'activity:read',
    'stats:read',
  ],
  USER: [],
};

// Default settings
const DEFAULT_SETTINGS: SystemSettings = {
  appName: 'My App',
  supportEmail: 'support@example.com',
  maintenanceMode: false,
  allowRegistration: true,
  requireEmailVerification: false,
  maxLoginAttempts: 5,
  sessionTimeout: 3600,
};

// In-memory settings store (for persistence without schema changes)
// In production, this should be backed by a database table
let settingsStore: SystemSettings = { ...DEFAULT_SETTINGS };

// In-memory activity log store
// In production, this should be backed by a database table
const activityLog: ActivityEntry[] = [];
const MAX_ACTIVITY_LOG_SIZE = 1000;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: string, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: string): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Log an activity entry
 */
function logActivity(entry: Omit<ActivityEntry, 'id' | 'timestamp'>): void {
  const activityEntry: ActivityEntry = {
    ...entry,
    id: generateId(),
    timestamp: new Date(),
  };

  activityLog.unshift(activityEntry);

  // Keep the log size bounded
  if (activityLog.length > MAX_ACTIVITY_LOG_SIZE) {
    activityLog.pop();
  }

  console.log('[AdminController] Activity logged:', activityEntry.type, activityEntry.action);
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// =============================================================================
// Admin Controller
// =============================================================================

export class AdminController {
  constructor(private prisma: PrismaClient) {}

  // ===========================================================================
  // Dashboard
  // ===========================================================================

  /**
   * GET /admin/stats
   * Get dashboard statistics
   */
  async getStats(_req: FastifyRequest, reply: FastifyReply) {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalUsers, activeUsers, newToday, newThisWeek, newThisMonth, usersByRole] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({
          where: {
            updatedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        }),
        this.prisma.user.count({
          where: { createdAt: { gte: startOfDay } },
        }),
        this.prisma.user.count({
          where: { createdAt: { gte: startOfWeek } },
        }),
        this.prisma.user.count({
          where: { createdAt: { gte: startOfMonth } },
        }),
        this.prisma.user.groupBy({
          by: ['role'],
          _count: { id: true },
        }),
      ]);

    const roleStats: Record<string, number> = {};
    for (const entry of usersByRole) {
      roleStats[entry.role] = entry._count.id;
    }

    const stats: DashboardStats = {
      totalUsers,
      activeUsers,
      newUsersToday: newToday,
      newUsersThisWeek: newThisWeek,
      newUsersThisMonth: newThisMonth,
      usersByRole: roleStats,
    };

    return reply.send({ success: true, stats });
  }

  /**
   * GET /admin/activity
   * Get recent activity/audit log
   */
  async getRecentActivity(req: FastifyRequest, reply: FastifyReply) {
    const query = req.query as { limit?: string; offset?: string; type?: ActivityType };
    const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 20));
    const offset = Math.max(0, parseInt(query.offset as string) || 0);
    const type = query.type as ActivityType | undefined;

    let filteredActivity = activityLog;

    if (type) {
      filteredActivity = activityLog.filter((a) => a.type === type);
    }

    const paginatedActivity = filteredActivity.slice(offset, offset + limit);

    // If activity log is empty, fall back to user-based activity
    if (activityLog.length === 0) {
      const recentUsers = await this.prisma.user.findMany({
        take: limit,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const fallbackActivity = recentUsers.map((user) => ({
        id: user.id,
        type: (user.createdAt.getTime() === user.updatedAt.getTime()
          ? 'user_created'
          : 'user_updated') as ActivityType,
        action:
          user.createdAt.getTime() === user.updatedAt.getTime()
            ? 'User registered'
            : 'User profile updated',
        entityType: 'user',
        entityId: user.id,
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        metadata: {},
        timestamp: user.updatedAt,
      }));

      return reply.send({
        success: true,
        activity: fallbackActivity,
        pagination: {
          total: recentUsers.length,
          limit,
          offset: 0,
        },
      });
    }

    return reply.send({
      success: true,
      activity: paginatedActivity,
      pagination: {
        total: filteredActivity.length,
        limit,
        offset,
      },
    });
  }

  // ===========================================================================
  // User Management
  // ===========================================================================

  /**
   * GET /admin/users
   * List users with pagination and filtering
   */
  async listUsers(req: FastifyRequest, reply: FastifyReply) {
    const {
      page = '1',
      limit = '20',
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      role,
    } = req.query as UserListQuery;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role as UserRole;
    }

    // Get users and total count
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return reply.send({
      success: true,
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1,
      },
    });
  }

  /**
   * GET /admin/users/:id
   * Get single user details
   */
  async getUser(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };

    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        emailVerified: true,
        authProvider: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }

    return reply.send({ success: true, user });
  }

  /**
   * PATCH /admin/users/:id
   * Update user
   */
  async updateUser(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const { name, role, isActive } = req.body as { name?: string; role?: string; isActive?: boolean };
    const currentUser = (req as FastifyRequest & { user?: { userId: string; email: string } }).user;

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return reply.code(404).send({ error: 'User not found' });
    }

    // Build update data
    const updateData: Prisma.UserUpdateInput = {};
    const changes: string[] = [];

    if (name !== undefined && name !== existingUser.name) {
      updateData.name = name;
      changes.push(`name changed from "${existingUser.name}" to "${name}"`);
    }

    if (role !== undefined && role !== existingUser.role) {
      updateData.role = role as UserRole;
      changes.push(`role changed from "${existingUser.role}" to "${role}"`);
    }

    if (isActive !== undefined && isActive !== existingUser.isActive) {
      updateData.isActive = isActive;
      changes.push(isActive ? 'account reactivated' : 'account deactivated');
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Log activity
    if (changes.length > 0) {
      const activityType: ActivityType =
        role !== undefined && role !== existingUser.role
          ? 'user_role_changed'
          : isActive === false
            ? 'user_deactivated'
            : isActive === true && !existingUser.isActive
              ? 'user_reactivated'
              : 'user_updated';

      logActivity({
        type: activityType,
        action: `User ${existingUser.email} updated: ${changes.join(', ')}`,
        entityType: 'user',
        entityId: id,
        userId: currentUser?.userId || 'system',
        userEmail: currentUser?.email || 'system',
        userName: null,
        metadata: {
          targetUserId: id,
          targetUserEmail: existingUser.email,
          changes,
          oldValues: {
            name: existingUser.name,
            role: existingUser.role,
            isActive: existingUser.isActive,
          },
          newValues: {
            name: name ?? existingUser.name,
            role: role ?? existingUser.role,
            isActive: isActive ?? existingUser.isActive,
          },
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }

    return reply.send({ success: true, user });
  }

  /**
   * DELETE /admin/users/:id
   * Delete user
   */
  async deleteUser(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const currentUser = (req as FastifyRequest & { user?: { userId: string; email: string } }).user;

    // Prevent self-deletion
    const currentUserId = currentUser?.userId;
    if (id === currentUserId) {
      return reply.code(400).send({ error: 'Cannot delete your own account' });
    }

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }

    await this.prisma.user.delete({ where: { id } });

    // Log activity
    logActivity({
      type: 'user_deleted',
      action: `User ${user.email} deleted`,
      entityType: 'user',
      entityId: id,
      userId: currentUser?.userId || 'system',
      userEmail: currentUser?.email || 'system',
      userName: null,
      metadata: {
        deletedUser: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return reply.send({ success: true, message: 'User deleted' });
  }

  // ===========================================================================
  // System Settings
  // ===========================================================================

  /**
   * GET /admin/settings
   * Get system settings
   */
  async getSettings(_req: FastifyRequest, reply: FastifyReply) {
    // Merge environment variables with stored settings
    const settings: SystemSettings = {
      ...DEFAULT_SETTINGS,
      ...settingsStore,
      // Environment overrides (read-only)
      appName: process.env.APP_NAME || settingsStore.appName,
      supportEmail: process.env.SUPPORT_EMAIL || settingsStore.supportEmail,
    };

    return reply.send({ success: true, settings });
  }

  /**
   * PUT /admin/settings
   * Update system settings
   */
  async updateSettings(req: FastifyRequest, reply: FastifyReply) {
    const { settings: newSettings } = req.body as { settings: Record<string, unknown> };
    const currentUser = (req as FastifyRequest & { user?: { userId: string; email: string } }).user;

    if (!newSettings || typeof newSettings !== 'object') {
      return reply.code(400).send({ error: 'Invalid settings data' });
    }

    // Track changes
    const changes: Array<{ key: string; oldValue: unknown; newValue: unknown }> = [];

    // Validate and update settings
    const allowedKeys: Array<keyof SystemSettings> = [
      'appName',
      'supportEmail',
      'maintenanceMode',
      'allowRegistration',
      'requireEmailVerification',
      'maxLoginAttempts',
      'sessionTimeout',
    ];

    for (const key of allowedKeys) {
      if (newSettings[key] !== undefined && newSettings[key] !== settingsStore[key]) {
        changes.push({
          key,
          oldValue: settingsStore[key],
          newValue: newSettings[key],
        });
        settingsStore[key] = newSettings[key] as string | boolean | number;
      }
    }

    // Log activity
    if (changes.length > 0) {
      logActivity({
        type: 'settings_updated',
        action: `System settings updated: ${changes.map((c) => c.key).join(', ')}`,
        entityType: 'settings',
        entityId: 'system',
        userId: currentUser?.userId || 'system',
        userEmail: currentUser?.email || 'system',
        userName: null,
        metadata: { changes },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }

    return reply.send({
      success: true,
      message: 'Settings updated',
      settings: settingsStore,
      changesApplied: changes.length,
    });
  }

  /**
   * GET /admin/settings/:key
   * Get a specific setting
   */
  async getSetting(req: FastifyRequest, reply: FastifyReply) {
    const { key } = req.params as { key: string };

    if (!(key in settingsStore)) {
      return reply.code(404).send({ error: 'Setting not found' });
    }

    return reply.send({
      success: true,
      key,
      value: settingsStore[key as keyof SystemSettings],
    });
  }

  /**
   * PUT /admin/settings/:key
   * Update a specific setting
   */
  async updateSetting(req: FastifyRequest, reply: FastifyReply) {
    const { key } = req.params as { key: string };
    const { value } = req.body as { value: unknown };
    const currentUser = (req as FastifyRequest & { user?: { userId: string; email: string } }).user;

    const allowedKeys: Array<keyof SystemSettings> = [
      'appName',
      'supportEmail',
      'maintenanceMode',
      'allowRegistration',
      'requireEmailVerification',
      'maxLoginAttempts',
      'sessionTimeout',
    ];

    if (!allowedKeys.includes(key as keyof SystemSettings)) {
      return reply.code(400).send({ error: 'Invalid setting key' });
    }

    const oldValue = settingsStore[key as keyof SystemSettings];
    settingsStore[key as keyof SystemSettings] = value as string | boolean | number;

    // Log activity
    logActivity({
      type: 'settings_updated',
      action: `Setting "${key}" updated`,
      entityType: 'settings',
      entityId: key,
      userId: currentUser?.userId || 'system',
      userEmail: currentUser?.email || 'system',
      userName: null,
      metadata: { key, oldValue, newValue: value },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return reply.send({
      success: true,
      key,
      value: settingsStore[key as keyof SystemSettings],
    });
  }

  /**
   * DELETE /admin/settings/:key
   * Reset a setting to default
   */
  async resetSetting(req: FastifyRequest, reply: FastifyReply) {
    const { key } = req.params as { key: string };
    const currentUser = (req as FastifyRequest & { user?: { userId: string; email: string } }).user;

    if (!(key in DEFAULT_SETTINGS)) {
      return reply.code(404).send({ error: 'Setting not found' });
    }

    const oldValue = settingsStore[key as keyof SystemSettings];
    settingsStore[key as keyof SystemSettings] = DEFAULT_SETTINGS[key as keyof SystemSettings];

    // Log activity
    logActivity({
      type: 'settings_updated',
      action: `Setting "${key}" reset to default`,
      entityType: 'settings',
      entityId: key,
      userId: currentUser?.userId || 'system',
      userEmail: currentUser?.email || 'system',
      userName: null,
      metadata: {
        key,
        oldValue,
        newValue: DEFAULT_SETTINGS[key as keyof SystemSettings],
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return reply.send({
      success: true,
      key,
      value: settingsStore[key as keyof SystemSettings],
      message: 'Setting reset to default',
    });
  }

  // ===========================================================================
  // Audit Log Integration Point
  // ===========================================================================

  /**
   * Log an admin action - integration point for audit-log module
   */
  static logAdminAction(
    userId: string,
    userEmail: string,
    action: string,
    entityType: string,
    entityId: string,
    metadata: Record<string, unknown> = {},
    ipAddress?: string,
    userAgent?: string
  ): void {
    logActivity({
      type: 'admin_action',
      action,
      entityType,
      entityId,
      userId,
      userEmail,
      userName: null,
      metadata,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Get activity entries for audit-log module integration
   */
  static getActivityLog(
    options: {
      limit?: number;
      offset?: number;
      type?: ActivityType;
      userId?: string;
      entityType?: string;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): { entries: ActivityEntry[]; total: number } {
    let filtered = [...activityLog];

    if (options.type) {
      filtered = filtered.filter((a) => a.type === options.type);
    }

    if (options.userId) {
      filtered = filtered.filter((a) => a.userId === options.userId);
    }

    if (options.entityType) {
      filtered = filtered.filter((a) => a.entityType === options.entityType);
    }

    if (options.startDate) {
      filtered = filtered.filter((a) => a.timestamp >= options.startDate!);
    }

    if (options.endDate) {
      filtered = filtered.filter((a) => a.timestamp <= options.endDate!);
    }

    const total = filtered.length;
    const offset = options.offset || 0;
    const limit = options.limit || 20;

    return {
      entries: filtered.slice(offset, offset + limit),
      total,
    };
  }
}

// =============================================================================
// Factory
// =============================================================================

let adminControllerInstance: AdminController | null = null;

export function getAdminController(prisma: PrismaClient): AdminController {
  if (!adminControllerInstance) {
    adminControllerInstance = new AdminController(prisma);
  }
  return adminControllerInstance;
}

export default AdminController;
