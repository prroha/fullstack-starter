import { Router, raw } from "express";
import { z } from "zod";
import { stripeService } from "../../services/stripe.service.js";
import { sendSuccess } from "../../utils/response.js";
import { ApiError } from "../../utils/errors.js";

const router = Router();

// =====================================================
// Validation Schemas
// =====================================================

const createSessionSchema = z.object({
  tier: z.string().min(1).max(50),
  selectedFeatures: z.array(z.string().max(100)).max(100),
  templateId: z.string().max(100).optional(),
  email: z.string().email(),
  couponCode: z.string().max(50).optional(),
  customerName: z.string().max(200).optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

const validateCouponSchema = z.object({
  code: z.string().min(1).max(50),
  subtotal: z.number().int().min(0).optional(),
});

const sessionIdParamSchema = z.object({
  id: z.string().min(1).max(200),
});

// =====================================================
// Routes
// =====================================================

/**
 * POST /api/checkout/create-session
 * Create a Stripe Checkout Session
 */
router.post("/create-session", async (req, res, next) => {
  try {
    // Check if Stripe is configured
    if (!stripeService.isConfigured()) {
      throw ApiError.internal("Payment processing is not configured");
    }

    // Validate request body
    const parseResult = createSessionSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw ApiError.validation(parseResult.error.flatten().fieldErrors);
    }

    const result = await stripeService.createCheckoutSession(parseResult.data);

    sendSuccess(res, result, "Checkout session created", 201);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/checkout/validate-coupon
 * Validate a coupon code
 */
router.post("/validate-coupon", async (req, res, next) => {
  try {
    // Validate request body
    const parseResult = validateCouponSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw ApiError.validation(parseResult.error.flatten().fieldErrors);
    }

    const result = await stripeService.validateCoupon(
      parseResult.data.code,
      parseResult.data.subtotal
    );

    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/checkout/webhook
 * Handle Stripe webhooks
 *
 * NOTE: This endpoint needs raw body parsing, configured separately
 */
router.post(
  "/webhook",
  raw({ type: "application/json" }),
  async (req, res, next) => {
    try {
      const signature = req.headers["stripe-signature"];

      if (!signature || typeof signature !== "string") {
        throw ApiError.badRequest("Missing Stripe signature header");
      }

      const result = await stripeService.handleWebhook(req.body, signature);

      // Always return 200 to Stripe to acknowledge receipt
      res.status(200).json({ received: true, ...result });
    } catch (error) {
      // For webhooks, we should still return 200 in some cases
      // to prevent Stripe from retrying failed events
      if (error instanceof ApiError && error.statusCode === 400) {
        // Signature verification failed - this is a real error
        next(error);
      } else {
        // Log the error but acknowledge receipt
        console.error("Webhook processing error:", error);
        res.status(200).json({ received: true, error: "Processing error logged" });
      }
    }
  }
);

/**
 * GET /api/checkout/session/:id
 * Get checkout session status
 */
router.get("/session/:id", async (req, res, next) => {
  try {
    // Check if Stripe is configured
    if (!stripeService.isConfigured()) {
      throw ApiError.internal("Payment processing is not configured");
    }

    // Validate params
    const parseResult = sessionIdParamSchema.safeParse(req.params);
    if (!parseResult.success) {
      throw ApiError.validation(parseResult.error.flatten().fieldErrors);
    }

    const result = await stripeService.getSessionStatus(parseResult.data.id);

    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
});

export { router as checkoutRoutes };
