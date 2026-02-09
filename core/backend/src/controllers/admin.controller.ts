import { Response, NextFunction } from "express";
import { AuditAction, UserRole } from "@prisma/client";
import { adminService } from "../services/admin.service";
import { exportService } from "../services/export.service";
import { auditService } from "../services/audit.service";
import {
  successResponse,
  paginatedResponse,
  errorResponse,
  ErrorCodes,
} from "../utils/response";
import { z } from "zod";
import { AuthenticatedRequest } from "../types";
import {
  paginationSchema,
  booleanFilterSchema,
  nameSchema,
} from "../utils/validation-schemas";
import {
  ensureParam,
  getUserIdFromToken,
} from "../utils/controller-helpers";

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
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const stats = await adminService.getDashboardStats();
      res.json(successResponse(stats));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get paginated list of users
   * GET /api/v1/admin/users
   */
  async getUsers(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
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

      res.json(
        paginatedResponse(result.users, result.page, result.limit, result.total)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user by ID
   * GET /api/v1/admin/users/:id
   */
  async getUser(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.params.id as string;

      if (!ensureParam(id, res, "User ID")) {
        return;
      }

      const user = await adminService.getUserById(id);
      res.json(successResponse({ user }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user by ID
   * PATCH /api/v1/admin/users/:id
   */
  async updateUser(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.params.id as string;

      if (!ensureParam(id, res, "User ID")) {
        return;
      }

      const data = updateUserSchema.parse(req.body);
      const user = await adminService.updateUser(id, data);

      // Audit log: admin user update
      await auditService.log({
        action: AuditAction.ADMIN_ACTION,
        entity: "User",
        entityId: id,
        userId: req.user?.userId,
        req,
        changes: data,
        metadata: { adminAction: "updateUser" },
      });

      res.json(successResponse({ user }, "User updated successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete user (soft delete)
   * DELETE /api/v1/admin/users/:id
   */
  async deleteUser(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.params.id as string;
      const currentUserId = getUserIdFromToken(req);

      if (!ensureParam(id, res, "User ID")) {
        return;
      }

      if (!currentUserId) {
        res.status(401).json(
          errorResponse(ErrorCodes.AUTH_REQUIRED, "Not authenticated")
        );
        return;
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

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export all users as CSV
   * GET /api/v1/admin/users/export
   * Query params:
   *   - stream: "true" for streaming large datasets (optional)
   */
  async exportUsers(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const useStream = req.query.stream === "true";
      const timestamp = new Date().toISOString().split("T")[0];

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
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
        stream.pipe(res);
      } else {
        // Standard export for smaller datasets
        const csv = await exportService.exportAllUsers();
        res.send(csv);
      }
    } catch (error) {
      next(error);
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
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { startDate, endDate, action, userId } = req.query;
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

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="audit-logs-export-${timestamp}.csv"`
      );
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
