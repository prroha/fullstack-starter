import { Router, Request, Response } from 'express';
import { getPaymentService } from '../services/payment.service';

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
 */
router.post('/checkout', async (req: Request, res: Response): Promise<void> => {
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
    console.error('[PaymentRoutes] Checkout error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Checkout failed',
    });
  }
});

/**
 * POST /payment/checkout/one-time
 * Create a one-time payment checkout session
 */
router.post(
  '/checkout/one-time',
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
      console.error('[PaymentRoutes] One-time checkout error:', error);
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
      console.error('[PaymentRoutes] Get session error:', error);
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
 */
router.post('/portal', async (req: Request, res: Response): Promise<void> => {
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
    console.error('[PaymentRoutes] Portal error:', error);
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
 */
router.get(
  '/subscription/:subscriptionId',
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
      console.error('[PaymentRoutes] Get subscription error:', error);
      res.status(500).json({ error: 'Failed to get subscription' });
    }
  }
);

/**
 * GET /payment/customer/:customerId/subscriptions
 * Get all subscriptions for a customer
 */
router.get(
  '/customer/:customerId/subscriptions',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { customerId } = req.params;
      const subscriptions = await payments.getCustomerSubscriptions(customerId);

      res.json({
        success: true,
        subscriptions,
      });
    } catch (error) {
      console.error('[PaymentRoutes] Get customer subscriptions error:', error);
      res.status(500).json({ error: 'Failed to get subscriptions' });
    }
  }
);

/**
 * POST /payment/subscription/:subscriptionId/cancel
 * Cancel a subscription at period end
 */
router.post(
  '/subscription/:subscriptionId/cancel',
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
      console.error('[PaymentRoutes] Cancel subscription error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Cancellation failed',
      });
    }
  }
);

/**
 * POST /payment/subscription/:subscriptionId/resume
 * Resume a canceled subscription
 */
router.post(
  '/subscription/:subscriptionId/resume',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { subscriptionId } = req.params;
      await payments.resumeSubscription(subscriptionId);

      res.json({
        success: true,
        message: 'Subscription resumed',
      });
    } catch (error) {
      console.error('[PaymentRoutes] Resume subscription error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Resume failed',
      });
    }
  }
);

/**
 * POST /payment/subscription/:subscriptionId/change-plan
 * Change subscription plan
 */
router.post(
  '/subscription/:subscriptionId/change-plan',
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
      console.error('[PaymentRoutes] Change plan error:', error);
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
    console.error('[PaymentRoutes] List prices error:', error);
    res.status(500).json({ error: 'Failed to list prices' });
  }
});

// =============================================================================
// Webhooks
// =============================================================================

/**
 * POST /payment/webhook
 * Handle Stripe webhooks
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

      // Handle different event types
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object;
          console.log('[Webhook] Checkout completed:', session.id);
          // TODO: Provision access, update user subscription status
          break;
        }

        case 'customer.subscription.created': {
          const subscription = event.data.object;
          console.log('[Webhook] Subscription created:', subscription.id);
          // TODO: Store subscription in database
          break;
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object;
          console.log('[Webhook] Subscription updated:', subscription.id);
          // TODO: Update subscription status in database
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object;
          console.log('[Webhook] Subscription deleted:', subscription.id);
          // TODO: Revoke access, update database
          break;
        }

        case 'invoice.payment_succeeded': {
          const invoice = event.data.object;
          console.log('[Webhook] Invoice paid:', invoice.id);
          // TODO: Record payment, extend subscription
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object;
          console.log('[Webhook] Invoice payment failed:', invoice.id);
          // TODO: Notify user, handle failed payment
          break;
        }

        default:
          console.log('[Webhook] Unhandled event type:', event.type);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('[PaymentRoutes] Webhook error:', error);
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Webhook failed',
      });
    }
  }
);

export default router;
