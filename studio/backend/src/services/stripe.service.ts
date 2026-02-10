import Stripe from "stripe";
import { env } from "../config/env.js";
import { prisma } from "../config/db.js";
import { ApiError } from "../utils/errors.js";
import { v4 as uuidv4 } from "uuid";

// =====================================================
// Stripe Configuration
// =====================================================

const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY)
  : null;

// =====================================================
// Types
// =====================================================

export interface CreateCheckoutSessionParams {
  tier: string;
  selectedFeatures: string[];
  templateId?: string;
  email: string;
  couponCode?: string;
  customerName?: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CheckoutSessionResult {
  sessionId: string;
  url: string;
}

export interface ValidateCouponResult {
  valid: boolean;
  coupon?: {
    id: string;
    code: string;
    type: "PERCENTAGE" | "FIXED";
    value: number;
    discountAmount?: number;
  };
  error?: string;
}

export interface WebhookResult {
  handled: boolean;
  event: string;
  orderId?: string;
}

// =====================================================
// Stripe Service
// =====================================================

class StripeService {
  /**
   * Check if Stripe is configured
   */
  isConfigured(): boolean {
    return stripe !== null;
  }

  /**
   * Get Stripe instance (throws if not configured)
   */
  private getStripe(): Stripe {
    if (!stripe) {
      throw ApiError.internal("Stripe is not configured. Please set STRIPE_SECRET_KEY.");
    }
    return stripe;
  }

