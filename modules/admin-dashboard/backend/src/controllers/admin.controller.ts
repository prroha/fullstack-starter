import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';

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
  async getStats(_req: Request, res: Response): Promise<void> {
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(startOfDay);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [totalUsers, activeUsers, newToday, newThisWeek, newThisMonth] =
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
        ]);

      const stats: DashboardStats = {
        totalUsers,
        activeUsers,
        newUsersToday: newToday,
        newUsersThisWeek: newThisWeek,
        newUsersThisMonth: newThisMonth,
      };

      res.json({ success: true, stats });
    } catch (error) {
      console.error('[AdminController] Get stats error:', error);
      res.status(500).json({ error: 'Failed to get statistics' });
    }
  }

  /**
   * GET /admin/activity
   * Get recent activity/audit log
   */
  async getRecentActivity(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 20;

      // Get recently updated users as activity
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

      const activity = recentUsers.map((user) => ({
        id: user.id,
        type: user.createdAt.getTime() === user.updatedAt.getTime() ? 'user_created' : 'user_updated',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        timestamp: user.updatedAt,
      }));

      res.json({ success: true, activity });
    } catch (error) {
      console.error('[AdminController] Get activity error:', error);
      res.status(500).json({ error: 'Failed to get activity' });
    }
  }

  // ===========================================================================
  // User Management
  // ===========================================================================

  /**
   * GET /admin/users
   * List users with pagination and filtering
   */
  async listUsers(req: Request, res: Response): Promise<void> {
    try {
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
        where.role = role;
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
            createdAt: true,
            updatedAt: true,
          },
        }),
        this.prisma.user.count({ where }),
      ]);

      res.json({
        success: true,
        users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error('[AdminController] List users error:', error);
      res.status(500).json({ error: 'Failed to list users' });
    }
  }

  /**
   * GET /admin/users/:id
   * Get single user details
   */
  async getUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const user = await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({ success: true, user });
    } catch (error) {
      console.error('[AdminController] Get user error:', error);
      res.status(500).json({ error: 'Failed to get user' });
    }
  }

  /**
   * PATCH /admin/users/:id
   * Update user
   */
  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, role } = req.body;

      // Check if user exists
      const existingUser = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Build update data
      const updateData: Prisma.UserUpdateInput = {};
      if (name !== undefined) updateData.name = name;
      if (role !== undefined) updateData.role = role;

      const user = await this.prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      res.json({ success: true, user });
    } catch (error) {
      console.error('[AdminController] Update user error:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  }

  /**
   * DELETE /admin/users/:id
   * Delete user
   */
  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Prevent self-deletion
      const currentUserId = (req as Request & { user?: { id: string } }).user?.id;
      if (id === currentUserId) {
        res.status(400).json({ error: 'Cannot delete your own account' });
        return;
      }

      // Check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      await this.prisma.user.delete({ where: { id } });

      res.json({ success: true, message: 'User deleted' });
    } catch (error) {
      console.error('[AdminController] Delete user error:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }

  // ===========================================================================
  // System Settings
  // ===========================================================================

  /**
   * GET /admin/settings
   * Get system settings
   */
  async getSettings(_req: Request, res: Response): Promise<void> {
    try {
      // In a real app, you'd fetch these from a settings table
      const settings = {
        appName: process.env.APP_NAME || 'My App',
        supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com',
        maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
        allowRegistration: process.env.ALLOW_REGISTRATION !== 'false',
        requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION === 'true',
      };

      res.json({ success: true, settings });
    } catch (error) {
      console.error('[AdminController] Get settings error:', error);
      res.status(500).json({ error: 'Failed to get settings' });
    }
  }

  /**
   * PUT /admin/settings
   * Update system settings
   */
  async updateSettings(req: Request, res: Response): Promise<void> {
    try {
      const { settings } = req.body;

      // In a real app, you'd save these to a settings table
      // For now, we just acknowledge the update
      console.log('[AdminController] Settings update requested:', settings);

      res.json({
        success: true,
        message: 'Settings updated',
        note: 'Implement settings persistence in your database',
      });
    } catch (error) {
      console.error('[AdminController] Update settings error:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
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
