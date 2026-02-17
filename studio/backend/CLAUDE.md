# Studio Backend

> **Last Updated**: 2026-02-17

AI-optimized documentation for the Studio backend (Express + Prisma).

---

## Overview

The Studio backend is a Fastify API server that provides:

1. **Public API** - Feature listing, pricing calculation, checkout
2. **Admin API** - Full CRUD for orders, templates, features, settings
3. **Code Generation** - Generates custom project ZIPs based on orders
4. **Payment Processing** - Stripe integration for checkout and refunds
5. **Email Service** - Resend integration for order notifications

---

## Project Structure

```
studio/backend/
├── src/
│   ├── index.ts                   # Fastify app entry point
│   ├── config/
│   │   ├── env.ts                 # Environment configuration
│   │   └── db.ts                  # Prisma client singleton
│   ├── middleware/
│   │   ├── auth.middleware.ts     # JWT authentication
│   │   └── error.middleware.ts    # Error handling
│   ├── routes/
│   │   ├── public/                # Public API routes (no auth)
│   │   │   ├── index.ts           # Route aggregator
│   │   │   ├── auth.routes.ts     # Admin login
│   │   │   ├── features.routes.ts # Feature listing
│   │   │   ├── templates.routes.ts# Template listing
│   │   │   ├── pricing.routes.ts  # Pricing & calculation
│   │   │   ├── preview.routes.ts  # Preview sessions
│   │   │   ├── checkout.routes.ts # Stripe checkout
│   │   │   └── orders.routes.ts   # Order lookup
│   │   └── admin/                 # Admin API routes (auth required)
│   │       ├── index.ts           # Route aggregator
│   │       ├── dashboard.routes.ts# Statistics
│   │       ├── orders.routes.ts   # Order management
│   │       ├── templates.routes.ts# Template CRUD
│   │       ├── features.routes.ts # Feature CRUD
│   │       ├── modules.routes.ts  # Module CRUD
│   │       ├── pricing.routes.ts  # Tier management
│   │       ├── customers.routes.ts# Customer list
│   │       ├── licenses.routes.ts # License management
│   │       ├── coupons.routes.ts  # Coupon CRUD
│   │       ├── analytics.routes.ts# Analytics data
│   │       ├── settings.routes.ts # Platform settings
│   │       ├── uploads.routes.ts  # File uploads
│   │       └── generation.routes.ts # Manual project generation
│   ├── services/
│   │   ├── generator.service.ts   # Project code generator
│   │   ├── stripe.service.ts      # Stripe payments & refunds
│   │   ├── email.service.ts       # Resend email service
│   │   └── download.service.ts    # Download link management
│   ├── jobs/
│   │   └── cleanup.job.ts         # Background cleanup tasks
│   ├── utils/
│   │   ├── response.ts            # API response helpers
│   │   ├── errors.ts              # Custom error classes
│   │   ├── schema-merger.ts       # Prisma schema merging
│   │   └── package-merger.ts      # package.json merging
│   ├── controllers/               # (empty - logic in routes)
│   └── types/                     # (empty - types in @studio/shared)
├── prisma/
│   ├── schema.prisma              # Database schema
│   ├── migrations/                # Database migrations
│   └── seed.ts                    # Database seeding
└── uploads/                       # Uploaded files (gitignored)
```

---

## Database Schema

### Core Models

| Model             | Description                                  |
| ----------------- | -------------------------------------------- |
| `StudioUser`      | Platform users (customers who buy)           |
| `StudioSession`   | User sessions for authentication             |
| `Order`           | Purchase records with payment status         |
| `License`         | Download licenses tied to orders             |
| `Template`        | Pre-configured feature bundles               |
| `Module`          | Feature groupings (auth, payments, etc.)     |
| `Feature`         | Individual features with dependencies        |
| `PricingTier`     | Pricing tiers (starter, pro, business)       |
| `BundleDiscount`  | Automatic discounts for feature combinations |
| `StudioCoupon`    | Promotional discount codes                   |
| `StudioAnalytics` | Event tracking for analytics                 |
| `PreviewSession`  | Preview session tracking                     |
| `StudioSetting`   | Key-value platform settings                  |
| `PriceHistory`    | Tracks tier/feature price changes over time  |
| `StudioAuditLog`  | Admin action audit trail                     |

### Key Enums

| Enum            | Values                                                      |
| --------------- | ----------------------------------------------------------- |
| `OrderStatus`   | PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED, CANCELLED |
| `LicenseStatus` | ACTIVE, EXPIRED, REVOKED                                    |
| `CouponType`    | PERCENTAGE, FIXED                                           |

### Feature Schema

```prisma
model Feature {
  id              String    @id @default(cuid())
  slug            String    @unique
  name            String
  description     String
  moduleId        String
  module          Module    @relation(...)

  // Pricing
  price           Int       @default(0)  // in cents
  tier            String?   // Minimum tier required

  // Dependencies
  requires        String[]  // Feature slugs this depends on
  conflicts       String[]  // Feature slugs this conflicts with

  // Code generation mappings
  fileMappings    Json?     // [{source, destination, transform?}]
  schemaMappings  Json?     // [{model, source}]
  envVars         Json?     // [{key, description, required, default?}]
  npmPackages     Json?     // [{name, version, dev?}]
}
```

