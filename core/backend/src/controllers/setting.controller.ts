/**
 * Setting Controller
 *
 * Handles HTTP requests for application settings management.
 * Delegates business logic to settingService.
 */

import { Request, Response, NextFunction } from "express";
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

  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const settings = await settingService.getAll();
      res.json(successResponse({ settings }));
    } catch (error) {
      next(error);
    }
  },

  async getByKey(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const key = req.params.key as string;
      const setting = await settingService.getByKey(key);
      res.json(successResponse({ setting }));
    } catch (error) {
      next(error);
    }
  },

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validated = validateOrRespond(settingSchema, req.body, res);
      if (!validated) return;

      const setting = await settingService.create(validated);

      await auditService.log({
        userId: req.user.userId,
        action: "CREATE",
        entity: "Setting",
        entityId: setting.id,
        changes: { new: { key: validated.key, isPublic: validated.isPublic } },
        req,
      });

      res.status(201).json(successResponse({ setting }));
    } catch (error) {
      next(error);
    }
  },

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const key = req.params.key as string;
      const validated = validateOrRespond(settingSchema.partial().omit({ key: true }), req.body, res);
      if (!validated) return;

      const existing = await settingService.getByKey(key);
      const setting = await settingService.update(key, validated);

      await auditService.log({
        userId: req.user.userId,
        action: "UPDATE",
        entity: "Setting",
        entityId: existing.id,
        changes: { old: { value: "[REDACTED]" }, new: { value: "[REDACTED]" } },
        req,
        metadata: { settingKey: key },
      });

      res.json(successResponse({ setting }));
    } catch (error) {
      next(error);
    }
  },

  async bulkUpdate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validated = validateOrRespond(bulkUpdateSchema, req.body, res);
      if (!validated) return;

      const count = await settingService.bulkUpdate(validated.settings);

      await auditService.log({
        userId: req.user.userId,
        action: "UPDATE",
        entity: "Setting",
        changes: { keys: validated.settings.map((s) => s.key) },
        req,
        metadata: { bulkUpdate: true, count },
      });

      res.json(successResponse({ message: "Settings updated", count }));
    } catch (error) {
      next(error);
    }
  },

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const key = req.params.key as string;
      const existing = await settingService.delete(key);

      await auditService.log({
        userId: req.user.userId,
        action: "DELETE",
        entity: "Setting",
        entityId: existing.id,
        changes: { old: { key } },
        req,
      });

      res.json(successResponse({ message: "Setting deleted" }));
    } catch (error) {
      next(error);
    }
  },

  // ==========================================================================
  // Public endpoints
  // ==========================================================================

  async getPublic(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await settingService.getPublic();
      res.json(successResponse({ settings }));
    } catch (error) {
      next(error);
    }
  },

  /**
   * Export all settings as CSV (admin only)
   * GET /api/v1/admin/settings/export
   */
  async exportSettings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const settings = await settingService.getAllForExport();

      sendCsvExport(res, settings, [
        { header: "ID", accessor: "id" },
        { header: "Key", accessor: "key" },
        { header: "Value", accessor: "value" },
        { header: "Type", accessor: "type" },
        { header: "Description", accessor: (item) => item.description || "" },
        { header: "Public", accessor: "isPublic" },
        { header: "Created At", accessor: (item) => item.createdAt.toISOString() },
        { header: "Updated At", accessor: (item) => item.updatedAt.toISOString() },
      ], { filenamePrefix: "settings-export" });
    } catch (error) {
      next(error);
    }
  },
};
