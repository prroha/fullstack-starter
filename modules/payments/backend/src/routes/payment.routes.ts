import { Router, Request, Response, NextFunction } from 'express';
import { getPaymentService } from '../services/payment.service';
import Stripe from 'stripe';

// =============================================================================
// Types
// =============================================================================

interface CheckoutRequest {
  priceId: string;
  customerId?: string;
  customerEmail?: string;
  successUrl?: string;
  cancelUrl?: string;
  trialDays?: number;
}

interface PortalRequest {
  customerId: string;
  returnUrl?: string;
}

// Authenticated request type - import from your auth middleware or define here
interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
  };
  dbUser: {
    id: string;
    email: string;
    stripeCustomerId?: string | null;
  };
}

// =============================================================================
// Auth Middleware Import
// =============================================================================

// Import your auth middleware from the core backend
// Adjust the import path based on your project structure
// import { authMiddleware } from '../../../../core/backend/src/middleware/auth.middleware';

// Placeholder auth middleware - replace with your actual import
const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // This is a placeholder - replace with actual auth middleware import
  // The actual middleware should verify JWT and attach user to request
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  // Placeholder - actual middleware would verify token and load user
  next();
};

// =============================================================================
// Database Operations
// =============================================================================

// Placeholder database operations - replace with your actual Prisma client
// import { db } from '../../../../core/backend/src/lib/db';