---

## API Endpoints

### Public API (`/api/*`)

#### Features

| Method | Endpoint                      | Description                |
| ------ | ----------------------------- | -------------------------- |
| GET    | `/api/features`               | List features with modules |
| GET    | `/api/features/:slug`         | Get feature by slug        |
| GET    | `/api/features/category/:cat` | Features by category       |

**Query params:** `page`, `limit`, `search`, `category`, `tier`

#### Templates

| Method | Endpoint               | Description               |
| ------ | ---------------------- | ------------------------- |
| GET    | `/api/templates`       | List active templates     |
| GET    | `/api/templates/:slug` | Get template with details |

#### Pricing

| Method | Endpoint                   | Description             |
| ------ | -------------------------- | ----------------------- |
| GET    | `/api/pricing/tiers`       | List pricing tiers      |
| GET    | `/api/pricing/tiers/:slug` | Get tier details        |
| POST   | `/api/pricing/calculate`   | Calculate configuration |

**Calculate body:**

```json
{
  "tier": "starter",
  "selectedFeatures": ["auth-basic", "file-upload"],
  "couponCode": "SAVE20"
}
```

#### Preview

| Method | Endpoint                    | Description            |
| ------ | --------------------------- | ---------------------- |
| POST   | `/api/preview/session`      | Create preview session |
| PATCH  | `/api/preview/session/:id`  | Update session         |
| GET    | `/api/preview/config/:tier` | Get preview config     |

#### Checkout

| Method | Endpoint          | Description           |
| ------ | ----------------- | --------------------- |
| POST   | `/api/checkout`   | Create Stripe session |
| GET    | `/api/orders/:id` | Get order by ID       |

#### Auth

| Method | Endpoint                | Description      |
| ------ | ----------------------- | ---------------- |
| POST   | `/api/auth/admin/login` | Admin login      |
| GET    | `/api/auth/me`          | Get current user |
| POST   | `/api/auth/logout`      | Clear session    |

### Admin API (`/api/admin/*`)

All admin routes require authentication (JWT in cookie).

#### Dashboard

| Method | Endpoint                     | Description          |
| ------ | ---------------------------- | -------------------- |
| GET    | `/api/admin/dashboard/stats` | Dashboard statistics |

#### Orders

| Method | Endpoint                             | Description             |
| ------ | ------------------------------------ | ----------------------- |
| GET    | `/api/admin/orders`                  | List orders (paginated) |
| GET    | `/api/admin/orders/:id`              | Get order details       |
| PATCH  | `/api/admin/orders/:id`              | Update order            |
| POST   | `/api/admin/orders/:id/refund`       | Process refund          |
| POST   | `/api/admin/orders/:id/resend-email` | Resend order email      |
| GET    | `/api/admin/orders/:id/download`     | Download project ZIP    |
| GET    | `/api/admin/orders/export`           | Export CSV              |

#### Templates

| Method | Endpoint                   | Description     |
| ------ | -------------------------- | --------------- |
| GET    | `/api/admin/templates`     | List templates  |
| GET    | `/api/admin/templates/:id` | Get template    |
| POST   | `/api/admin/templates`     | Create template |
| PATCH  | `/api/admin/templates/:id` | Update template |
| DELETE | `/api/admin/templates/:id` | Delete template |

#### Features

| Method | Endpoint                  | Description    |
| ------ | ------------------------- | -------------- |
| GET    | `/api/admin/features`     | List features  |
| GET    | `/api/admin/features/:id` | Get feature    |
| POST   | `/api/admin/features`     | Create feature |
| PATCH  | `/api/admin/features/:id` | Update feature |
| DELETE | `/api/admin/features/:id` | Delete feature |

#### Pricing

| Method | Endpoint                                | Description             |
| ------ | --------------------------------------- | ----------------------- |
| GET    | `/api/admin/pricing/tiers`              | List tiers with stats   |
| GET    | `/api/admin/pricing/tiers/:tier`        | Get tier details        |
| PUT    | `/api/admin/pricing/tiers/:tier`        | Update tier             |
| PATCH  | `/api/admin/pricing/tiers/:tier/toggle` | Toggle tier active      |
| PUT    | `/api/admin/pricing/tiers/reorder`      | Reorder tiers           |
| GET    | `/api/admin/pricing/bundles`            | List bundle discounts   |
| GET    | `/api/admin/pricing/bundles/:id`        | Get bundle details      |
| POST   | `/api/admin/pricing/bundles`            | Create bundle           |
| PUT    | `/api/admin/pricing/bundles/:id`        | Update bundle           |
| PATCH  | `/api/admin/pricing/bundles/:id/toggle` | Toggle bundle active    |
| DELETE | `/api/admin/pricing/bundles/:id`        | Delete bundle           |
| GET    | `/api/admin/pricing/history`            | Price change history    |
| GET    | `/api/admin/pricing/recommendations`    | Upgrade recommendations |

