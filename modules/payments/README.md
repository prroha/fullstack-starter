# Payments Module

Complete Stripe payment integration for subscriptions and one-time payments.

## Features

- **Checkout Sessions**: Stripe-hosted checkout pages
- **Subscriptions**: Create, cancel, resume, and change plans
- **Customer Portal**: Self-service subscription management
- **Webhooks**: Handle payment events
- **One-Time Payments**: Single purchase support
- **TypeScript**: Full type definitions

## Installation

### Backend

1. Install Stripe SDK:

```bash
cd core/backend
npm install stripe
```

2. Copy module files:

```bash
cp modules/payments/backend/src/services/payment.service.ts core/backend/src/services/
cp modules/payments/backend/src/routes/payment.routes.ts core/backend/src/routes/
```

3. Register routes in your app:

```typescript
import express from 'express';
import paymentRoutes from './routes/payment.routes';

// IMPORTANT: Webhook route needs raw body
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

// Regular JSON parsing for other routes
app.use(express.json());
app.use('/api/payment', paymentRoutes);
```

4. Add environment variables to `backend/.env`:

```env
STRIPE_SECRET_KEY=sk_test_xxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxx
STRIPE_SUCCESS_URL=http://localhost:3000/payment/success
STRIPE_CANCEL_URL=http://localhost:3000/payment/cancel
```

### Web (Next.js)

1. Install Stripe packages:

```bash
cd core/web
npm install @stripe/stripe-js @stripe/react-stripe-js
```

2. Copy the payment pages:

```bash
cp -r modules/payments/web/src/app/payment core/web/src/app/
```

3. Add environment variable to `web/.env.local`:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxx
```

## API Endpoints

### Checkout

```http
POST /api/payment/checkout
{
  "priceId": "price_xxxx",
  "customerEmail": "user@example.com"
}
```

### One-Time Payment

```http
POST /api/payment/checkout/one-time
{
  "priceId": "price_xxxx"
}
```

### Customer Portal

```http
POST /api/payment/portal
{
  "customerId": "cus_xxxx",
  "returnUrl": "http://localhost:3000/account"
}
```

### Manage Subscription

```http
# Cancel at period end
POST /api/payment/subscription/:id/cancel

# Cancel immediately
POST /api/payment/subscription/:id/cancel
{ "immediate": true }

# Resume canceled subscription
POST /api/payment/subscription/:id/resume

# Change plan
POST /api/payment/subscription/:id/change-plan
{ "priceId": "price_new_xxx" }
```

### Get Prices

```http
GET /api/payment/prices
```

## Usage Examples

### Create Checkout Session

```typescript
import { getPaymentService } from './services/payment.service';

const payments = getPaymentService();

// For subscription
const session = await payments.createCheckoutSession({
  priceId: 'price_xxxx',
  customerEmail: 'user@example.com',
  successUrl: 'https://yourapp.com/payment/success',
  cancelUrl: 'https://yourapp.com/payment/cancel',
  trialPeriodDays: 14,
});

// Redirect user to session.url
```

### Handle Webhooks

In your backend, handle webhook events:

```typescript
// In payment.routes.ts webhook handler, add your business logic:

case 'checkout.session.completed': {
  const session = event.data.object;
  // Update user subscription in your database
  await db.user.update({
    where: { email: session.customer_email },
    data: {
      stripeCustomerId: session.customer,
      subscriptionStatus: 'active'
    }
  });
  break;
}
```

### Frontend Checkout

```tsx
const handleSubscribe = async (priceId: string) => {
  const response = await fetch('/api/payment/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ priceId }),
  });

  const { url } = await response.json();
  window.location.href = url;
};
```

## Stripe Dashboard Setup

1. Create products and prices in Stripe Dashboard
2. Set up webhook endpoint: `https://yourdomain.com/api/payment/webhook`
3. Configure webhook events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Configure Customer Portal in Stripe Dashboard

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key (starts with sk_) |
| `STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key (starts with pk_) |
| `STRIPE_WEBHOOK_SECRET` | Yes | Webhook signing secret (starts with whsec_) |
| `STRIPE_SUCCESS_URL` | No | Redirect URL after successful payment |
| `STRIPE_CANCEL_URL` | No | Redirect URL after canceled payment |

## Database Schema

Add these models to your `prisma/schema.prisma`:

```prisma
// ============================================================================
// PAYMENT ENUMS
// ============================================================================

