import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { db } from "../lib/db";
import { auditService } from "../services/audit.service";
import { successResponse, paginatedResponse, errorResponse, ErrorCodes } from "../utils/response";
import { z } from "zod";
import { DiscountType } from "@prisma/client";

// Validation schemas
const couponSchema = z.object({
  code: z.string().min(1).max(50).toUpperCase(),
  discountType: z.nativeEnum(DiscountType),
  discountValue: z.number().positive(),
  minPurchase: z.number().positive().nullable().optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  validFrom: z.string().datetime().nullable().optional(),
  validUntil: z.string().datetime().nullable().optional(),
  isActive: z.boolean().optional(),
});

const validateCouponSchema = z.object({
  code: z.string().min(1),
  purchaseAmount: z.number().positive().optional(),
});

export const couponController = {
  // ============================================================================
  // Admin Coupon Management
  // ============================================================================

  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { page = "1", limit = "10", isActive, search } = req.query;

      const pageNum = Math.max(1, parseInt(page as string, 10));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
      const skip = (pageNum - 1) * limitNum;

      const where: Record<string, unknown> = {};

      if (isActive !== undefined) {
        where.isActive = isActive === "true";
      }

      if (search) {
        where.code = { contains: (search as string).toUpperCase(), mode: "insensitive" };
      }

      const [coupons, total] = await Promise.all([
        db.coupon.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: limitNum,
        }),
        db.coupon.count({ where }),
      ]);

      res.json(paginatedResponse(coupons, pageNum, limitNum, total));
    } catch (error) {
      next(error);
    }
  },

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;

      const coupon = await db.coupon.findUnique({ where: { id } });

      if (!coupon) {
        return res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, "Coupon not found"));
      }

      res.json(successResponse({ coupon }));
    } catch (error) {
      next(error);
    }
  },

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const parsed = couponSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json(
          errorResponse(ErrorCodes.VALIDATION_ERROR, "Invalid input", parsed.error.flatten())
        );
      }

      // Check if coupon code already exists
      const existingCoupon = await db.coupon.findUnique({
        where: { code: parsed.data.code },
      });

      if (existingCoupon) {
        return res.status(409).json(
          errorResponse(ErrorCodes.ALREADY_EXISTS, "Coupon code already exists")
        );
      }

      const coupon = await db.coupon.create({
        data: {
          code: parsed.data.code,
          discountType: parsed.data.discountType,
          discountValue: parsed.data.discountValue,
          minPurchase: parsed.data.minPurchase ?? null,
          maxUses: parsed.data.maxUses ?? null,
          validFrom: parsed.data.validFrom ? new Date(parsed.data.validFrom) : null,
          validUntil: parsed.data.validUntil ? new Date(parsed.data.validUntil) : null,
          isActive: parsed.data.isActive ?? true,
        },
      });

      await auditService.log({
        userId: req.user.userId,
        action: "CREATE",
        entity: "Coupon",
        entityId: coupon.id,
        changes: { new: parsed.data },
        req,
      });

      res.status(201).json(successResponse({ coupon }));
    } catch (error) {
      next(error);
    }
  },

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const parsed = couponSchema.partial().safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json(
          errorResponse(ErrorCodes.VALIDATION_ERROR, "Invalid input", parsed.error.flatten())
        );
      }

      const existing = await db.coupon.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, "Coupon not found"));
      }

      // If code is being updated, check for uniqueness
      if (parsed.data.code && parsed.data.code !== existing.code) {
        const codeExists = await db.coupon.findUnique({
          where: { code: parsed.data.code },
        });
        if (codeExists) {
          return res.status(409).json(
            errorResponse(ErrorCodes.ALREADY_EXISTS, "Coupon code already exists")
          );
        }
      }

      const updateData: Record<string, unknown> = {};

      if (parsed.data.code !== undefined) updateData.code = parsed.data.code;
      if (parsed.data.discountType !== undefined) updateData.discountType = parsed.data.discountType;
      if (parsed.data.discountValue !== undefined) updateData.discountValue = parsed.data.discountValue;
      if (parsed.data.minPurchase !== undefined) updateData.minPurchase = parsed.data.minPurchase;
      if (parsed.data.maxUses !== undefined) updateData.maxUses = parsed.data.maxUses;
      if (parsed.data.validFrom !== undefined) {
        updateData.validFrom = parsed.data.validFrom ? new Date(parsed.data.validFrom) : null;
      }
      if (parsed.data.validUntil !== undefined) {
        updateData.validUntil = parsed.data.validUntil ? new Date(parsed.data.validUntil) : null;
      }
      if (parsed.data.isActive !== undefined) updateData.isActive = parsed.data.isActive;

      const coupon = await db.coupon.update({
        where: { id },
        data: updateData,
      });

      await auditService.log({
        userId: req.user.userId,
        action: "UPDATE",
        entity: "Coupon",
        entityId: id,
        changes: { old: existing, new: coupon },
        req,
      });

      res.json(successResponse({ coupon }));
    } catch (error) {
      next(error);
    }
  },

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;

      const existing = await db.coupon.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, "Coupon not found"));
      }

      await db.coupon.delete({ where: { id } });

      await auditService.log({
        userId: req.user.userId,
        action: "DELETE",
        entity: "Coupon",
        entityId: id,
        changes: { old: existing },
        req,
      });

      res.json(successResponse({ message: "Coupon deleted" }));
    } catch (error) {
      next(error);
    }
  },

  // ============================================================================
  // Public endpoint (validate coupon)
  // ============================================================================

  async validateCoupon(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = validateCouponSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json(
          errorResponse(ErrorCodes.VALIDATION_ERROR, "Invalid input", parsed.error.flatten())
        );
      }

      const { code, purchaseAmount } = parsed.data;

      const coupon = await db.coupon.findUnique({
        where: { code: code.toUpperCase() },
      });

      if (!coupon) {
        return res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, "Coupon not found"));
      }

      // Check if coupon is active
      if (!coupon.isActive) {
        return res.status(400).json(
          errorResponse(ErrorCodes.VALIDATION_ERROR, "Coupon is inactive")
        );
      }

      // Check validity dates
      const now = new Date();
      if (coupon.validFrom && now < coupon.validFrom) {
        return res.status(400).json(
          errorResponse(ErrorCodes.VALIDATION_ERROR, "Coupon is not yet valid")
        );
      }

      if (coupon.validUntil && now > coupon.validUntil) {
        return res.status(400).json(
          errorResponse(ErrorCodes.VALIDATION_ERROR, "Coupon has expired")
        );
      }

      // Check usage limit
      if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
        return res.status(400).json(
          errorResponse(ErrorCodes.VALIDATION_ERROR, "Coupon usage limit reached")
        );
      }

      // Check minimum purchase
      if (coupon.minPurchase !== null && purchaseAmount !== undefined) {
        if (purchaseAmount < coupon.minPurchase) {
          return res.status(400).json(
            errorResponse(
              ErrorCodes.VALIDATION_ERROR,
              `Minimum purchase amount of ${coupon.minPurchase} required`
            )
          );
        }
      }

      // Calculate discount if purchase amount is provided
      let discountAmount: number | null = null;
      let finalAmount: number | null = null;

      if (purchaseAmount !== undefined) {
        if (coupon.discountType === "PERCENTAGE") {
          discountAmount = (purchaseAmount * coupon.discountValue) / 100;
        } else {
          discountAmount = Math.min(coupon.discountValue, purchaseAmount);
        }
        finalAmount = purchaseAmount - discountAmount;
      }

      res.json(
        successResponse({
          valid: true,
          coupon: {
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            minPurchase: coupon.minPurchase,
          },
          calculation: purchaseAmount !== undefined
            ? {
                originalAmount: purchaseAmount,
                discountAmount,
                finalAmount,
              }
            : null,
        })
      );
    } catch (error) {
      next(error);
    }
  },

  // ============================================================================
  // Utility: Increment coupon usage (to be called after successful purchase)
  // ============================================================================

  async incrementUsage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { code } = req.body as { code: string };

      if (!code) {
        return res.status(400).json(
          errorResponse(ErrorCodes.VALIDATION_ERROR, "Coupon code is required")
        );
      }

      const coupon = await db.coupon.findUnique({
        where: { code: code.toUpperCase() },
      });

      if (!coupon) {
        return res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, "Coupon not found"));
      }

      const updatedCoupon = await db.coupon.update({
        where: { id: coupon.id },
        data: { usedCount: { increment: 1 } },
      });

      await auditService.log({
        userId: req.user.userId,
        action: "UPDATE",
        entity: "Coupon",
        entityId: coupon.id,
        changes: { old: { usedCount: coupon.usedCount }, new: { usedCount: updatedCoupon.usedCount } },
        metadata: { action: "increment_usage" },
        req,
      });

      res.json(successResponse({ coupon: updatedCoupon }));
    } catch (error) {
      next(error);
    }
  },
};
