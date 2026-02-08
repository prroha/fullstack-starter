import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { db } from "../lib/db";
import { auditService } from "../services/audit.service";
import { exportService } from "../services/export.service";
import { successResponse, errorResponse, ErrorCodes } from "../utils/response";
import { z } from "zod";

// Validation schemas
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

export const settingController = {
  // ============================================================================
  // Admin endpoints
  // ============================================================================

  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const settings = await db.setting.findMany({
        orderBy: { key: "asc" },
      });

      res.json(successResponse({ settings }));
    } catch (error) {
      next(error);
    }
  },

  async getByKey(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const key = req.params.key as string;

      const setting = await db.setting.findUnique({ where: { key } });

      if (!setting) {
        return res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, "Setting not found"));
      }

      res.json(successResponse({ setting }));
    } catch (error) {
      next(error);
    }
  },

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const parsed = settingSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json(errorResponse(ErrorCodes.VALIDATION_ERROR, "Invalid input"));
      }

      // Check if key already exists
      const existing = await db.setting.findUnique({ where: { key: parsed.data.key } });
      if (existing) {
        return res.status(409).json(errorResponse(ErrorCodes.CONFLICT, "Setting key already exists"));
      }

      const setting = await db.setting.create({ data: parsed.data });

      await auditService.log({
        userId: req.user.userId,
        action: "CREATE",
        entity: "Setting",
        entityId: setting.id,
        changes: { new: { key: parsed.data.key, isPublic: parsed.data.isPublic } },
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
      const parsed = settingSchema.partial().omit({ key: true }).safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json(errorResponse(ErrorCodes.VALIDATION_ERROR, "Invalid input"));
      }

      const existing = await db.setting.findUnique({ where: { key } });
      if (!existing) {
        return res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, "Setting not found"));
      }

      const setting = await db.setting.update({
        where: { key },
        data: parsed.data,
      });

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
      const parsed = bulkUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json(errorResponse(ErrorCodes.VALIDATION_ERROR, "Invalid input"));
      }

      await db.$transaction(
        parsed.data.settings.map((s) =>
          db.setting.upsert({
            where: { key: s.key },
            update: { value: s.value },
            create: { key: s.key, value: s.value },
          })
        )
      );

      await auditService.log({
        userId: req.user.userId,
        action: "UPDATE",
        entity: "Setting",
        changes: { keys: parsed.data.settings.map((s) => s.key) },
        req,
        metadata: { bulkUpdate: true, count: parsed.data.settings.length },
      });

      res.json(successResponse({ message: "Settings updated", count: parsed.data.settings.length }));
    } catch (error) {
      next(error);
    }
  },

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const key = req.params.key as string;

      const existing = await db.setting.findUnique({ where: { key } });
      if (!existing) {
        return res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, "Setting not found"));
      }

      await db.setting.delete({ where: { key } });

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

  // ============================================================================
  // Public endpoints
  // ============================================================================

  async getPublic(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await db.setting.findMany({
        where: { isPublic: true },
        select: { key: true, value: true, type: true },
        orderBy: { key: "asc" },
      });

      // Convert to key-value object for easier consumption
      const settingsMap = settings.reduce<Record<string, unknown>>((acc, s) => {
        let value: unknown = s.value;
        if (s.type === "NUMBER") value = parseFloat(s.value);
        else if (s.type === "BOOLEAN") value = s.value === "true";
        else if (s.type === "JSON") {
          try {
            value = JSON.parse(s.value);
          } catch {
            value = s.value;
          }
        }
        acc[s.key] = value;
        return acc;
      }, {});

      res.json(successResponse({ settings: settingsMap }));
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
      const timestamp = new Date().toISOString().split("T")[0];

      const settings = await db.setting.findMany({
        orderBy: { key: "asc" },
      });

      const csv = exportService.exportToCsv(settings, [
        { header: "ID", accessor: "id" },
        { header: "Key", accessor: "key" },
        { header: "Value", accessor: "value" },
        { header: "Type", accessor: "type" },
        { header: "Description", accessor: (item) => item.description || "" },
        { header: "Public", accessor: "isPublic" },
        { header: "Created At", accessor: (item) => item.createdAt.toISOString() },
        { header: "Updated At", accessor: (item) => item.updatedAt.toISOString() },
      ]);

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="settings-export-${timestamp}.csv"`
      );
      res.send(csv);
    } catch (error) {
      next(error);
    }
  },
};
