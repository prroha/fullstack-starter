import { Response, NextFunction } from "express";
import { userService } from "../services/user.service";
import { exportService, ExportFormat } from "../services/export.service";
import { successResponse, errorResponse, ErrorCodes } from "../utils/response";
import { z } from "zod";
import { AppRequest, AuthenticatedRequest } from "../types";
import { strictNameSchema, emailSchema } from "../utils/validation-schemas";
import { validateOrRespond } from "../utils/controller-helpers";

// ============================================================================
// Validation Schemas
// ============================================================================

const updateProfileSchema = z.object({
  name: strictNameSchema.optional(),
  email: emailSchema.optional(),
}).refine(
  (data) => data.name !== undefined || data.email !== undefined,
  { message: "At least one field (name or email) must be provided" }
);

const exportFormatSchema = z.enum(["json", "csv"]).optional().default("json");

class UserController {
  /**
   * Get current user profile
   * GET /api/v1/users/me
   */
  async getProfile(req: AppRequest, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const profile = await userService.getProfile(authReq.dbUser.id);

      res.json(successResponse({ profile }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update current user profile
   * PATCH /api/v1/users/me
   */
  async updateProfile(req: AppRequest, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const validated = updateProfileSchema.parse(req.body);

      const profile = await userService.updateProfile(authReq.dbUser.id, validated);

      res.json(successResponse(
        { profile },
        "Profile updated successfully"
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user avatar
   * GET /api/v1/users/me/avatar
   */
  async getAvatar(req: AppRequest, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const avatar = await userService.getAvatar(authReq.dbUser.id);

      res.json(successResponse({ avatar }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload current user avatar
   * POST /api/v1/users/me/avatar
   */
  async uploadAvatar(req: AppRequest, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;

      if (!req.file) {
        res.status(400).json(
          errorResponse(ErrorCodes.INVALID_INPUT, "No file uploaded")
        );
        return;
      }

      const result = await userService.uploadAvatar(authReq.dbUser.id, req.file);

      res.json(successResponse(
        { avatar: { url: result.url } },
        "Avatar uploaded successfully"
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete current user avatar
   * DELETE /api/v1/users/me/avatar
   */
  async deleteAvatar(req: AppRequest, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      await userService.deleteAvatar(authReq.dbUser.id);

      res.json(successResponse(null, "Avatar deleted successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export current user's data (GDPR compliant)
   * GET /api/v1/users/me/export
   * Query params:
   *   - format: "json" | "csv" (default: "json")
   */
  async exportMyData(req: AppRequest, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;

      // Validate format using schema
      const formatResult = exportFormatSchema.safeParse(req.query.format);
      if (!formatResult.success) {
        res.status(400).json(
          errorResponse(ErrorCodes.VALIDATION_ERROR, "Invalid format. Use 'json' or 'csv'")
        );
        return;
      }
      const format = formatResult.data;

      const data = await exportService.exportUserData(authReq.dbUser.id, format);

      if (format === "csv") {
        const timestamp = new Date().toISOString().split("T")[0];
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="my-data-${timestamp}.csv"`
        );
        res.send(data);
      } else {
        const timestamp = new Date().toISOString().split("T")[0];
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="my-data-${timestamp}.json"`
        );
        res.send(data);
      }
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
