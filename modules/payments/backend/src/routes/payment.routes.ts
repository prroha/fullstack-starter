import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { getPaymentService } from '../services/payment.service.js';
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
interface AuthenticatedRequest extends FastifyRequest {
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
// Auth Middleware
// =============================================================================

// Placeholder auth middleware - replace with your actual import
async function authMiddleware(req: FastifyRequest, reply: FastifyReply) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.code(401).send({ error: 'Authentication required' });
  }
  // Placeholder - actual middleware would verify token and load user
}

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
  async findUserByStripeCustomerId(
    stripeCustomerId: string
  ): Promise<{ id: string; email: string } | null> {
    console.log('[DB] Finding user by Stripe customer ID:', stripeCustomerId);
    return null;
  },

  async findUserByEmail(
    email: string
  ): Promise<{ id: string; email: string; stripeCustomerId?: string } | null> {
    console.log('[DB] Finding user by email:', email);
    return null;
  },

  async updateUserStripeCustomerId(
    userId: string,
    stripeCustomerId: string
  ): Promise<void> {
    console.log('[DB] Updating user stripe customer ID:', userId, stripeCustomerId);
  },

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
    console.log('[DB] Upserting subscription:', data.stripeSubscriptionId);
    return {
      id: 'sub_db_' + Date.now(),
      ...data,
      userId: data.userId || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  async deleteSubscription(stripeSubscriptionId: string): Promise<void> {
    console.log('[DB] Deleting subscription:', stripeSubscriptionId);
  },

  async findSubscription(
    stripeSubscriptionId: string
  ): Promise<SubscriptionRecord | null> {
    console.log('[DB] Finding subscription:', stripeSubscriptionId);
    return null;
  },

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
    console.log('[DB] Creating payment:', data.stripeInvoiceId || data.stripePaymentIntentId);
    return {
      id: 'pay_db_' + Date.now(),
      ...data,
      createdAt: new Date(),
    };
  },

  async isPaymentProcessed(stripeInvoiceId: string): Promise<boolean> {
    console.log('[DB] Checking if payment processed:', stripeInvoiceId);
    return false;
  },

  async isEventProcessed(eventId: string): Promise<boolean> {
    console.log('[DB] Checking if event processed:', eventId);
    return false;
  },

  async recordProcessedEvent(
    eventId: string,
    eventType: string
  ): Promise<void> {
    console.log('[DB] Recording processed event:', eventId, eventType);
  },
};

// =============================================================================
// Default URLs
// =============================================================================

const DEFAULT_SUCCESS_URL =
  process.env.STRIPE_SUCCESS_URL || 'http://localhost:3000/payment/success';
const DEFAULT_CANCEL_URL =
  process.env.STRIPE_CANCEL_URL || 'http://localhost:3000/payment/cancel';

// =============================================================================
// Webhook Helpers
// =============================================================================

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

  if (customerEmail) {
    const user = await dbOperations.findUserByEmail(customerEmail);
    if (user) {
      await dbOperations.updateUserStripeCustomerId(user.id, customerId);
      console.log('[Webhook] Linked Stripe customer to user:', user.id);

      if (subscriptionId) {
        console.log('[Webhook] Subscription will be created by subscription.created event');
      }
    } else {
      console.warn('[Webhook] No user found for email:', customerEmail);
    }
  }

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

async function handleSubscriptionCreated(
  subscription: Stripe.Subscription
): Promise<void> {
  console.log('[Webhook] Processing subscription.created:', subscription.id);

  const data = extractSubscriptionData(subscription);
  const user = await dbOperations.findUserByStripeCustomerId(data.stripeCustomerId);

  await dbOperations.upsertSubscription({
    ...data,
    userId: user?.id,
  });

  console.log('[Webhook] Created subscription record:', subscription.id);
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<void> {
  console.log('[Webhook] Processing subscription.updated:', subscription.id);

  const data = extractSubscriptionData(subscription);
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

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  console.log('[Webhook] Processing subscription.deleted:', subscription.id);

  const data = extractSubscriptionData(subscription);
  const existing = await dbOperations.findSubscription(subscription.id);

  await dbOperations.upsertSubscription({
    ...data,
    status: 'canceled',
    userId: existing?.userId,
  });

  console.log('[Webhook] Marked subscription as canceled:', subscription.id);
}

async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  console.log('[Webhook] Processing invoice.payment_succeeded:', invoice.id);

  if (await dbOperations.isPaymentProcessed(invoice.id || '')) {
    console.log('[Webhook] Invoice already processed, skipping:', invoice.id);
    return;
  }

  const customerId =
    typeof invoice.customer === 'string'
      ? invoice.customer
      : invoice.customer?.id || '';

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

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  console.log('[Webhook] Processing invoice.payment_failed:', invoice.id);

  const customerId =
    typeof invoice.customer === 'string'
      ? invoice.customer
      : invoice.customer?.id || '';

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

  console.log('[Webhook] Recorded failed payment for invoice:', invoice.id);
}

// =============================================================================
// Routes Plugin
// =============================================================================

