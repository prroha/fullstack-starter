/**
 * Coupon Controller
 *
 * Handles HTTP requests for coupon management and validation.
 * Delegates business logic to couponService.
 */

import { FastifyRequest, FastifyReply } from "fastify";
import { AuthenticatedRequest } from "../types/index.js";
import { couponService } from "../services/coupon.service.js";
import { auditService } from "../services/audit.service.js";
import { successResponse, paginatedResponse } from "../utils/response.js";
import { z } from "zod";
import { DiscountType } from "@prisma/client";
import { booleanFilterSchema, paginationSchema } from "../utils/validation-schemas.js";
import { validateOrRespond, sendCsvExport } from "../utils/controller-helpers.js";

// ============================================================================
// Validation Schemas
// ============================================================================

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

const incrementUsageSchema = z.object({
  code: z.string().min(1, "Coupon code is required"),
});

const getCouponsQuerySchema = paginationSchema.extend({
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  isActive: booleanFilterSchema,
  search: z.string().optional(),
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parse date strings to Date objects for coupon dates
 */
function parseCouponDates(data: {
  validFrom?: string | null;
  validUntil?: string | null;
}): { validFrom?: Date | null; validUntil?: Date | null } {
  const result: { validFrom?: Date | null; validUntil?: Date | null } = {};

  if (data.validFrom !== undefined) {
    result.validFrom = data.validFrom ? new Date(data.validFrom) : null;
  }
  if (data.validUntil !== undefined) {
    result.validUntil = data.validUntil ? new Date(data.validUntil) : null;
  }

  return result;
}

// ============================================================================
// Controller
// ============================================================================

export const couponController = {
  // ==========================================================================
  // Admin Coupon Management
  // ==========================================================================

  async getAll(req: FastifyRequest, reply: FastifyReply) {
    const query = getCouponsQuerySchema.parse(req.query);
    const result = await couponService.getAll({
      page: query.page,
      limit: query.limit,
      isActive: query.isActive,
      search: query.search,
    });

    return reply.send(paginatedResponse(result.coupons, result.page, result.limit, result.total));
  },

  async getById(req: FastifyRequest, reply: FastifyReply) {
    const id = (req.params as Record<string, string>).id;
    const coupon = await couponService.getById(id);
    return reply.send(successResponse({ coupon }));
  },

  async create(req: FastifyRequest, reply: FastifyReply) {
    const authReq = req as AuthenticatedRequest;
    const validated = validateOrRespond(couponSchema, req.body, reply);
    if (!validated) return;

    const { validFrom, validUntil, ...rest } = validated;
    const coupon = await couponService.create({
      ...rest,
      ...parseCouponDates({ validFrom, validUntil }),
    });

    await auditService.log({
      userId: authReq.user.userId,
      action: "CREATE",
      entity: "Coupon",
      entityId: coupon.id,
      changes: { new: validated },
      req,
    });

    return reply.code(201).send(successResponse({ coupon }));
  },

  async update(req: FastifyRequest, reply: FastifyReply) {
    const authReq = req as AuthenticatedRequest;
    const id = (req.params as Record<string, string>).id;
    const validated = validateOrRespond(couponSchema.partial(), req.body, reply);
    if (!validated) return;

    const existing = await couponService.getById(id);

    const { validFrom, validUntil, ...rest } = validated;
    const coupon = await couponService.update(id, {
      ...rest,
      ...parseCouponDates({ validFrom, validUntil }),
    });

    await auditService.log({
      userId: authReq.user.userId,
      action: "UPDATE",
      entity: "Coupon",
      entityId: id,
      changes: { old: existing, new: coupon },
      req,
    });

    return reply.send(successResponse({ coupon }));
  },

  async delete(req: FastifyRequest, reply: FastifyReply) {
    const authReq = req as AuthenticatedRequest;
    const id = (req.params as Record<string, string>).id;
    const existing = await couponService.delete(id);

    await auditService.log({
      userId: authReq.user.userId,
      action: "DELETE",
      entity: "Coupon",
      entityId: id,
      changes: { old: existing },
      req,
    });

    return reply.send(successResponse({ message: "Coupon deleted" }));
  },

  // ==========================================================================
  // Public endpoint (validate coupon)
  // ==========================================================================

  async validateCoupon(req: FastifyRequest, reply: FastifyReply) {
    const validated = validateOrRespond(validateCouponSchema, req.body, reply);
    if (!validated) return;

    const result = await couponService.validate(validated.code, validated.purchaseAmount);
    return reply.send(successResponse(result));
  },

  // ==========================================================================
  // Utility: Increment coupon usage (to be called after successful purchase)
  // ==========================================================================

  async incrementUsage(req: FastifyRequest, reply: FastifyReply) {
    const authReq = req as AuthenticatedRequest;
    const validated = validateOrRespond(incrementUsageSchema, req.body, reply);
    if (!validated) return;

    const previousCoupon = await couponService.getByCode(validated.code);
    const coupon = await couponService.incrementUsage(validated.code);

    await auditService.log({
      userId: authReq.user.userId,
      action: "UPDATE",
      entity: "Coupon",
      entityId: coupon.id,
      changes: { old: { usedCount: previousCoupon.usedCount }, new: { usedCount: coupon.usedCount } },
      metadata: { action: "increment_usage" },
      req,
    });

    return reply.send(successResponse({ coupon }));
  },

  /**
   * Export all coupons as CSV (admin only)
   * GET /api/v1/admin/coupons/export
   */
  async exportCoupons(req: FastifyRequest, reply: FastifyReply) {
    const coupons = await couponService.getAllForExport();

    sendCsvExport(reply, coupons, [
      { header: "ID", accessor: "id" },
      { header: "Code", accessor: "code" },
      { header: "Discount Type", accessor: "discountType" },
      { header: "Discount Value", accessor: "discountValue" },
      { header: "Min Purchase", accessor: (item) => item.minPurchase?.toString() || "" },
      { header: "Max Uses", accessor: (item) => item.maxUses?.toString() || "" },
      { header: "Used Count", accessor: "usedCount" },
      { header: "Valid From", accessor: (item) => item.validFrom?.toISOString() || "" },
      { header: "Valid Until", accessor: (item) => item.validUntil?.toISOString() || "" },
      { header: "Active", accessor: "isActive" },
      { header: "Created At", accessor: (item) => item.createdAt.toISOString() },
      { header: "Updated At", accessor: (item) => item.updatedAt.toISOString() },
    ], { filenamePrefix: "coupons-export" });
  },
};
