import { Response, NextFunction } from "express";
import { AuditAction } from "@prisma/client";
import { auditService } from "../services/audit.service";
import {
  successResponse,
  paginatedResponse,
  errorResponse,
  ErrorCodes,
} from "../utils/response";
import { z } from "zod";
import { AuthenticatedRequest } from "../types";

// Validation schemas
const getAuditLogsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  userId: z.string().uuid().optional(),
  action: z.nativeEnum(AuditAction).optional(),
  entity: z.string().optional(),
  entityId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().optional(),
});

class AuditController {
  /**
   * Get paginated list of audit logs
   * GET /api/v1/admin/audit-logs
   */
  async getLogs(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const query = getAuditLogsQuerySchema.parse(req.query);

      const result = await auditService.getLogs({
        page: query.page,
        limit: query.limit,
        userId: query.userId,
        action: query.action,
        entity: query.entity,
        entityId: query.entityId,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
        search: query.search,
      });

      res.json(
        paginatedResponse(result.logs, result.page, result.limit, result.total)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get audit log by ID
   * GET /api/v1/admin/audit-logs/:id
   */
  async getLogById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.params.id as string;

      if (!id) {
        res
          .status(400)
          .json(
            errorResponse(ErrorCodes.VALIDATION_ERROR, "Audit log ID is required")
          );
        return;
      }

      const log = await auditService.getLogById(id);

      if (!log) {
        res
          .status(404)
          .json(errorResponse(ErrorCodes.NOT_FOUND, "Audit log not found"));
        return;
      }

      res.json(successResponse({ log }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get list of entity types for filtering
   * GET /api/v1/admin/audit-logs/entity-types
   */
  async getEntityTypes(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const entityTypes = await auditService.getEntityTypes();
      res.json(successResponse({ entityTypes }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get list of action types for filtering
   * GET /api/v1/admin/audit-logs/action-types
   */
  async getActionTypes(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const actionTypes = Object.values(AuditAction);
      res.json(successResponse({ actionTypes }));
    } catch (error) {
      next(error);
    }
  }
}

export const auditController = new AuditController();