interface SubscriptionRecord {
  id: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  userId: string;
  status: string;
  priceId: string;
  productId: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface PaymentRecord {
  id: string;
  stripePaymentIntentId?: string;
  stripeInvoiceId?: string;
  stripeCustomerId: string;
  userId?: string;
  amount: number;
  currency: string;
  status: string;
  metadata?: Record<string, string>;
  createdAt: Date;
}

// Database operations placeholder - replace with actual Prisma calls
const dbOperations = {
  /**
   * Find user by Stripe customer ID
   */
  async findUserByStripeCustomerId(
    stripeCustomerId: string
  ): Promise<{ id: string; email: string } | null> {
    // Replace with: return db.user.findFirst({ where: { stripeCustomerId } });
    console.log('[DB] Finding user by Stripe customer ID:', stripeCustomerId);
    return null;
  },

  /**
   * Find user by email
   */
  async findUserByEmail(
    email: string
  ): Promise<{ id: string; email: string; stripeCustomerId?: string } | null> {
    // Replace with: return db.user.findUnique({ where: { email } });
    console.log('[DB] Finding user by email:', email);
    return null;
  },

  /**
   * Update user's Stripe customer ID
   */
  async updateUserStripeCustomerId(
    userId: string,
    stripeCustomerId: string
  ): Promise<void> {
    // Replace with: await db.user.update({ where: { id: userId }, data: { stripeCustomerId } });
    console.log('[DB] Updating user stripe customer ID:', userId, stripeCustomerId);
  },

  /**
   * Create or update subscription record
   */
  async upsertSubscription(data: {
    stripeSubscriptionId: string;
    stripeCustomerId: string;
    userId?: string;
    status: string;
    priceId: string;
    productId: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
  }): Promise<SubscriptionRecord> {
    // Replace with actual Prisma upsert:
    // return db.subscription.upsert({
    //   where: { stripeSubscriptionId: data.stripeSubscriptionId },
    //   create: data,
    //   update: data,
    // });
    console.log('[DB] Upserting subscription:', data.stripeSubscriptionId);
    return {
      id: 'sub_db_' + Date.now(),
      ...data,
      userId: data.userId || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  /**
   * Delete subscription record
   */
  async deleteSubscription(stripeSubscriptionId: string): Promise<void> {
    // Replace with: await db.subscription.delete({ where: { stripeSubscriptionId } });
    console.log('[DB] Deleting subscription:', stripeSubscriptionId);
  },

  /**
   * Find subscription by Stripe ID
   */
  async findSubscription(
    stripeSubscriptionId: string
  ): Promise<SubscriptionRecord | null> {
    // Replace with: return db.subscription.findUnique({ where: { stripeSubscriptionId } });
    console.log('[DB] Finding subscription:', stripeSubscriptionId);
    return null;
  },

  /**
   * Create payment record
   */
  async createPayment(data: {
    stripePaymentIntentId?: string;
    stripeInvoiceId?: string;
    stripeCustomerId: string;
    userId?: string;
    amount: number;
    currency: string;
    status: string;
    metadata?: Record<string, string>;
  }): Promise<PaymentRecord> {
    // Replace with: return db.payment.create({ data });
    console.log('[DB] Creating payment:', data.stripeInvoiceId || data.stripePaymentIntentId);
    return {
      id: 'pay_db_' + Date.now(),
      ...data,
      createdAt: new Date(),
    };
  },

  /**
   * Check if payment already processed (idempotency)
   */
  async isPaymentProcessed(stripeInvoiceId: string): Promise<boolean> {
    // Replace with: return !!(await db.payment.findUnique({ where: { stripeInvoiceId } }));
    console.log('[DB] Checking if payment processed:', stripeInvoiceId);
    return false;
  },

  /**
   * Check if webhook event already processed (idempotency)
   */
  async isEventProcessed(eventId: string): Promise<boolean> {
    // Replace with: return !!(await db.webhookEvent.findUnique({ where: { stripeEventId: eventId } }));
    console.log('[DB] Checking if event processed:', eventId);
    return false;
  },

  /**
   * Record processed webhook event
   */
  async recordProcessedEvent(
    eventId: string,
    eventType: string
  ): Promise<void> {
    // Replace with: await db.webhookEvent.create({ data: { stripeEventId: eventId, eventType } });
    console.log('[DB] Recording processed event:', eventId, eventType);
  },
};

// =============================================================================
// Router Setup
// =============================================================================

const router = Router();
const payments = getPaymentService();

// Default URLs
const DEFAULT_SUCCESS_URL =
  process.env.STRIPE_SUCCESS_URL || 'http://localhost:3000/payment/success';
const DEFAULT_CANCEL_URL =
  process.env.STRIPE_CANCEL_URL || 'http://localhost:3000/payment/cancel';

// =============================================================================
// Checkout Sessions
// =============================================================================

/**
 * POST /payment/checkout
 * Create a subscription checkout session
 * Requires authentication
 */
router.post('/checkout', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      priceId,
      customerId,
      customerEmail,
      successUrl,
      cancelUrl,
      trialDays,
    } = req.body as CheckoutRequest;

    if (!priceId) {
      res.status(400).json({ error: 'priceId is required' });
      return;
    }

    const session = await payments.createCheckoutSession({
      priceId,
      customerId,
      customerEmail,
      successUrl: successUrl || DEFAULT_SUCCESS_URL,
      cancelUrl: cancelUrl || DEFAULT_CANCEL_URL,
      trialPeriodDays: trialDays,
      allowPromotionCodes: true,
    });

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('[PaymentRoutes] Checkout error:', error instanceof Error ? error.message : error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Checkout failed',
    });
  }
});

/**
 * POST /payment/checkout/one-time
 * Create a one-time payment checkout session
 * Requires authentication
 */
router.post(
  '/checkout/one-time',
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { priceId, customerEmail, successUrl, cancelUrl } =
        req.body as CheckoutRequest;

      if (!priceId) {
        res.status(400).json({ error: 'priceId is required' });
        return;
      }

      const session = await payments.createOneTimeCheckout({
        priceId,
        customerEmail,
        successUrl: successUrl || DEFAULT_SUCCESS_URL,
        cancelUrl: cancelUrl || DEFAULT_CANCEL_URL,
      });

      res.json({
        success: true,
        sessionId: session.id,
        url: session.url,
      });
    } catch (error) {
      console.error('[PaymentRoutes] One-time checkout error:', error instanceof Error ? error.message : error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Checkout failed',
      });
    }
  }
);

/**
 * GET /payment/checkout/:sessionId
 * Get checkout session details
 */
