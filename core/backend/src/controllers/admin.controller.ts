import { FastifyRequest, FastifyReply } from "fastify";
import { AuditAction, UserRole } from "@prisma/client";
import { adminService } from "../services/admin.service.js";
import { exportService } from "../services/export.service.js";
import { auditService } from "../services/audit.service.js";
import {
  successResponse,
  paginatedResponse,
  errorResponse,
  ErrorCodes,
} from "../utils/response.js";
import { z } from "zod";
import { AuthenticatedRequest } from "../types/index.js";
import {
  paginationSchema,
  booleanFilterSchema,
  nameSchema,
} from "../utils/validation-schemas.js";
import {
  ensureParam,
  getUserIdFromToken,
} from "../utils/controller-helpers.js";

// ============================================================================
// Validation Schemas
// ============================================================================

const getUsersQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
  isActive: booleanFilterSchema,
  sortBy: z.enum(["createdAt", "email", "name"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

const updateUserSchema = z.object({
  role: z.enum(["USER", "ADMIN"]).optional(),
  isActive: z.boolean().optional(),
  name: nameSchema.optional(),
});

class AdminController {
  /**
   * Get dashboard statistics
   * GET /api/v1/admin/stats
   */
  async getStats(
    _req: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const stats = await adminService.getDashboardStats();
    return reply.send(successResponse(stats));
  }

  /**
   * Get paginated list of users
   * GET /api/v1/admin/users
   */
  async getUsers(
    req: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const query = getUsersQuerySchema.parse(req.query);
    const result = await adminService.getUsers({
      page: query.page,
      limit: query.limit,
      search: query.search,
      role: query.role as UserRole | undefined,
      isActive: query.isActive,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    return reply.send(
      paginatedResponse(result.users, result.page, result.limit, result.total)
    );
  }

  /**
   * Get user by ID
   * GET /api/v1/admin/users/:id
   */
  async getUser(
    req: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const id = (req.params as Record<string, string>).id;

    if (!ensureParam(id, reply, "User ID")) {
      return;
    }

    const user = await adminService.getUserById(id);
    return reply.send(successResponse({ user }));
  }

  /**
   * Update user by ID
   * PATCH /api/v1/admin/users/:id
   */
  async updateUser(
    req: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const id = (req.params as Record<string, string>).id;

    if (!ensureParam(id, reply, "User ID")) {
      return;
    }

    const data = updateUserSchema.parse(req.body);

    // Prevent admin from deactivating themselves
    const currentUserId = getUserIdFromToken(req);
    if (currentUserId && id === currentUserId && data.isActive === false) {
      return reply
        .code(400)
        .send(errorResponse("SELF_DEACTIVATION", "You cannot deactivate your own account"));
    }

    const user = await adminService.updateUser(id, data);

    // Audit log: admin user update
    await auditService.log({
      action: AuditAction.ADMIN_ACTION,
      entity: "User",
      entityId: id,
      userId: authReq.user?.userId,
      req,
      changes: data,
      metadata: { adminAction: "updateUser" },
    });

    return reply.send(successResponse({ user }, "User updated successfully"));
  }

  /**
   * Delete user (soft delete)
   * DELETE /api/v1/admin/users/:id
   */
  async deleteUser(
    req: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const id = (req.params as Record<string, string>).id;
    const currentUserId = getUserIdFromToken(req);

    if (!ensureParam(id, reply, "User ID")) {
      return;
    }

    if (!currentUserId) {
      return reply.code(401).send(
        errorResponse(ErrorCodes.AUTH_REQUIRED, "Not authenticated")
      );
    }

    await adminService.deleteUser(id, currentUserId);

    // Audit log: admin user deletion (soft delete)
    await auditService.log({
      action: AuditAction.DELETE,
      entity: "User",
      entityId: id,
      userId: currentUserId,
      req,
      metadata: { adminAction: "deleteUser", softDelete: true },
    });

    return reply.code(204).send();
  }

  /**
   * Export all users as CSV
   * GET /api/v1/admin/users/export
   * Query params:
   *   - stream: "true" for streaming large datasets (optional)
   */
  async exportUsers(
    req: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const useStream = (req.query as Record<string, string>).stream === "true";
    const timestamp = new Date().toISOString().split("T")[0];

    reply.header("Content-Type", "text/csv; charset=utf-8");
    reply.header(
      "Content-Disposition",
      `attachment; filename="users-export-${timestamp}.csv"`
    );

    if (useStream) {
      // Use streaming for large datasets
      const columns = exportService.getUserExportColumns();
      const stream = exportService.exportToCsvStream(
        exportService.streamAllUsers(),
        columns
      );
      return reply.send(stream);
    } else {
      // Standard export for smaller datasets
      const csv = await exportService.exportAllUsers();
      return reply.send(csv);
    }
  }

  /**
   * Export audit logs as CSV
   * GET /api/v1/admin/audit-logs/export
   * Query params:
   *   - startDate: ISO date string (optional)
   *   - endDate: ISO date string (optional)
   *   - action: Filter by action type (optional)
   *   - userId: Filter by user ID (optional)
   */
  async exportAuditLogs(
    req: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const { startDate, endDate, action, userId } = req.query as Record<string, string>;
    const timestamp = new Date().toISOString().split("T")[0];

    const options: {
      startDate?: Date;
      endDate?: Date;
      action?: string;
      userId?: string;
    } = {};

    if (startDate && typeof startDate === "string") {
      options.startDate = new Date(startDate);
    }
    if (endDate && typeof endDate === "string") {
      options.endDate = new Date(endDate);
    }
    if (action && typeof action === "string") {
      options.action = action;
    }
    if (userId && typeof userId === "string") {
      options.userId = userId;
    }

    const csv = await exportService.exportAuditLogs(options);

    reply.header("Content-Type", "text/csv; charset=utf-8");
    reply.header(
      "Content-Disposition",
      `attachment; filename="audit-logs-export-${timestamp}.csv"`
    );
    return reply.send(csv);
  }
}

export const adminController = new AdminController();