const routes: FastifyPluginAsync = async (fastify) => {
  const payments = getPaymentService();

  // ===========================================================================
  // Checkout Sessions
  // ===========================================================================

  /**
   * POST /payment/checkout
   * Create a subscription checkout session
   * Requires authentication
   */
  fastify.post('/checkout', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const {
      priceId,
      customerId,
      customerEmail,
      successUrl,
      cancelUrl,
      trialDays,
    } = req.body as CheckoutRequest;

    if (!priceId) {
      return reply.code(400).send({ error: 'priceId is required' });
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

    return reply.send({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  });

  /**
   * POST /payment/checkout/one-time
   * Create a one-time payment checkout session
   * Requires authentication
   */
  fastify.post('/checkout/one-time', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { priceId, customerEmail, successUrl, cancelUrl } =
      req.body as CheckoutRequest;

    if (!priceId) {
      return reply.code(400).send({ error: 'priceId is required' });
    }

    const session = await payments.createOneTimeCheckout({
      priceId,
      customerEmail,
      successUrl: successUrl || DEFAULT_SUCCESS_URL,
      cancelUrl: cancelUrl || DEFAULT_CANCEL_URL,
    });

    return reply.send({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  });

  /**
   * GET /payment/checkout/:sessionId
   * Get checkout session details
   */
  fastify.get('/checkout/:sessionId', async (req: FastifyRequest, reply: FastifyReply) => {
    const { sessionId } = req.params as { sessionId: string };
    const session = await payments.getCheckoutSession(sessionId);

    if (!session) {
      return reply.code(404).send({ error: 'Session not found' });
    }

    return reply.send({
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
  });

  // ===========================================================================
  // Customer Portal
  // ===========================================================================

  /**
   * POST /payment/portal
   * Create a customer portal session for subscription management
   * Requires authentication
   */
  fastify.post('/portal', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { customerId, returnUrl } = req.body as PortalRequest;

    if (!customerId) {
      return reply.code(400).send({ error: 'customerId is required' });
    }

    const session = await payments.createPortalSession(
      customerId,
      returnUrl || process.env.APP_URL || 'http://localhost:3000'
    );

    return reply.send({
      success: true,
      url: session.url,
    });
  });

  // ===========================================================================
  // Subscriptions
  // ===========================================================================

  /**
   * GET /payment/subscription/:subscriptionId
   * Get subscription details
   * Requires authentication
   */
  fastify.get('/subscription/:subscriptionId', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { subscriptionId } = req.params as { subscriptionId: string };
    const subscription = await payments.getSubscription(subscriptionId);

    if (!subscription) {
      return reply.code(404).send({ error: 'Subscription not found' });
    }

    return reply.send({
      success: true,
      subscription,
    });
  });

  /**
   * GET /payment/customer/:customerId/subscriptions
   * Get all subscriptions for a customer
   * Requires authentication
   */
  fastify.get('/customer/:customerId/subscriptions', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { customerId } = req.params as { customerId: string };
    const subscriptions = await payments.getCustomerSubscriptions(customerId);

    return reply.send({
      success: true,
      subscriptions,
    });
  });

  /**
   * POST /payment/subscription/:subscriptionId/cancel
   * Cancel a subscription at period end
   * Requires authentication
   */
  fastify.post('/subscription/:subscriptionId/cancel', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { subscriptionId } = req.params as { subscriptionId: string };
    const { immediate } = req.body as { immediate?: boolean };

    if (immediate) {
      await payments.cancelSubscriptionImmediately(subscriptionId);
    } else {
      await payments.cancelSubscription(subscriptionId);
    }

    return reply.send({
      success: true,
      message: immediate
        ? 'Subscription canceled immediately'
        : 'Subscription will cancel at period end',
    });
  });

  /**
   * POST /payment/subscription/:subscriptionId/resume
   * Resume a canceled subscription
   * Requires authentication
   */
  fastify.post('/subscription/:subscriptionId/resume', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { subscriptionId } = req.params as { subscriptionId: string };
    await payments.resumeSubscription(subscriptionId);

    return reply.send({
      success: true,
      message: 'Subscription resumed',
    });
  });

  /**
   * POST /payment/subscription/:subscriptionId/change-plan
   * Change subscription plan
   * Requires authentication
   */
  fastify.post('/subscription/:subscriptionId/change-plan', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { subscriptionId } = req.params as { subscriptionId: string };
    const { priceId } = req.body as { priceId: string };

    if (!priceId) {
      return reply.code(400).send({ error: 'priceId is required' });
    }

    const subscription = await payments.changeSubscriptionPlan(
      subscriptionId,
      priceId
    );

    return reply.send({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
      },
    });
  });

  // ===========================================================================
  // Prices
  // ===========================================================================

  /**
   * GET /payment/prices
   * List all active prices
   */
  fastify.get('/prices', async (_req: FastifyRequest, reply: FastifyReply) => {
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

    return reply.send({
      success: true,
      prices: formattedPrices,
    });
  });

  // ===========================================================================
  // Webhooks (raw body sub-plugin)
  // ===========================================================================

  /**
   * POST /payment/webhook
   * Handle Stripe webhooks
   * NOTE: This endpoint must remain PUBLIC - uses Stripe signature verification
   */
  await fastify.register(async (webhookScope) => {
    webhookScope.removeAllContentTypeParsers();
    webhookScope.addContentTypeParser(
      'application/json',
      { parseAs: 'buffer' },
      (_req, body, done) => {
        done(null, body);
      }
    );

    webhookScope.post('/webhook', async (req: FastifyRequest, reply: FastifyReply) => {
      const signature = req.headers['stripe-signature'] as string;

      if (!signature) {
        return reply.code(400).send({ error: 'Missing stripe-signature header' });
      }

      const event = payments.verifyWebhook(req.body as Buffer, signature);

      // Idempotency check - skip if event already processed
      if (await dbOperations.isEventProcessed(event.id)) {
        console.log('[Webhook] Event already processed, skipping:', event.id);
        return reply.send({ received: true, skipped: true });
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

      return reply.send({ received: true });
    });
  });
};

export default routes;
