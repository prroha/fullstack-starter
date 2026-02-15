/**
 * Coupon Service
 *
 * Business logic for coupon management and validation.
 */

import { db } from "../lib/db.js";
import { DiscountType } from "@prisma/client";
import { ApiError } from "../middleware/error.middleware.js";
import { ErrorCodes } from "../utils/response.js";

// ============================================================================
// Types
// ============================================================================

export interface CreateCouponInput {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minPurchase?: number | null;
  maxUses?: number | null;
  validFrom?: Date | null;
  validUntil?: Date | null;
  isActive?: boolean;
}

export interface UpdateCouponInput {
  code?: string;
  discountType?: DiscountType;
  discountValue?: number;
  minPurchase?: number | null;
  maxUses?: number | null;
  validFrom?: Date | null;
  validUntil?: Date | null;
  isActive?: boolean;
}

export interface GetCouponsParams {
  page?: number;
  limit?: number;
  isActive?: boolean;
  search?: string;
}

export interface CouponValidationResult {
  valid: boolean;
  coupon: {
    code: string;
    discountType: DiscountType;
    discountValue: number;
    minPurchase: number | null;
  };
  calculation: {
    originalAmount: number;
    discountAmount: number;
    finalAmount: number;
  } | null;
}

// ============================================================================
// Service Class
// ============================================================================

class CouponService {
  /**
   * Get paginated list of coupons (admin)
   */
  async getAll(params: GetCouponsParams = {}) {
    const { page = 1, limit = 10, isActive, search } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      where.code = { contains: search.toUpperCase(), mode: "insensitive" };
    }

    const [coupons, total] = await Promise.all([
      db.coupon.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.coupon.count({ where }),
    ]);

    return { coupons, total, page, limit };
  }

  /**
   * Get coupon by ID
   */
  async getById(id: string) {
    const coupon = await db.coupon.findUnique({ where: { id } });
    if (!coupon) {
      throw ApiError.notFound("Coupon not found");
    }
    return coupon;
  }

  /**
   * Get coupon by code
   */
  async getByCode(code: string) {
    const coupon = await db.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });
    if (!coupon) {
      throw ApiError.notFound("Coupon not found");
    }
    return coupon;
  }

  /**
   * Create coupon
   */
  async create(input: CreateCouponInput) {
    // Check if code already exists
    const existing = await db.coupon.findUnique({
      where: { code: input.code },
    });
    if (existing) {
      throw ApiError.conflict("Coupon code already exists", ErrorCodes.ALREADY_EXISTS);
    }

    return db.coupon.create({
      data: {
        code: input.code,
        discountType: input.discountType,
        discountValue: input.discountValue,
        minPurchase: input.minPurchase ?? null,
        maxUses: input.maxUses ?? null,
        validFrom: input.validFrom ?? null,
        validUntil: input.validUntil ?? null,
        isActive: input.isActive ?? true,
      },
    });
  }

  /**
   * Update coupon
   */
  async update(id: string, input: UpdateCouponInput) {
    const existing = await db.coupon.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound("Coupon not found");
    }

    // If code is being updated, check for uniqueness
    if (input.code && input.code !== existing.code) {
      const codeExists = await db.coupon.findUnique({
        where: { code: input.code },
      });
      if (codeExists) {
        throw ApiError.conflict("Coupon code already exists", ErrorCodes.ALREADY_EXISTS);
      }
    }

    return db.coupon.update({
      where: { id },
      data: input,
    });
  }

  /**
   * Delete coupon
   */
  async delete(id: string) {
    const existing = await db.coupon.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound("Coupon not found");
    }

    await db.coupon.delete({ where: { id } });
    return existing;
  }

  /**
   * Validate coupon and calculate discount
   */
  async validate(code: string, purchaseAmount?: number): Promise<CouponValidationResult> {
    const coupon = await this.getByCode(code);

    // Check if coupon is active
    if (!coupon.isActive) {
      throw ApiError.badRequest("Coupon is inactive", ErrorCodes.VALIDATION_ERROR);
    }

    // Check validity dates
    const now = new Date();
    if (coupon.validFrom && now < coupon.validFrom) {
      throw ApiError.badRequest("Coupon is not yet valid", ErrorCodes.VALIDATION_ERROR);
    }
    if (coupon.validUntil && now > coupon.validUntil) {
      throw ApiError.badRequest("Coupon has expired", ErrorCodes.VALIDATION_ERROR);
    }

    // Check usage limit
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      throw ApiError.badRequest("Coupon usage limit reached", ErrorCodes.VALIDATION_ERROR);
    }

    // Check minimum purchase
    if (coupon.minPurchase !== null && purchaseAmount !== undefined) {
      if (purchaseAmount < coupon.minPurchase) {
        throw ApiError.badRequest(
          `Minimum purchase amount of ${coupon.minPurchase} required`,
          ErrorCodes.VALIDATION_ERROR
        );
      }
    }

    // Calculate discount if purchase amount is provided
    let calculation: CouponValidationResult["calculation"] = null;
    if (purchaseAmount !== undefined) {
      let discountAmount: number;
      if (coupon.discountType === "PERCENTAGE") {
        discountAmount = (purchaseAmount * coupon.discountValue) / 100;
      } else {
        discountAmount = Math.min(coupon.discountValue, purchaseAmount);
      }
      calculation = {
        originalAmount: purchaseAmount,
        discountAmount,
        finalAmount: purchaseAmount - discountAmount,
      };
    }

    return {
      valid: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minPurchase: coupon.minPurchase,
      },
      calculation,
    };
  }

  /**
   * Increment coupon usage count
   */
  async incrementUsage(code: string) {
    const coupon = await this.getByCode(code);

    return db.coupon.update({
      where: { id: coupon.id },
      data: { usedCount: { increment: 1 } },
    });
  }

  /**
   * Get all coupons for export
   */
  async getAllForExport() {
    return db.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const couponService = new CouponService();
