import { FastifyRequest, FastifyReply } from "fastify";
import { AuditAction } from "@prisma/client";
import { auditService } from "../services/audit.service.js";
import {
  successResponse,
  paginatedResponse,
} from "../utils/response.js";
import { z } from "zod";
import { paginationSchema } from "../utils/validation-schemas.js";
import { ensureParam, ensureExists } from "../utils/controller-helpers.js";

// ============================================================================
// Validation Schemas
// ============================================================================

const getAuditLogsQuerySchema = paginationSchema.extend({
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
    req: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
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

    return reply.send(
      paginatedResponse(result.logs, result.page, result.limit, result.total)
    );
  }

  /**
   * Get audit log by ID
   * GET /api/v1/admin/audit-logs/:id
   */
  async getLogById(
    req: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const id = (req.params as Record<string, string>).id;

    if (!ensureParam(id, reply, "Audit log ID")) {
      return;
    }

    const log = await auditService.getLogById(id);

    if (!ensureExists(log, reply, "Audit log")) {
      return;
    }

    return reply.send(successResponse({ log }));
  }

  /**
   * Get list of entity types for filtering
   * GET /api/v1/admin/audit-logs/entity-types
   */
  async getEntityTypes(
    _req: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const entityTypes = await auditService.getEntityTypes();
    return reply.send(successResponse({ entityTypes }));
  }

  /**
   * Get list of action types for filtering
   * GET /api/v1/admin/audit-logs/action-types
   */
  async getActionTypes(
    _req: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const actionTypes = Object.values(AuditAction);
    return reply.send(successResponse({ actionTypes }));
  }
}

export const auditController = new AuditController();