router.get(
  '/checkout/:sessionId',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;
      const session = await payments.getCheckoutSession(sessionId);

      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      res.json({
        success: true,
        session: {
          id: session.id,
          status: session.status,
          paymentStatus: session.payment_status,
          customerEmail: session.customer_email,
          amountTotal: session.amount_total,
          currency: session.currency,
        },
      });
    } catch (error) {
      console.error('[PaymentRoutes] Get session error:', error instanceof Error ? error.message : error);
      res.status(500).json({ error: 'Failed to get session' });
    }
  }
);

// =============================================================================
// Customer Portal
// =============================================================================

/**
 * POST /payment/portal
 * Create a customer portal session for subscription management
 * Requires authentication
 */
router.post('/portal', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerId, returnUrl } = req.body as PortalRequest;

    if (!customerId) {
      res.status(400).json({ error: 'customerId is required' });
      return;
    }

    const session = await payments.createPortalSession(
      customerId,
      returnUrl || process.env.APP_URL || 'http://localhost:3000'
    );

    res.json({
      success: true,
      url: session.url,
    });
  } catch (error) {
    console.error('[PaymentRoutes] Portal error:', error instanceof Error ? error.message : error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Portal creation failed',
    });
  }
});

// =============================================================================
// Subscriptions
// =============================================================================

/**
 * GET /payment/subscription/:subscriptionId
 * Get subscription details
 * Requires authentication
 */
router.get(
  '/subscription/:subscriptionId',
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { subscriptionId } = req.params;
      const subscription = await payments.getSubscription(subscriptionId);

      if (!subscription) {
        res.status(404).json({ error: 'Subscription not found' });
        return;
      }

      res.json({
        success: true,
        subscription,
      });
    } catch (error) {
      console.error('[PaymentRoutes] Get subscription error:', error instanceof Error ? error.message : error);
      res.status(500).json({ error: 'Failed to get subscription' });
    }
  }
);

/**
 * GET /payment/customer/:customerId/subscriptions
 * Get all subscriptions for a customer
 * Requires authentication
 */
router.get(
  '/customer/:customerId/subscriptions',
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { customerId } = req.params;
      const subscriptions = await payments.getCustomerSubscriptions(customerId);

      res.json({
        success: true,
        subscriptions,
      });
    } catch (error) {
      console.error('[PaymentRoutes] Get customer subscriptions error:', error instanceof Error ? error.message : error);
      res.status(500).json({ error: 'Failed to get subscriptions' });
    }
  }
);

/**
 * POST /payment/subscription/:subscriptionId/cancel
 * Cancel a subscription at period end
 * Requires authentication
 */
router.post(
  '/subscription/:subscriptionId/cancel',
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { subscriptionId } = req.params;
      const { immediate } = req.body;

      if (immediate) {
        await payments.cancelSubscriptionImmediately(subscriptionId);
      } else {
        await payments.cancelSubscription(subscriptionId);
      }

      res.json({
        success: true,
        message: immediate
          ? 'Subscription canceled immediately'
          : 'Subscription will cancel at period end',
      });
    } catch (error) {
      console.error('[PaymentRoutes] Cancel subscription error:', error instanceof Error ? error.message : error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Cancellation failed',
      });
    }
  }
);

/**
 * POST /payment/subscription/:subscriptionId/resume
 * Resume a canceled subscription
 * Requires authentication
 */
router.post(
  '/subscription/:subscriptionId/resume',
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { subscriptionId } = req.params;
      await payments.resumeSubscription(subscriptionId);

      res.json({
        success: true,
        message: 'Subscription resumed',
      });
    } catch (error) {
      console.error('[PaymentRoutes] Resume subscription error:', error instanceof Error ? error.message : error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Resume failed',
      });
    }
  }
);

/**
 * POST /payment/subscription/:subscriptionId/change-plan
 * Change subscription plan
 * Requires authentication
 */
router.post(
  '/subscription/:subscriptionId/change-plan',
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { subscriptionId } = req.params;
      const { priceId } = req.body;

      if (!priceId) {
        res.status(400).json({ error: 'priceId is required' });
        return;
      }

      const subscription = await payments.changeSubscriptionPlan(
        subscriptionId,
        priceId
      );

      res.json({
        success: true,
        subscription: {
          id: subscription.id,
          status: subscription.status,
        },
      });
    } catch (error) {
      console.error('[PaymentRoutes] Change plan error:', error instanceof Error ? error.message : error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Plan change failed',
      });
    }
  }
);

