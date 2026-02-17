/**
 * Setting Controller
 *
 * Handles HTTP requests for application settings management.
 * Delegates business logic to settingService.
 */

import { FastifyRequest, FastifyReply } from "fastify";
import { AuthenticatedRequest } from "../types/index.js";
import { settingService } from "../services/setting.service.js";
import { auditService } from "../services/audit.service.js";
import { successResponse } from "../utils/response.js";
import { z } from "zod";
import { validateOrRespond, sendCsvExport } from "../utils/controller-helpers.js";

// ============================================================================
// Validation Schemas
// ============================================================================

const settingSchema = z.object({
  key: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_.]+$/),
  value: z.string(),
  type: z.enum(["STRING", "NUMBER", "BOOLEAN", "JSON"]).optional(),
  description: z.string().max(500).nullable().optional(),
  isPublic: z.boolean().optional(),
});

const bulkUpdateSchema = z.object({
  settings: z.array(z.object({
    key: z.string(),
    value: z.string(),
  })),
});

// ============================================================================
// Controller
// ============================================================================

export const settingController = {
  // ==========================================================================
  // Admin endpoints
  // ==========================================================================

  async getAll(req: FastifyRequest, reply: FastifyReply) {
    const settings = await settingService.getAll();
    return reply.send(successResponse({ settings }));
  },

  async getByKey(req: FastifyRequest, reply: FastifyReply) {
    const key = (req.params as Record<string, string>).key;
    const setting = await settingService.getByKey(key);
    return reply.send(successResponse({ setting }));
  },

  async create(req: FastifyRequest, reply: FastifyReply) {
    const authReq = req as AuthenticatedRequest;
    const validated = validateOrRespond(settingSchema, req.body, reply);
    if (!validated) return;

    const setting = await settingService.create(validated);

    await auditService.log({
      userId: authReq.user.userId,
      action: "CREATE",
      entity: "Setting",
      entityId: setting.id,
      changes: { new: { key: validated.key, isPublic: validated.isPublic } },
      req,
    });

    return reply.code(201).send(successResponse({ setting }));
  },

  async update(req: FastifyRequest, reply: FastifyReply) {
    const authReq = req as AuthenticatedRequest;
    const key = (req.params as Record<string, string>).key;
    const validated = validateOrRespond(settingSchema.partial().omit({ key: true }), req.body, reply);
    if (!validated) return;

    const existing = await settingService.getByKey(key);
    const setting = await settingService.update(key, validated);

    await auditService.log({
      userId: authReq.user.userId,
      action: "UPDATE",
      entity: "Setting",
      entityId: existing.id,
      changes: { old: { value: "[REDACTED]" }, new: { value: "[REDACTED]" } },
      req,
      metadata: { settingKey: key },
    });

    return reply.send(successResponse({ setting }));
  },

  async bulkUpdate(req: FastifyRequest, reply: FastifyReply) {
    const authReq = req as AuthenticatedRequest;
    const validated = validateOrRespond(bulkUpdateSchema, req.body, reply);
    if (!validated) return;

    const count = await settingService.bulkUpdate(validated.settings);

    await auditService.log({
      userId: authReq.user.userId,
      action: "UPDATE",
      entity: "Setting",
      changes: { keys: validated.settings.map((s) => s.key) },
      req,
      metadata: { bulkUpdate: true, count },
    });

    return reply.send(successResponse({ message: "Settings updated", count }));
  },

  async delete(req: FastifyRequest, reply: FastifyReply) {
    const authReq = req as AuthenticatedRequest;
    const key = (req.params as Record<string, string>).key;
    const existing = await settingService.delete(key);

    await auditService.log({
      userId: authReq.user.userId,
      action: "DELETE",
      entity: "Setting",
      entityId: existing.id,
      changes: { old: { key } },
      req,
    });

    return reply.send(successResponse({ message: "Setting deleted" }));
  },

  // ==========================================================================
  // Public endpoints
  // ==========================================================================

  async getPublic(req: FastifyRequest, reply: FastifyReply) {
    const settings = await settingService.getPublic();
    return reply.send(successResponse({ settings }));
  },

  /**
   * Export all settings as CSV (admin only)
   * GET /api/v1/admin/settings/export
   */
  async exportSettings(req: FastifyRequest, reply: FastifyReply) {
    const settings = await settingService.getAllForExport();

    sendCsvExport(reply, settings, [
      { header: "ID", accessor: "id" },
      { header: "Key", accessor: "key" },
      { header: "Value", accessor: "value" },
      { header: "Type", accessor: "type" },
      { header: "Description", accessor: (item) => item.description || "" },
      { header: "Public", accessor: "isPublic" },
      { header: "Created At", accessor: (item) => item.createdAt.toISOString() },
      { header: "Updated At", accessor: (item) => item.updatedAt.toISOString() },
    ], { filenamePrefix: "settings-export" });
  },
};
