import { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { stripeService } from "../../services/stripe.service.js";
import { sendSuccess } from "../../utils/response.js";
import { ApiError } from "../../utils/errors.js";

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

const routePlugin: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /api/checkout/create-session
   * Create a Stripe Checkout Session
   */
  fastify.post("/create-session", async (req: FastifyRequest, reply: FastifyReply) => {
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

    return sendSuccess(reply, result, "Checkout session created", 201);
  });

  /**
   * POST /api/checkout/validate-coupon
   * Validate a coupon code
   */
  fastify.post("/validate-coupon", async (req: FastifyRequest, reply: FastifyReply) => {
    // Validate request body
    const parseResult = validateCouponSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw ApiError.validation(parseResult.error.flatten().fieldErrors);
    }

    const result = await stripeService.validateCoupon(
      parseResult.data.code,
      parseResult.data.subtotal
    );

    return sendSuccess(reply, result);
  });

  /**
   * POST /api/checkout/webhook
   * Handle Stripe webhooks
   *
   * Registered in a sub-plugin with raw body parsing for Stripe signature verification.
   */
  await fastify.register(async (webhookScope) => {
    webhookScope.removeAllContentTypeParsers();
    webhookScope.addContentTypeParser(
      "application/json",
      { parseAs: "buffer" },
      (_req: FastifyRequest, body: Buffer, done: (err: null, body: Buffer) => void) => {
        done(null, body);
      }
    );

    webhookScope.post(
      "/webhook",
      async (req: FastifyRequest, reply: FastifyReply) => {
        try {
          const signature = req.headers["stripe-signature"];

          if (!signature || typeof signature !== "string") {
            throw ApiError.badRequest("Missing Stripe signature header");
          }

          const rawBody = req.body as Buffer;
          const result = await stripeService.handleWebhook(rawBody, signature);

          // Always return 200 to Stripe to acknowledge receipt
          return reply.code(200).send({ received: true, ...result });
        } catch (error) {
          // For webhooks, we should still return 200 in some cases
          // to prevent Stripe from retrying failed events
          if (error instanceof ApiError && error.statusCode === 400) {
            // Signature verification failed - this is a real error
            throw error;
          } else {
            // Return 500 for processing errors so Stripe retries
            console.error("Webhook processing error:", error);
            return reply.code(500).send({ received: false, error: "Processing error - will retry" });
          }
        }
      }
    );
  });

  /**
   * GET /api/checkout/session/:id
   * Get checkout session status
   */
  fastify.get("/session/:id", async (req: FastifyRequest, reply: FastifyReply) => {
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

    return sendSuccess(reply, result);
  });
};

export { routePlugin as checkoutRoutes };