// =============================================================================
// Prices
// =============================================================================

/**
 * GET /payment/prices
 * List all active prices
 */
router.get('/prices', async (_req: Request, res: Response): Promise<void> => {
  try {
    const prices = await payments.listPrices();

    const formattedPrices = prices.map((price) => {
      const product = price.product as { name?: string; description?: string };
      return {
        id: price.id,
        unitAmount: price.unit_amount,
        currency: price.currency,
        interval: price.recurring?.interval,
        intervalCount: price.recurring?.interval_count,
        productName: product?.name,
        productDescription: product?.description,
      };
    });

    res.json({
      success: true,
      prices: formattedPrices,
    });
  } catch (error) {
    console.error('[PaymentRoutes] List prices error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to list prices' });
  }
});

// =============================================================================
// Webhook Helpers
// =============================================================================

/**
 * Extract subscription data from Stripe subscription object
 */
function extractSubscriptionData(subscription: Stripe.Subscription): {
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  status: string;
  priceId: string;
  productId: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
} {
  const item = subscription.items.data[0];
  const price = item?.price;
  const productId =
    typeof price?.product === 'string'
      ? price.product
      : price?.product?.id || '';

  return {
    stripeSubscriptionId: subscription.id,
    stripeCustomerId:
      typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer.id,
    status: subscription.status,
    priceId: price?.id || '',
    productId,
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  };
}

/**
 * Handle checkout.session.completed event
 * Links Stripe customer to user and provisions access
 */
async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  console.log('[Webhook] Processing checkout.session.completed:', session.id);

  const customerId =
    typeof session.customer === 'string'
      ? session.customer
      : session.customer?.id;
  const customerEmail = session.customer_email || session.customer_details?.email;
  const subscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id;

  if (!customerId) {
    console.error('[Webhook] No customer ID in checkout session');
    return;
  }

  // Find user by email and link Stripe customer
  if (customerEmail) {
    const user = await dbOperations.findUserByEmail(customerEmail);
    if (user) {
      await dbOperations.updateUserStripeCustomerId(user.id, customerId);
      console.log('[Webhook] Linked Stripe customer to user:', user.id);

      // If subscription checkout, the subscription.created event will handle the rest
      if (subscriptionId) {
        console.log('[Webhook] Subscription will be created by subscription.created event');
      }
    } else {
      console.warn('[Webhook] No user found for email:', customerEmail);
    }
  }

  // Handle one-time payment (no subscription)
  if (session.mode === 'payment' && session.payment_intent) {
    const paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent.id;

    await dbOperations.createPayment({
      stripePaymentIntentId: paymentIntentId,
      stripeCustomerId: customerId,
      amount: session.amount_total || 0,
      currency: session.currency || 'usd',
      status: 'succeeded',
      metadata: session.metadata as Record<string, string>,
    });

    console.log('[Webhook] Created payment record for one-time payment');
  }
}

/**
 * Handle customer.subscription.created event
 */
async function handleSubscriptionCreated(
  subscription: Stripe.Subscription
): Promise<void> {
  console.log('[Webhook] Processing subscription.created:', subscription.id);

  const data = extractSubscriptionData(subscription);

  // Try to find user by Stripe customer ID
  const user = await dbOperations.findUserByStripeCustomerId(data.stripeCustomerId);

  await dbOperations.upsertSubscription({
    ...data,
    userId: user?.id,
  });

  console.log('[Webhook] Created subscription record:', subscription.id);
}

/**
 * Handle customer.subscription.updated event
 */
async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<void> {
  console.log('[Webhook] Processing subscription.updated:', subscription.id);

  const data = extractSubscriptionData(subscription);

  // Try to find existing subscription to preserve userId
  const existing = await dbOperations.findSubscription(subscription.id);

  await dbOperations.upsertSubscription({
    ...data,
    userId: existing?.userId,
  });

  console.log(
    '[Webhook] Updated subscription:',
    subscription.id,
    'status:',
    subscription.status
  );
}