enum SubscriptionStatus {
  active
  canceled
  incomplete
  incomplete_expired
  past_due
  trialing
  unpaid
  paused
}

enum PaymentStatus {
  pending
  succeeded
  failed
  refunded
  canceled
}

// ============================================================================
// PAYMENT MODELS
// ============================================================================

/// Subscription model - tracks Stripe subscriptions
model Subscription {
  id                    String             @id @default(uuid())
  stripeSubscriptionId  String             @unique @map("stripe_subscription_id")
  stripeCustomerId      String             @map("stripe_customer_id")
  userId                String?            @map("user_id")
  user                  User?              @relation(fields: [userId], references: [id])

  status                SubscriptionStatus @default(active)
  priceId               String             @map("price_id")
  productId             String             @map("product_id")

  currentPeriodStart    DateTime           @map("current_period_start")
  currentPeriodEnd      DateTime           @map("current_period_end")
  cancelAtPeriodEnd     Boolean            @default(false) @map("cancel_at_period_end")

  createdAt             DateTime           @default(now()) @map("created_at")
  updatedAt             DateTime           @updatedAt @map("updated_at")

  @@index([userId])
  @@index([stripeCustomerId])
  @@index([status])
  @@map("subscriptions")
}

/// Payment model - tracks payment history
model Payment {
  id                    String        @id @default(uuid())
  stripePaymentIntentId String?       @unique @map("stripe_payment_intent_id")
  stripeInvoiceId       String?       @unique @map("stripe_invoice_id")
  stripeCustomerId      String        @map("stripe_customer_id")
  userId                String?       @map("user_id")
  user                  User?         @relation(fields: [userId], references: [id])

  amount                Int           // Amount in cents
  currency              String        @default("usd")
  status                PaymentStatus @default(pending)

  metadata              Json?

  createdAt             DateTime      @default(now()) @map("created_at")

  @@index([userId])
  @@index([stripeCustomerId])
  @@index([status])
  @@map("payments")
}

/// WebhookEvent model - for idempotency tracking
model WebhookEvent {
  id            String   @id @default(uuid())
  stripeEventId String   @unique @map("stripe_event_id")
  eventType     String   @map("event_type")
  processedAt   DateTime @default(now()) @map("processed_at")

  @@index([stripeEventId])
  @@map("webhook_events")
}
```

Also add the `stripeCustomerId` field to your User model:

```prisma
model User {
  // ... existing fields ...

  stripeCustomerId  String?   @unique @map("stripe_customer_id")

  // Relations
  subscriptions     Subscription[]
  payments          Payment[]

  // ... rest of model ...
}
```

### Migration Instructions

1. Add the schema to your `prisma/schema.prisma` file
2. Generate migration:
```bash
cd core/backend
npx prisma migrate dev --name add_payments
```

3. Generate Prisma client:
```bash
npx prisma generate
```

4. Update the webhook handlers in `payment.routes.ts` to use your Prisma client instead of the placeholder functions

## Testing

Use Stripe test mode and test card numbers:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0027 6000 3184`

Test webhook locally with Stripe CLI:
```bash
stripe listen --forward-to localhost:3001/api/payment/webhook
```

## Pricing Suggestion

$800-1500 for full integration including:
- Complete Stripe setup
- Subscription management
- Customer portal integration
- Webhook handling
- Database schema updates
- Frontend components
