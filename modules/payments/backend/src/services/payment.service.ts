import Stripe from 'stripe';

// =============================================================================
// Types
// =============================================================================

export interface PaymentConfig {
  secretKey: string;
  webhookSecret?: string;
}

export interface CreateCheckoutOptions {
  customerId?: string;
  customerEmail?: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
  allowPromotionCodes?: boolean;
  trialPeriodDays?: number;
}

export interface CreatePaymentIntentOptions {
  amount: number;
  currency?: string;
  customerId?: string;
  metadata?: Record<string, string>;
  description?: string;
}

export interface CreateCustomerOptions {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}

export interface SubscriptionInfo {
  id: string;
  customerId: string;
  status: Stripe.Subscription.Status;
  priceId: string;
  productId: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

export interface WebhookEvent {
  type: string;
  data: unknown;
}

// =============================================================================
// Payment Service
// =============================================================================

export class PaymentService {
  private stripe: Stripe;
  private webhookSecret?: string;

  constructor(config: PaymentConfig) {
    if (!config.secretKey) {
      throw new Error('STRIPE_SECRET_KEY is required');
    }

    this.stripe = new Stripe(config.secretKey, {
      apiVersion: '2024-12-18.acacia',
      typescript: true,
    });

    this.webhookSecret = config.webhookSecret;
  }

  // ===========================================================================
  // Customers
  // ===========================================================================

  /**
   * Create a new Stripe customer
   */
  async createCustomer(options: CreateCustomerOptions): Promise<Stripe.Customer> {
    try {
      return await this.stripe.customers.create({
        email: options.email,
        name: options.name,
        metadata: options.metadata,
      });
    } catch (error) {
      console.error('[PaymentService] Create customer error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get a customer by ID
   */
  async getCustomer(customerId: string): Promise<Stripe.Customer | null> {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);
      if (customer.deleted) return null;
      return customer as Stripe.Customer;
    } catch (error) {
      console.error('[PaymentService] Get customer error:', error);
      return null;
    }
  }

  /**
   * Find customer by email
   */
  async findCustomerByEmail(email: string): Promise<Stripe.Customer | null> {
    try {
      const customers = await this.stripe.customers.list({ email, limit: 1 });
      return customers.data[0] || null;
    } catch (error) {
      console.error('[PaymentService] Find customer error:', error);
      return null;
    }
  }

  /**
   * Update customer
   */
  async updateCustomer(
    customerId: string,
    data: Partial<CreateCustomerOptions>
  ): Promise<Stripe.Customer> {
    try {
      return await this.stripe.customers.update(customerId, {
        email: data.email,
        name: data.name,
        metadata: data.metadata,
      });
    } catch (error) {
      console.error('[PaymentService] Update customer error:', error);
      throw this.handleError(error);
    }
  }

  // ===========================================================================
  // Checkout Sessions
  // ===========================================================================

  /**
   * Create a checkout session for subscription or one-time payment
   */
  async createCheckoutSession(
    options: CreateCheckoutOptions
  ): Promise<Stripe.Checkout.Session> {
    try {
      const sessionData: Stripe.Checkout.SessionCreateParams = {
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: options.priceId,
            quantity: 1,
          },
        ],
        success_url: options.successUrl,
        cancel_url: options.cancelUrl,
        metadata: options.metadata,
        allow_promotion_codes: options.allowPromotionCodes,
      };

      if (options.customerId) {
        sessionData.customer = options.customerId;
      } else if (options.customerEmail) {
        sessionData.customer_email = options.customerEmail;
      }

      if (options.trialPeriodDays) {
        sessionData.subscription_data = {
          trial_period_days: options.trialPeriodDays,
        };
      }

      return await this.stripe.checkout.sessions.create(sessionData);
    } catch (error) {
      console.error('[PaymentService] Create checkout error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Create a one-time payment checkout session
   */
  async createOneTimeCheckout(options: {
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    customerEmail?: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Checkout.Session> {
    try {
      return await this.stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price: options.priceId,
            quantity: 1,
          },
        ],
        success_url: options.successUrl,
        cancel_url: options.cancelUrl,
        customer_email: options.customerEmail,
        metadata: options.metadata,
      });
    } catch (error) {
      console.error('[PaymentService] Create one-time checkout error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Retrieve a checkout session
   */
  async getCheckoutSession(
    sessionId: string
  ): Promise<Stripe.Checkout.Session | null> {
    try {
      return await this.stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['subscription', 'customer'],
      });
    } catch (error) {
      console.error('[PaymentService] Get checkout session error:', error);
      return null;
    }
  }

  // ===========================================================================
  // Payment Intents
  // ===========================================================================

  /**
   * Create a payment intent for custom payment flows
   */
  async createPaymentIntent(
    options: CreatePaymentIntentOptions
  ): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.create({
        amount: options.amount,
        currency: options.currency || 'usd',
        customer: options.customerId,
        metadata: options.metadata,
        description: options.description,
        automatic_payment_methods: { enabled: true },
      });
    } catch (error) {
      console.error('[PaymentService] Create payment intent error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Confirm a payment intent
   */
  async confirmPaymentIntent(
    paymentIntentId: string
  ): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.confirm(paymentIntentId);
    } catch (error) {
      console.error('[PaymentService] Confirm payment intent error:', error);
      throw this.handleError(error);
    }
  }