#### Analytics

| Method | Endpoint                          | Description          |
| ------ | --------------------------------- | -------------------- |
| GET    | `/api/admin/analytics/revenue`    | Revenue over time    |
| GET    | `/api/admin/analytics/features`   | Popular features     |
| GET    | `/api/admin/analytics/funnel`     | Conversion funnel    |
| GET    | `/api/admin/analytics/templates`  | Template performance |
| GET    | `/api/admin/analytics/geo`        | Geographic analytics |
| GET    | `/api/admin/analytics/export/pdf` | Export analytics PDF |

#### Generation

| Method | Endpoint                      | Description                   |
| ------ | ----------------------------- | ----------------------------- |
| POST   | `/api/admin/generate`         | Generate project for customer |
| GET    | `/api/admin/generate/options` | Get available tiers/features  |

#### Settings

| Method | Endpoint                           | Description         |
| ------ | ---------------------------------- | ------------------- |
| GET    | `/api/admin/settings`              | Get all settings    |
| PUT    | `/api/admin/settings`              | Update settings     |
| GET    | `/api/admin/settings/email/status` | Email config status |
| POST   | `/api/admin/settings/email/test`   | Send test email     |

---

## Services

### ProjectGenerator

**Location:** `services/generator.service.ts`

Generates complete project ZIPs for orders.

```typescript
import { projectGenerator } from "../services/generator.service.js";

// Generate ZIP to a writable stream
await projectGenerator.generate(order, outputStream);
```

**Generation steps:**

1. Copy `/core/` directory as base
2. Copy feature-specific files from selected features
3. Generate merged Prisma schema
4. Merge package.json dependencies
5. Generate .env.example with all required variables
6. Create LICENSE.md and README.md

### StripeService

**Location:** `services/stripe.service.ts`

Handles Stripe payments and refunds.

```typescript
import { stripeService } from "../services/stripe.service.js";

// Create checkout session
const session = await stripeService.createCheckoutSession({
  tier,
  selectedFeatures,
  customerEmail,
  couponCode,
});

// Process refund
await stripeService.refundPayment(paymentIntentId, amount);
```

### EmailService

**Location:** `services/email.service.ts`

Sends transactional emails via Resend.

```typescript
import { emailService } from "../services/email.service.js";

// Order confirmation
await emailService.sendOrderConfirmation({ ... });

// Resend download link
await emailService.sendDownloadLink({ ... });

// Check if configured
if (emailService.isConfigured()) { ... }
```

---

## Background Jobs

### Cleanup Job

**Location:** `jobs/cleanup.job.ts`

Runs periodic cleanup tasks:

- Expires old preview sessions
- Cleans up abandoned checkout sessions
- Removes old analytics data

Started automatically on server boot.

---

## File Paths for Common Tasks

| Task                   | Path                                 |
| ---------------------- | ------------------------------------ |
| Add public route       | `src/routes/public/{name}.routes.ts` |
| Add admin route        | `src/routes/admin/{name}.routes.ts`  |
| Add new service        | `src/services/{name}.service.ts`     |
| Add background job     | `src/jobs/{name}.job.ts`             |
| Modify database schema | `prisma/schema.prisma`               |
| Add seed data          | `prisma/seed.ts`                     |
| Add utility function   | `src/utils/{name}.ts`                |
| Modify error handling  | `src/middleware/error.middleware.ts` |
| Modify auth logic      | `src/middleware/auth.middleware.ts`  |

---

## Command Cheatsheet

```bash
# Development
pnpm dev                    # Start dev server on :3001

# Build
pnpm build                  # Production build
pnpm start                  # Start production server

# Database
pnpm db:generate            # Generate Prisma client
pnpm db:migrate             # Create and run migration
pnpm db:migrate:deploy      # Deploy migrations (production)
pnpm db:push                # Push schema without migration
pnpm db:reset               # Reset database
pnpm db:studio              # Open Prisma Studio
pnpm db:seed                # Seed database

# Code Quality
pnpm lint                   # Run ESLint
pnpm typecheck              # TypeScript type checking

# Testing
pnpm test                   # Run tests
pnpm test:watch             # Watch mode
pnpm test:coverage          # With coverage
```

---

## Environment Variables

```bash
# Required
DATABASE_URL="postgresql://user:pass@localhost:5432/studio"
JWT_SECRET=your-secret-key-min-32-chars

# Server
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3002

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SUCCESS_URL=http://localhost:3002/checkout/success
STRIPE_CANCEL_URL=http://localhost:3002/checkout

# Email (Resend)
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com

# Admin (for seeding)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=secure-password
```

---

## API Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### Paginated Response

```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10,
      "hasMore": true
    }
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "message": "Human readable message",
    "code": "ERROR_CODE",
    "details": { ... }
  }
}
```

---

## Related Documentation

- [Studio Main CLAUDE.md](../CLAUDE.md)
- [Studio Web CLAUDE.md](../web/CLAUDE.md)
- [Fullstack Starter CLAUDE.md](../../CLAUDE.md)
- [Prisma Schema](./prisma/schema.prisma)
