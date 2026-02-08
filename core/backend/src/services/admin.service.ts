import { db } from "../lib/db";
import { UserRole } from "@prisma/client";
import { ApiError } from "../middleware/error.middleware";
import { ErrorCodes } from "../utils/response";

/**
 * Dashboard statistics response
 */
interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  adminUsers: number;
  recentSignups: number;
  signupsByDay: Array<{ date: string; count: number }>;
}

/**
 * User list filters
 */
interface UserListFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  sortBy?: "createdAt" | "email" | "name";
  sortOrder?: "asc" | "desc";
}

/**
 * User update data
 */
interface UpdateUserData {
  role?: UserRole;
  isActive?: boolean;
  name?: string;
}

/**
 * User response (safe fields only)
 */
interface SafeUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

class AdminService {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    // Get counts in parallel for better performance
    const [totalUsers, activeUsers, adminUsers, recentSignups, signupsByDay] =
      await Promise.all([
        // Total users count
        db.user.count(),

        // Active users count
        db.user.count({
          where: { isActive: true },
        }),

        // Admin users count
        db.user.count({
          where: { role: UserRole.ADMIN },
        }),

        // Signups in the last 7 days
        db.user.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        }),

        // Signups by day for the last 7 days
        this.getSignupsByDay(7),
      ]);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      adminUsers,
      recentSignups,
      signupsByDay,
    };
  }

  /**
   * Get signups grouped by day
   */
  private async getSignupsByDay(
    days: number
  ): Promise<Array<{ date: string; count: number }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Query users created in the date range
    const users = await db.user.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
      },
    });

    // Group by date
    const countByDate: Record<string, number> = {};

    // Initialize all days with 0
    for (let i = 0; i <= days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      countByDate[dateStr] = 0;
    }

    // Count users per day
    for (const user of users) {
      const dateStr = user.createdAt.toISOString().split("T")[0];
      if (countByDate[dateStr] !== undefined) {
        countByDate[dateStr]++;
      }
    }

    // Convert to array and sort by date
    return Object.entries(countByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get paginated list of users
   */
  async getUsers(filters: UserListFilters = {}): Promise<{
    users: SafeUser[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      isActive,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = filters;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Get total count and users in parallel
    const [total, users] = await Promise.all([
      db.user.count({ where }),
      db.user.findMany({
        where,
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
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      users,
      total,
      page,
      limit,
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<SafeUser> {
    const user = await db.user.findUnique({
      where: { id },
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
    });

    if (!user) {
      throw ApiError.notFound("User not found", ErrorCodes.NOT_FOUND);
    }

    return user;
  }

  /**
   * Update user by ID
   */
  async updateUser(id: string, data: UpdateUserData): Promise<SafeUser> {
    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw ApiError.notFound("User not found", ErrorCodes.NOT_FOUND);
    }

    // Update user
    const user = await db.user.update({
      where: { id },
      data: {
        ...(data.role !== undefined && { role: data.role }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.name !== undefined && { name: data.name }),
      },
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
    });

    return user;
  }

  /**
   * Soft delete user (set isActive to false)
   */
  async deleteUser(
    id: string,
    currentUserId: string
  ): Promise<{ success: boolean }> {
    // Prevent self-deletion
    if (id === currentUserId) {
      throw ApiError.badRequest(
        "Cannot delete your own account",
        ErrorCodes.VALIDATION_ERROR
      );
    }

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw ApiError.notFound("User not found", ErrorCodes.NOT_FOUND);
    }

    // Soft delete by setting isActive to false
    await db.user.update({
      where: { id },
      data: { isActive: false },
    });

    return { success: true };
  }
}

export const adminService = new AdminService();