  /**
   * Create a Stripe Checkout Session
   */
  async createCheckoutSession(
    params: CreateCheckoutSessionParams
  ): Promise<CheckoutSessionResult> {
    const stripeClient = this.getStripe();

    // Get tier pricing
    const tier = await prisma.pricingTier.findFirst({
      where: { slug: params.tier, isActive: true },
    });

    if (!tier) {
      throw ApiError.badRequest("Invalid tier selected");
    }

    // Get selected features with prices
    const features = await prisma.feature.findMany({
      where: {
        slug: { in: params.selectedFeatures },
        isActive: true,
      },
      select: {
        slug: true,
        name: true,
        price: true,
      },
    });

    // Calculate add-on features (not included in tier)
    const tierIncludedSet = new Set(tier.includedFeatures);
    const addOnFeatures = features.filter((f) => !tierIncludedSet.has(f.slug));

    // Calculate prices
    const tierPrice = tier.price;
    const featuresPrice = addOnFeatures.reduce((sum, f) => sum + f.price, 0);
    let subtotal = tierPrice + featuresPrice;

    // Build line items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${tier.name} Tier`,
            description: `Fullstack Starter Kit - ${tier.name} tier with ${tier.includedFeatures.length} included features`,
          },
          unit_amount: tierPrice, // Already in cents
        },
        quantity: 1,
      },
    ];

    // Add add-on features as separate line items
    for (const feature of addOnFeatures) {
      if (feature.price > 0) {
        lineItems.push({
          price_data: {
            currency: "usd",
            product_data: {
              name: `Add-on: ${feature.name}`,
              description: `${feature.name} feature module`,
            },
            unit_amount: feature.price,
          },
          quantity: 1,
        });
      }
    }

    // Prepare session metadata
    const orderNumber = `FS-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const metadata: Record<string, string> = {
      orderNumber,
      tier: params.tier,
      selectedFeatures: JSON.stringify(params.selectedFeatures),
      email: params.email,
    };

    if (params.templateId) {
      metadata.templateId = params.templateId;
    }

    if (params.customerName) {
      metadata.customerName = params.customerName;
    }

    // Handle coupon
    let discounts: Stripe.Checkout.SessionCreateParams.Discount[] = [];
    if (params.couponCode) {
      const couponResult = await this.validateCoupon(params.couponCode, subtotal);
      if (couponResult.valid && couponResult.coupon) {
        // For Stripe, we need to create a coupon on the fly or use an existing one
        try {
          // Try to find existing Stripe coupon
          let stripeCoupon: Stripe.Coupon;
          try {
            stripeCoupon = await stripeClient.coupons.retrieve(params.couponCode.toUpperCase());
          } catch {
            // Create new Stripe coupon
            stripeCoupon = await stripeClient.coupons.create({
              id: params.couponCode.toUpperCase(),
              ...(couponResult.coupon.type === "PERCENTAGE"
                ? { percent_off: couponResult.coupon.value }
                : { amount_off: couponResult.coupon.value, currency: "usd" }),
              duration: "once",
            });
          }
          discounts = [{ coupon: stripeCoupon.id }];
          metadata.couponCode = params.couponCode.toUpperCase();
        } catch (error) {
          console.error("Failed to apply coupon to Stripe:", error);
          // Continue without coupon
        }
      }
    }

    // Create Stripe Checkout Session
    const successUrl = params.successUrl ||
      env.STRIPE_SUCCESS_URL ||
      `${env.CORS_ORIGIN}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;

    const cancelUrl = params.cancelUrl ||
      env.STRIPE_CANCEL_URL ||
      `${env.CORS_ORIGIN}/checkout?cancelled=true`;

    const session = await stripeClient.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      discounts,
      customer_email: params.email,
      metadata,
      success_url: successUrl,
      cancel_url: cancelUrl,
      billing_address_collection: "required",
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes
    });

    if (!session.url) {
      throw ApiError.internal("Failed to create checkout session URL");
    }

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  /**
   * Validate a coupon code
   */
  async validateCoupon(
    code: string,
    subtotal?: number
  ): Promise<ValidateCouponResult> {
    const coupon = await prisma.studioCoupon.findFirst({
      where: {
        code: code.toUpperCase(),
        isActive: true,
      },
    });

    if (!coupon) {
      return { valid: false, error: "Invalid or expired coupon code" };
    }

    // Check expiration
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return { valid: false, error: "This coupon has expired" };
    }

    // Check start date
    if (coupon.startsAt && new Date(coupon.startsAt) > new Date()) {
      return { valid: false, error: "This coupon is not yet active" };
    }

    // Check usage limit
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return { valid: false, error: "This coupon has reached its usage limit" };
    }

    // Check minimum purchase
    if (coupon.minPurchase && subtotal && subtotal < coupon.minPurchase) {
      const minAmount = (coupon.minPurchase / 100).toFixed(2);
      return {
        valid: false,
        error: `Minimum purchase of $${minAmount} required for this coupon`,
      };
    }

    // Calculate discount amount
    let discountAmount: number | undefined;
    if (subtotal) {
      if (coupon.type === "PERCENTAGE") {
        discountAmount = Math.round(subtotal * (coupon.value / 100));
      } else {
        discountAmount = Math.min(coupon.value, subtotal);
      }
    }

    return {
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discountAmount,
      },
    };
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(
    payload: Buffer | string,
    signature: string
  ): Promise<WebhookResult> {
    const stripeClient = this.getStripe();

    if (!env.STRIPE_WEBHOOK_SECRET) {
      throw ApiError.internal("Stripe webhook secret is not configured");
    }

    let event: Stripe.Event;
    try {
      event = stripeClient.webhooks.constructEvent(
        payload,
        signature,
        env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      throw ApiError.badRequest(
        `Webhook signature verification failed: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = await this.handleCheckoutComplete(session);
        return { handled: true, event: event.type, orderId };
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`Checkout session expired: ${session.id}`);
        return { handled: true, event: event.type };
      }

      case "payment_intent.succeeded": {
        console.log(`Payment succeeded: ${(event.data.object as Stripe.PaymentIntent).id}`);
        return { handled: true, event: event.type };
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`Payment failed: ${paymentIntent.id}`);
        // Could update order status to FAILED here if order already exists
        return { handled: true, event: event.type };
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
        return { handled: false, event: event.type };
    }
  }

  /**
   * Handle checkout.session.completed webhook
   */
  private async handleCheckoutComplete(
    session: Stripe.Checkout.Session
  ): Promise<string> {
    const metadata = session.metadata || {};

    // Find or create user
    let user = await prisma.studioUser.findUnique({
      where: { email: metadata.email },
    });

    if (!user) {
      user = await prisma.studioUser.create({
        data: {
          email: metadata.email,
          name: metadata.customerName || null,
          emailVerified: true, // Verified through payment
        },
      });
    }

    // Parse selected features
    let selectedFeatures: string[] = [];
    try {
      selectedFeatures = JSON.parse(metadata.selectedFeatures || "[]");
    } catch {
      selectedFeatures = [];
    }

    // Get coupon if applied
    let couponId: string | null = null;
    if (metadata.couponCode) {
      const coupon = await prisma.studioCoupon.findUnique({
        where: { code: metadata.couponCode },
      });
      if (coupon) {
        couponId = coupon.id;
        // Increment usage count
        await prisma.studioCoupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        });
      }
    }

    // Calculate discount
    const discount = session.total_details?.amount_discount || 0;

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber: metadata.orderNumber,
        userId: user.id,
        customerEmail: metadata.email,
        customerName: metadata.customerName || null,
        tier: metadata.tier,
        templateId: metadata.templateId || null,
        selectedFeatures,
        subtotal: session.amount_subtotal || 0,
        discount,
        tax: session.total_details?.amount_tax || 0,
        total: session.amount_total || 0,
        currency: session.currency || "usd",
        couponId,
        couponCode: metadata.couponCode || null,
        status: "COMPLETED",
        paymentMethod: "stripe",
        paymentId: session.payment_intent as string,
        paidAt: new Date(),
      },
    });

    // Generate license
    const licenseKey = `FS-${uuidv4().split("-").slice(0, 3).join("-").toUpperCase()}`;
    const downloadToken = uuidv4();

    await prisma.license.create({
      data: {
        orderId: order.id,
        licenseKey,
        downloadToken,
        maxDownloads: 5,
        status: "ACTIVE",
      },
    });

    console.log(`Order created: ${order.orderNumber} for ${metadata.email}`);

    return order.id;
  }

  /**
   * Process a refund for an order
   */
  async processRefund(
    paymentIntentId: string,
    reason?: string
  ): Promise<{ refundId: string; status: string }> {
    const stripeClient = this.getStripe();

    try {
      const refund = await stripeClient.refunds.create({
        payment_intent: paymentIntentId,
        reason: "requested_by_customer",
        metadata: {
          custom_reason: reason || "Customer requested refund",
        },
      });

      return {
        refundId: refund.id,
        status: refund.status || "succeeded",
      };
    } catch (error) {
      const stripeError = error as Stripe.errors.StripeError;
      throw ApiError.badRequest(
        `Refund failed: ${stripeError.message || "Unknown error"}`
      );
    }
  }

  /**
   * Get checkout session status
   */
  async getSessionStatus(sessionId: string): Promise<{
    status: "pending" | "complete" | "expired";
    orderNumber?: string;
    customerEmail?: string;
  }> {
    const stripeClient = this.getStripe();

    try {
      const session = await stripeClient.checkout.sessions.retrieve(sessionId);

      if (session.status === "complete") {
        return {
          status: "complete",
          orderNumber: session.metadata?.orderNumber,
          customerEmail: session.customer_email || undefined,
        };
      } else if (session.status === "expired") {
        return { status: "expired" };
      } else {
        return { status: "pending" };
      }
    } catch (error) {
      throw ApiError.notFound("Session");
    }
  }
}

// Export singleton instance
export const stripeService = new StripeService();