/**
 * Handle customer.subscription.deleted event
 */
async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  console.log('[Webhook] Processing subscription.deleted:', subscription.id);

  // Update the subscription status to canceled instead of deleting
  // This preserves history for analytics
  const data = extractSubscriptionData(subscription);
  const existing = await dbOperations.findSubscription(subscription.id);

  await dbOperations.upsertSubscription({
    ...data,
    status: 'canceled',
    userId: existing?.userId,
  });

  console.log('[Webhook] Marked subscription as canceled:', subscription.id);
}

/**
 * Handle invoice.payment_succeeded event
 */
async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  console.log('[Webhook] Processing invoice.payment_succeeded:', invoice.id);

  // Check idempotency - skip if already processed
  if (await dbOperations.isPaymentProcessed(invoice.id || '')) {
    console.log('[Webhook] Invoice already processed, skipping:', invoice.id);
    return;
  }

  const customerId =
    typeof invoice.customer === 'string'
      ? invoice.customer
      : invoice.customer?.id || '';

  // Find user by Stripe customer ID
  const user = await dbOperations.findUserByStripeCustomerId(customerId);

  await dbOperations.createPayment({
    stripeInvoiceId: invoice.id || undefined,
    stripeCustomerId: customerId,
    userId: user?.id,
    amount: invoice.amount_paid,
    currency: invoice.currency,
    status: 'succeeded',
    metadata: invoice.metadata as Record<string, string>,
  });

  console.log('[Webhook] Created payment record for invoice:', invoice.id);
}

/**
 * Handle invoice.payment_failed event
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  console.log('[Webhook] Processing invoice.payment_failed:', invoice.id);

  const customerId =
    typeof invoice.customer === 'string'
      ? invoice.customer
      : invoice.customer?.id || '';

  // Find user by Stripe customer ID
  const user = await dbOperations.findUserByStripeCustomerId(customerId);

  await dbOperations.createPayment({
    stripeInvoiceId: invoice.id || undefined,
    stripeCustomerId: customerId,
    userId: user?.id,
    amount: invoice.amount_due,
    currency: invoice.currency,
    status: 'failed',
    metadata: invoice.metadata as Record<string, string>,
  });

  // TODO: Send notification to user about failed payment
  // await notificationService.sendPaymentFailedEmail(user?.email, invoice);

  console.log('[Webhook] Recorded failed payment for invoice:', invoice.id);
}

// =============================================================================
// Webhooks
// =============================================================================

/**
 * POST /payment/webhook
 * Handle Stripe webhooks
 * NOTE: This endpoint must remain PUBLIC - uses Stripe signature verification
 */
router.post(
  '/webhook',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const signature = req.headers['stripe-signature'] as string;

      if (!signature) {
        res.status(400).json({ error: 'Missing stripe-signature header' });
        return;
      }

      // Note: req.body should be the raw buffer for webhook verification
      // Configure express.raw() for this route
      const event = payments.verifyWebhook(req.body, signature);

      // Idempotency check - skip if event already processed
      if (await dbOperations.isEventProcessed(event.id)) {
        console.log('[Webhook] Event already processed, skipping:', event.id);
        res.json({ received: true, skipped: true });
        return;
      }

      // Handle different event types
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          await handleCheckoutCompleted(session);
          break;
        }

        case 'customer.subscription.created': {
          const subscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionCreated(subscription);
          break;
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionUpdated(subscription);
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionDeleted(subscription);
          break;
        }

        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as Stripe.Invoice;
          await handleInvoicePaid(invoice);
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          await handleInvoicePaymentFailed(invoice);
          break;
        }

        default:
          console.log('[Webhook] Unhandled event type:', event.type);
      }

      // Record that we processed this event
      await dbOperations.recordProcessedEvent(event.id, event.type);

      res.json({ received: true });
    } catch (error) {
      console.error('[PaymentRoutes] Webhook error:', error instanceof Error ? error.message : error);
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Webhook failed',
      });
    }
  }
);

export default router;
