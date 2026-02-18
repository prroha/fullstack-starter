import { db } from "../lib/db.js";
import { UserRole, ContactMessageStatus, OrderStatus } from "@prisma/client";
import { ApiError } from "../middleware/error.middleware.js";
import { ErrorCodes } from "../utils/response.js";

/**
 * Dashboard statistics response - comprehensive stats for all admin sections
 */
interface DashboardStats {
  // User stats
  users: {
    total: number;
    active: number;
    inactive: number;
    admins: number;
    recentSignups: number;
    signupsByDay: Array<{ date: string; count: number }>;
  };
  // Order stats
  orders: {
    total: number;
    pending: number;
    completed: number;
    totalRevenue: number;
    recentOrders: number;
  };
  // Message stats
  messages: {
    total: number;
    pending: number;
    read: number;
    replied: number;
  };
  // FAQ stats
  faqs: {
    total: number;
    active: number;
    categories: number;
  };
  // Announcement stats
  announcements: {
    total: number;
    active: number;
    pinned: number;
  };
  // Coupon stats
  coupons: {
    total: number;
    active: number;
    expired: number;
  };
  // Content stats
  content: {
    total: number;
    published: number;
    draft: number;
  };
  // Recent audit logs
  recentActivity: Array<{
    id: string;
    action: string;
    entity: string;
    entityId: string | null;
    userEmail: string | null;
    createdAt: Date;
  }>;
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
   * Get comprehensive dashboard statistics for all admin sections
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get all counts in parallel for better performance
    const [
      // User stats
      totalUsers,
      activeUsers,
      adminUsers,
      recentSignups,
      signupsByDay,
      // Order stats
      totalOrders,
      pendingOrders,
      completedOrders,
      revenueResult,
      recentOrders,
      // Message stats
      totalMessages,
      pendingMessages,
      readMessages,
      repliedMessages,
      // FAQ stats
      totalFaqs,
      activeFaqs,
      totalCategories,
      // Announcement stats
      totalAnnouncements,
      activeAnnouncements,
      pinnedAnnouncements,
      // Coupon stats
      totalCoupons,
      activeCoupons,
      expiredCoupons,
      // Content stats
      totalContent,
      publishedContent,
      // Recent activity
      recentActivity,
    ] = await Promise.all([
      // User stats
      db.user.count(),
      db.user.count({ where: { isActive: true } }),
      db.user.count({ where: { role: { in: [UserRole.ADMIN, UserRole.SUPER_ADMIN] } } }),
      db.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      this.getSignupsByDay(7),
      // Order stats
      db.order.count(),
      db.order.count({ where: { status: OrderStatus.PENDING } }),
      db.order.count({ where: { status: OrderStatus.COMPLETED } }),
      db.order.aggregate({ _sum: { total: true }, where: { status: OrderStatus.COMPLETED } }),
      db.order.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      // Message stats
      db.contactMessage.count(),
      db.contactMessage.count({ where: { status: ContactMessageStatus.PENDING } }),
      db.contactMessage.count({ where: { status: ContactMessageStatus.READ } }),
      db.contactMessage.count({ where: { status: ContactMessageStatus.REPLIED } }),
      // FAQ stats
      db.faq.count(),
      db.faq.count({ where: { isActive: true } }),
      db.faqCategory.count(),
      // Announcement stats
      db.announcement.count(),
      db.announcement.count({ where: { isActive: true, OR: [{ endDate: null }, { endDate: { gte: now } }] } }),
      db.announcement.count({ where: { isPinned: true, isActive: true } }),
      // Coupon stats
      db.coupon.count(),
      db.coupon.count({ where: { isActive: true, OR: [{ validUntil: null }, { validUntil: { gte: now } }] } }),
      db.coupon.count({ where: { validUntil: { lt: now } } }),
      // Content stats
      db.contentPage.count(),
      db.contentPage.count({ where: { isPublished: true } }),
      // Recent activity (last 10 audit logs)
      // Note: Prisma's nested `select` on relations (e.g., `user: { select: { email: true } }`)
      // is resolved via a SQL JOIN, NOT separate N+1 queries. This is safe and efficient.
      db.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          action: true,
          entity: true,
          entityId: true,
          createdAt: true,
          user: { select: { email: true } },
        },
      }),
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
        admins: adminUsers,
        recentSignups,
        signupsByDay,
      },
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        completed: completedOrders,
        totalRevenue: revenueResult._sum.total || 0,
        recentOrders,
      },
      messages: {
        total: totalMessages,
        pending: pendingMessages,
        read: readMessages,
        replied: repliedMessages,
      },
      faqs: {
        total: totalFaqs,
        active: activeFaqs,
        categories: totalCategories,
      },
      announcements: {
        total: totalAnnouncements,
        active: activeAnnouncements,
        pinned: pinnedAnnouncements,
      },
      coupons: {
        total: totalCoupons,
        active: activeCoupons,
        expired: expiredCoupons,
      },
      content: {
        total: totalContent,
        published: publishedContent,
        draft: totalContent - publishedContent,
      },
      recentActivity: recentActivity.map((log) => ({
        id: log.id,
        action: log.action,
        entity: log.entity,
        entityId: log.entityId,
        userEmail: log.user?.email || null,
        createdAt: log.createdAt,
      })),
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

    // Database-side grouping for efficiency
    const rows = await db.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT DATE(created_at AT TIME ZONE 'UTC') as date, COUNT(*) as count
      FROM users
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at AT TIME ZONE 'UTC')
    `;

    const dbCounts = new Map(rows.map(r => [r.date, Number(r.count)]));

    // Fill in all days (including zeros)
    const result: Array<{ date: string; count: number }> = [];
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      result.push({ date: dateStr, count: dbCounts.get(dateStr) ?? 0 });
    }

    return result;
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
