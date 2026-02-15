import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/db.js";
import { sendSuccess, sendPaginated, parsePaginationParams, createPaginationInfo } from "../../utils/response.js";
import { ApiError } from "../../utils/errors.js";
import { emailService } from "../../services/email.service.js";

const router = Router();

const settingSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string(),
  type: z.enum(["string", "number", "boolean", "json"]).default("string"),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
});

/**
 * GET /api/admin/settings/email/status
 * Check email service configuration status
 */
router.get("/email/status", async (_req, res, next) => {
  try {
    sendSuccess(res, {
      configured: emailService.isConfigured(),
      provider: "resend",
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/settings/email/test
 * Send a test email to verify configuration
 */
router.post("/email/test", async (req, res, next) => {
  try {
    const schema = z.object({
      email: z.string().email(),
    });
    const { email } = schema.parse(req.body);

    if (!emailService.isConfigured()) {
      throw ApiError.badRequest("Email service is not configured. Set RESEND_API_KEY in environment variables.");
    }

    const result = await emailService.sendWelcome({
      email,
      name: "Test User",
      loginUrl: "https://xitolaunch.com",
    });

    if (!result.success) {
      throw ApiError.badRequest(`Failed to send test email: ${result.error}`);
    }

    await prisma.studioAuditLog.create({
      data: {
        adminId: req.user?.id,
        adminEmail: req.user?.email,
        action: "TEST_EMAIL",
        entityType: "settings",
        entityId: "email",
        newValues: { testEmail: email, messageId: result.messageId },
      },
    });

    sendSuccess(res, {
      sent: true,
      messageId: result.messageId,
    }, "Test email sent successfully");
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/settings/export/json
 * Export all settings as JSON
 * NOTE: Must be defined BEFORE /:key route to avoid being matched as a key
 */
router.get("/export/json", async (_req, res, next) => {
  try {
    const settings = await prisma.studioSetting.findMany({
      orderBy: { key: "asc" },
    });

    const exportData = settings.reduce((acc, s) => {
      acc[s.key] = {
        value: s.value,
        type: s.type,
        description: s.description,
        isPublic: s.isPublic,
      };
      return acc;
    }, {} as Record<string, unknown>);

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename=settings-${new Date().toISOString().split("T")[0]}.json`);
    res.send(JSON.stringify(exportData, null, 2));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/settings
 * List all settings
 */
router.get("/", async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePaginationParams(req.query as { page?: string; limit?: string });
    const { search, isPublic } = req.query;

    const where: Record<string, unknown> = {};
    if (isPublic !== undefined) where.isPublic = isPublic === "true";
    if (search) {
      where.key = { contains: search as string, mode: "insensitive" };
    }

    const [settings, total] = await Promise.all([
      prisma.studioSetting.findMany({
        where,
        skip,
        take: limit,
        orderBy: { key: "asc" },
      }),
      prisma.studioSetting.count({ where }),
    ]);

    sendPaginated(res, settings, createPaginationInfo(page, limit, total));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/settings/:key
 * Get single setting by key
 */
router.get("/:key", async (req, res, next) => {
  try {
    const setting = await prisma.studioSetting.findUnique({
      where: { key: req.params.key },
    });

    if (!setting) {
      throw ApiError.notFound("Setting");
    }

    sendSuccess(res, setting);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/settings
 * Create new setting
 */
router.post("/", async (req, res, next) => {
  try {
    const data = settingSchema.parse(req.body);

    // Validate JSON if type is json
    if (data.type === "json") {
      try {
        JSON.parse(data.value);
      } catch {
        throw ApiError.badRequest("Invalid JSON value");
      }
    }

    // Validate number if type is number
    if (data.type === "number" && isNaN(Number(data.value))) {
      throw ApiError.badRequest("Invalid number value");
    }

    // Validate boolean if type is boolean
    if (data.type === "boolean" && !["true", "false"].includes(data.value.toLowerCase())) {
      throw ApiError.badRequest("Invalid boolean value (use 'true' or 'false')");
    }

    const existing = await prisma.studioSetting.findUnique({ where: { key: data.key } });
    if (existing) {
      throw ApiError.conflict("Setting with this key already exists");
    }

    const setting = await prisma.studioSetting.create({ data });

    await prisma.studioAuditLog.create({
      data: {
        adminId: req.user?.id,
        adminEmail: req.user?.email,
        action: "CREATE",
        entityType: "setting",
        entityId: setting.id,
        newValues: data,
      },
    });

    sendSuccess(res, setting, "Setting created", 201);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/settings/:key
 * Update setting
 */
router.put("/:key", async (req, res, next) => {
  try {
    const data = settingSchema.partial().parse(req.body);

    const existing = await prisma.studioSetting.findUnique({ where: { key: req.params.key } });
    if (!existing) {
      throw ApiError.notFound("Setting");
    }

    // Validate value based on type
    const type = data.type || existing.type;

    if (type === "json" && data.value) {
      try {
        JSON.parse(data.value);
      } catch {
        throw ApiError.badRequest("Invalid JSON value");
      }
    }

    if (type === "number" && data.value && isNaN(Number(data.value))) {
      throw ApiError.badRequest("Invalid number value");
    }

    if (type === "boolean" && data.value && !["true", "false"].includes(data.value.toLowerCase())) {
      throw ApiError.badRequest("Invalid boolean value");
    }

    const setting = await prisma.studioSetting.update({
      where: { key: req.params.key },
      data,
    });

    await prisma.studioAuditLog.create({
      data: {
        adminId: req.user?.id,
        adminEmail: req.user?.email,
        action: "UPDATE",
        entityType: "setting",
        entityId: setting.id,
        oldValues: existing,
        newValues: data,
      },
    });

    sendSuccess(res, setting, "Setting updated");
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/admin/settings/:key
 * Delete setting
 */
router.delete("/:key", async (req, res, next) => {
  try {
    const setting = await prisma.studioSetting.findUnique({ where: { key: req.params.key } });
    if (!setting) {
      throw ApiError.notFound("Setting");
    }

    await prisma.studioSetting.delete({ where: { key: req.params.key } });

    await prisma.studioAuditLog.create({
      data: {
        adminId: req.user?.id,
        adminEmail: req.user?.email,
        action: "DELETE",
        entityType: "setting",
        entityId: setting.id,
        oldValues: setting,
      },
    });

    sendSuccess(res, null, "Setting deleted");
  } catch (error) {
    next(error);
  }
});

export { router as settingsRoutes };