  // ===========================================================================
  // Subscriptions
  // ===========================================================================

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId: string): Promise<SubscriptionInfo | null> {
    try {
      const sub = await this.stripe.subscriptions.retrieve(subscriptionId);
      return this.formatSubscription(sub);
    } catch (error) {
      console.error('[PaymentService] Get subscription error:', error);
      return null;
    }
  }

  /**
   * Get all subscriptions for a customer
   */
  async getCustomerSubscriptions(customerId: string): Promise<SubscriptionInfo[]> {
    try {
      const subs = await this.stripe.subscriptions.list({
        customer: customerId,
        status: 'all',
      });
      return subs.data.map((sub) => this.formatSubscription(sub));
    } catch (error) {
      console.error('[PaymentService] Get customer subscriptions error:', error);
      return [];
    }
  }

  /**
   * Cancel a subscription at period end
   */
  async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      return await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    } catch (error) {
      console.error('[PaymentService] Cancel subscription error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Cancel a subscription immediately
   */
  async cancelSubscriptionImmediately(
    subscriptionId: string
  ): Promise<Stripe.Subscription> {
    try {
      return await this.stripe.subscriptions.cancel(subscriptionId);
    } catch (error) {
      console.error('[PaymentService] Cancel subscription immediately error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Resume a canceled subscription
   */
  async resumeSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      return await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      });
    } catch (error) {
      console.error('[PaymentService] Resume subscription error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Change subscription plan
   */
  async changeSubscriptionPlan(
    subscriptionId: string,
    newPriceId: string
  ): Promise<Stripe.Subscription> {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      return await this.stripe.subscriptions.update(subscriptionId, {
        items: [
          {
            id: subscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        proration_behavior: 'always_invoice',
      });
    } catch (error) {
      console.error('[PaymentService] Change subscription plan error:', error);
      throw this.handleError(error);
    }
  }

  // ===========================================================================
  // Customer Portal
  // ===========================================================================

  /**
   * Create a customer portal session for self-service
   */
  async createPortalSession(
    customerId: string,
    returnUrl: string
  ): Promise<Stripe.BillingPortal.Session> {
    try {
      return await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });
    } catch (error) {
      console.error('[PaymentService] Create portal session error:', error);
      throw this.handleError(error);
    }
  }

  // ===========================================================================
  // Webhooks
  // ===========================================================================

  /**
   * Verify and parse a webhook event
   */
  verifyWebhook(payload: string | Buffer, signature: string): Stripe.Event {
    if (!this.webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is required for webhook verification');
    }

    try {
      return this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret
      );
    } catch (error) {
      console.error('[PaymentService] Webhook verification error:', error);
      throw new Error('Invalid webhook signature');
    }
  }

  // ===========================================================================
  // Products & Prices
  // ===========================================================================

  /**
   * List all active prices
   */
  async listPrices(): Promise<Stripe.Price[]> {
    try {
      const prices = await this.stripe.prices.list({
        active: true,
        expand: ['data.product'],
      });
      return prices.data;
    } catch (error) {
      console.error('[PaymentService] List prices error:', error);
      return [];
    }
  }

  /**
   * Get a specific price
   */
  async getPrice(priceId: string): Promise<Stripe.Price | null> {
    try {
      return await this.stripe.prices.retrieve(priceId, {
        expand: ['product'],
      });
    } catch (error) {
      console.error('[PaymentService] Get price error:', error);
      return null;
    }
  }

  // ===========================================================================
  // Helpers
  // ===========================================================================

  private formatSubscription(sub: Stripe.Subscription): SubscriptionInfo {
    const item = sub.items.data[0];
    const price = item.price;
    const productId =
      typeof price.product === 'string' ? price.product : price.product.id;

    return {
      id: sub.id,
      customerId: sub.customer as string,
      status: sub.status,
      priceId: price.id,
      productId,
      currentPeriodStart: new Date(sub.current_period_start * 1000),
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    };
  }

  private handleError(error: unknown): Error {
    if (error instanceof Stripe.errors.StripeError) {
      return new Error(`Stripe error: ${error.message}`);
    }
    if (error instanceof Error) {
      return error;
    }
    return new Error('Unknown payment error');
  }
}

// =============================================================================
// Factory
// =============================================================================

let paymentServiceInstance: PaymentService | null = null;

/**
 * Get or create the payment service singleton
 */
export function getPaymentService(): PaymentService {
  if (!paymentServiceInstance) {
    paymentServiceInstance = new PaymentService({
      secretKey: process.env.STRIPE_SECRET_KEY || '',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    });
  }
  return paymentServiceInstance;
}

/**
 * Create a custom payment service instance
 */
export function createPaymentService(config: PaymentConfig): PaymentService {
  return new PaymentService(config);
}

export default PaymentService;
