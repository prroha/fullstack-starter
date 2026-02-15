# Xitolaunch Module

## Overview

The **Xitolaunch** is a full-stack configuration and pricing platform that allows users to:

1. **Configure custom starter templates** by selecting features from a catalog
2. **View live previews** of their configured application
3. **Calculate dynamic pricing** based on selected tier and add-on features
4. **Manage feature dependencies** with automatic conflict resolution
5. **Track preview sessions** for analytics

The Studio serves as a self-service portal where developers can build their ideal starter package by mixing and matching modules like authentication, payments, file uploads, analytics, and more.

---

## Architecture

### Frontend (Next.js 15 + React 19)

```
studio/web/
├── src/
│   ├── app/
│   │   ├── (public)/           # Public pages (no auth required)
│   │   │   ├── configure/      # Feature configurator
│   │   │   ├── preview/        # Live preview
│   │   │   ├── checkout/       # Checkout flow
│   │   │   └── showcase/       # Component showcase
│   │   └── (admin)/            # Admin dashboard
│   │       └── admin/
│   │           ├── orders/     # Order management
│   │           ├── templates/  # Template CRUD
│   │           ├── features/   # Feature management
│   │           ├── pricing/    # Tier & bundle management
│   │           ├── customers/  # Customer management
│   │           ├── licenses/   # License management
│   │           ├── coupons/    # Coupon management
│   │           └── analytics/  # Analytics dashboard
│   ├── components/
│   │   ├── configurator/       # Feature selection UI
│   │   ├── preview/            # Device preview components
│   │   ├── showcase/           # Component documentation
│   │   ├── admin/              # Admin UI components
│   │   ├── public/             # Public page components
│   │   └── ui/                 # Shared UI primitives
│   └── lib/
│       ├── features/           # Feature registry & dependencies
│       ├── pricing/            # Price calculation logic
│       ├── preview/            # Feature flags & conditional rendering
│       ├── config/             # Configuration persistence
│       └── showcase/           # Component registry
```

### Backend (Express + Prisma)

```
studio/backend/
├── src/
│   ├── config/
│   │   ├── env.ts              # Environment configuration
│   │   └── db.ts               # Prisma client
│   ├── middleware/
│   │   ├── auth.middleware.ts  # JWT authentication
│   │   └── error.middleware.ts # Error handling
│   ├── routes/
│   │   ├── public/             # Public API (no auth)
│   │   │   ├── features.routes.ts
│   │   │   ├── templates.routes.ts
│   │   │   ├── pricing.routes.ts
│   │   │   └── preview.routes.ts
│   │   └── admin/              # Admin API (auth required)
│   │       ├── dashboard.routes.ts
│   │       ├── templates.routes.ts
│   │       ├── features.routes.ts
│   │       ├── pricing.routes.ts
│   │       └── ...
│   ├── services/
│   │   ├── stripe.service.ts     # Stripe payments & refunds
│   │   ├── email.service.ts      # Resend email service
│   │   └── download.service.ts   # Download file generation
│   ├── utils/
│   │   ├── response.ts         # API response helpers
│   │   └── errors.ts           # Custom error classes
│   └── index.ts                # Express app entry
└── prisma/
    └── schema.prisma           # Database schema
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                        │
├─────────────────────────────────────────────────────────────────┤
│  ConfiguratorProvider                                            │
│       │                                                          │
│       ├─> DependencyResolver  (resolves feature dependencies)   │
│       │                                                          │
│       └─> PricingCalculator   (calculates prices)               │
│                 │                                                │
│                 ▼                                                │
│  FeatureFlagProvider  (controls conditional rendering)          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ REST API
┌─────────────────────────────────────────────────────────────────┐
│                        Backend (Express)                         │
├─────────────────────────────────────────────────────────────────┤
│  Public Routes (/api/*)                                          │
│       │                                                          │
│       ├─> /features    (list features & modules)                │
│       ├─> /templates   (list templates)                         │
│       ├─> /pricing     (tiers & price calculation)              │
│       └─> /preview     (session tracking)                       │
│                                                                  │
│  Admin Routes (/api/admin/*)  [Auth Required]                   │
│       └─> CRUD for all resources                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Database (PostgreSQL)                       │
│  - Feature, Module, PricingTier, Template, BundleDiscount       │
│  - Order, Customer, License, Coupon, PreviewSession             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Files

### Frontend: `lib/features/`

| File              | Description                                                                         |
| ----------------- | ----------------------------------------------------------------------------------- |
| `types.ts`        | Client-side feature types (`ClientFeature`, `ResolvedSelection`, `FeatureConflict`) |
| `registry.ts`     | `FeatureRegistry` class - central feature catalog with querying and filtering       |
| `dependencies.ts` | `DependencyResolver` class - handles feature dependencies and conflicts             |
| `validation.ts`   | `ConfigurationValidator` class - validates configurations before checkout           |
| `hooks.ts`        | React hooks: `useFeatures`, `useModules`, `useFeatureSelection`                     |
| `index.ts`        | Barrel export                                                                       |

### Frontend: `lib/pricing/`

| File            | Description                                                         |
| --------------- | ------------------------------------------------------------------- |
| `types.ts`      | Pricing types (`CartState`, `CartItem`, `BundleMatch`)              |
| `calculator.ts` | `PricingCalculator` class - calculates prices with discounts        |
| `tiers.ts`      | Tier utilities (`TIER_ORDER`, `compareTiers`, `getRecommendedTier`) |
| `bundles.ts`    | Bundle utilities (`getSuggestedBundles`)                            |
| `hooks.ts`      | React hooks: `usePricing`, `useCart`, `useTierRecommendation`       |
| `index.ts`      | Barrel export                                                       |

### Frontend: `lib/preview/`

| File                     | Description                                                               |
| ------------------------ | ------------------------------------------------------------------------- |
| `feature-flags.tsx`      | `FeatureFlagProvider` context for feature-based rendering                 |
| `conditional-render.tsx` | Gate components (`FeatureGate`, `TierGate`, `MultiFeatureGate`)           |
| `hooks.ts`               | Preview hooks: `useDevicePreview`, `useThemePreview`, `usePreviewSession` |
| `index.ts`               | Barrel export                                                             |

### Frontend: `components/configurator/`

| File                   | Description                                            |
| ---------------------- | ------------------------------------------------------ |
| `context.tsx`          | `ConfiguratorProvider` - main state management context |
| `category-sidebar.tsx` | Category navigation sidebar                            |
| `feature-card.tsx`     | Individual feature card with selection UI              |
| `feature-list.tsx`     | Feature list with filtering                            |
| `tier-selector.tsx`    | Pricing tier selection UI                              |
| `cart-summary.tsx`     | Shopping cart summary                                  |
| `template-picker.tsx`  | Pre-built template selector                            |
| `dependency-badge.tsx` | Dependency/conflict indicators                         |
| `price-breakdown.tsx`  | Detailed price breakdown                               |
| `index.ts`             | Barrel export                                          |

### Backend: `routes/public/`

| File                  | Description                   |
| --------------------- | ----------------------------- |
| `index.ts`            | Public route aggregator       |
| `features.routes.ts`  | Feature listing and filtering |
| `templates.routes.ts` | Template listing and details  |
| `pricing.routes.ts`   | Pricing tiers and calculation |
| `preview.routes.ts`   | Preview session management    |

---

## API Endpoints

### Public API (No Authentication)

#### Features

| Method | Endpoint                           | Description                           |
| ------ | ---------------------------------- | ------------------------------------- |
| `GET`  | `/api/features`                    | List all active features with modules |
| `GET`  | `/api/features/:slug`              | Get single feature by slug            |
| `GET`  | `/api/features/category/:category` | Get features by category              |

**Query Parameters for `/api/features`:**

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `search` - Search in name, slug, description
- `category` - Filter by module category
- `tier` - Filter by tier (includes lower tiers)

**Response:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "...",
        "slug": "auth-basic",
        "name": "Basic Auth",
        "description": "Email/password authentication",
        "price": 0,
        "requires": [],
        "conflicts": [],
        "module": {
          "id": "...",
          "name": "Authentication",
          "slug": "auth",
          "category": "auth"
        }
      }
    ],
    "modules": [...],
    "pagination": { "page": 1, "limit": 20, "total": 50 }
  }
}
```

#### Templates

| Method | Endpoint               | Description                            |
| ------ | ---------------------- | -------------------------------------- |
| `GET`  | `/api/templates`       | List all active templates              |
| `GET`  | `/api/templates/:slug` | Get template with full feature details |

**Query Parameters for `/api/templates`:**

- `page`, `limit` - Pagination
- `search` - Search in name, slug, description

#### Pricing

| Method | Endpoint                   | Description                            |
| ------ | -------------------------- | -------------------------------------- |
| `GET`  | `/api/pricing/tiers`       | List all active pricing tiers          |
| `GET`  | `/api/pricing/tiers/:slug` | Get tier with included feature details |
| `POST` | `/api/pricing/calculate`   | Calculate price for configuration      |

**POST `/api/pricing/calculate` Body:**

```json
{
  "tier": "starter",
  "selectedFeatures": ["auth-basic", "file-upload"],
  "couponCode": "SAVE20"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "tierPrice": 9900,
    "featuresPrice": 2900,
    "subtotal": 12800,
    "bundleDiscounts": [],
    "couponDiscount": null,
    "totalDiscount": 0,
    "tax": 0,
    "total": 12800,
    "currency": "USD",
    "breakdown": {
      "tier": { "slug": "starter", "name": "Starter", "price": 9900 },
      "addOnFeatures": [
        { "slug": "file-upload", "name": "File Upload", "price": 2900 }
      ],
      "addOnCount": 1
    }
  }
}
```

#### Preview

| Method  | Endpoint                    | Description                          |
| ------- | --------------------------- | ------------------------------------ |
| `POST`  | `/api/preview/session`      | Create preview session for analytics |
| `PATCH` | `/api/preview/session/:id`  | Update session (end, track duration) |
| `GET`   | `/api/preview/config/:tier` | Get preview configuration for tier   |

---

## Key Classes

### DependencyResolver

**Location:** `/studio/web/src/lib/features/dependencies.ts`

Handles feature dependencies and conflicts using graph-based resolution.

```typescript
const resolver = new DependencyResolver(features);

// Get all dependencies (recursive)
const deps = resolver.getDependencies("payments-subscription");
// => ["auth-basic", "payments-stripe"]

// Get dependents (features that require this)
const dependents = resolver.getDependents("auth-basic");
// => ["payments-subscription", "file-upload"]

// Check for conflicts
const conflicts = resolver.checkConflicts("auth-firebase", ["auth-supabase"]);
// => ["auth-supabase"]

// Resolve complete selection with auto-dependencies
const resolved = resolver.resolveSelection(userSelected, tierIncluded);
// => {
//   selectedFeatures: [...],
//   userSelected: [...],
//   autoSelected: [...],
//   tierIncluded: [...],
//   conflicts: [],
//   isValid: true
// }
```

**Key Methods:**

- `getDependencies(slug)` - Get all recursive dependencies
- `getDependents(slug)` - Get all features that depend on this
- `checkConflicts(slug, selected)` - Check for conflicts with selection
- `canSelect(slug, selected)` - Check if feature can be selected
- `canDeselect(slug, selected)` - Check if feature can be deselected
- `resolveSelection(userSelected, tierIncluded)` - Full dependency resolution
- `getCascadeDeselect(slug, selected)` - Get cascade effect of deselection

---

### PricingCalculator

**Location:** `/studio/web/src/lib/pricing/calculator.ts`

Calculates prices with tier pricing, add-ons, bundle discounts, and coupons.

```typescript
const calculator = new PricingCalculator(features, tiers, bundles, taxRate);

const price = calculator.calculate({
  tier: "pro",
  selectedFeatures: ["analytics-advanced", "mobile-app"],
  couponCode: "LAUNCH20",
});

// => {
//   tierPrice: 19900,
//   featuresPrice: 4900,
//   subtotal: 24800,
//   bundleDiscounts: [{ name: "Analytics Bundle", amount: 500 }],
//   couponDiscount: { name: "LAUNCH20", amount: 2480 },
//   totalDiscount: 2980,
//   tax: 0,
//   total: 21820,
//   currency: "USD"
// }

// Format price for display
PricingCalculator.formatPrice(21820); // "$218.20"
```

**Key Methods:**

- `calculate(input)` - Full price calculation
- `findApplicableBundles(features, tier)` - Find matching bundles
- `getEstimatedSavings(features, tier)` - Calculate potential savings
- `calculateDifference(config1, config2)` - Compare configurations
- `getTier(slug)`, `getFeature(slug)` - Get entities
- `static formatPrice(cents, currency)` - Format for display

---

### FeatureRegistry

**Location:** `/studio/web/src/lib/features/registry.ts`

Central catalog for features and modules with querying and filtering.

```typescript
const registry = new FeatureRegistry(features, modules);

// Get all features
const allFeatures = registry.getAllFeatures();

// Get feature by slug
const feature = registry.getFeature("auth-basic");

// Get features by module
const authFeatures = registry.getFeaturesByModule("auth");

// Get modules by category
const paymentModules = registry.getModulesByCategory("payments");

// Filter features
const filtered = registry.filterFeatures({
  search: "auth",
  category: "auth",
  tier: "starter",
});

// Get category info
const categories = registry.getCategories();
// => [{ slug: "auth", name: "Authentication", moduleCount: 3, featureCount: 10 }]
```

**Key Methods:**

- `getAllFeatures()`, `getAllModules()` - Get all entities
- `getFeature(slug)`, `getModule(slug)` - Get by slug
- `getFeaturesByModule(moduleSlug)` - Features in a module
- `getModulesByCategory(category)` - Modules in a category
- `filterFeatures(options)` - Filter with search, category, tier
- `getCategories()` - Get all category metadata
- `getFeaturesIncludedInTier(slug, features)` - Tier-included features
- `getAddOnFeatures(tierFeatures)` - Features not in tier

---

### ConfiguratorProvider

**Location:** `/studio/web/src/components/configurator/context.tsx`

React context provider for the configurator state management.

```tsx
// Wrap your configurator page
<ConfiguratorProvider initialData={{ features, modules, tiers, templates }}>
  <ConfiguratorPage />
</ConfiguratorProvider>;

// Use in child components
function FeatureSelector() {
  const {
    // Data
    features,
    modules,
    tiers,
    templates,

    // Selection state
    selectedTier,
    selectedFeatures,
    selectedTemplate,
    resolvedFeatures,
    pricing,

    // Actions
    setTier,
    selectFeature,
    deselectFeature,
    toggleFeature,
    setTemplate,
    reset,

    // Computed helpers
    isFeatureSelected,
    isFeatureIncludedInTier,
    isFeatureAutoSelected,
    getFeatureDependencies,
    getFeatureConflicts,
    getCurrentTier,
    formatPrice,
  } = useConfigurator();

  return (
    <button onClick={() => toggleFeature("analytics-basic")}>
      Toggle Analytics
    </button>
  );
}
```

**State:**

- `features`, `modules`, `tiers`, `templates` - Loaded data
- `selectedTier` - Currently selected tier slug
- `selectedFeatures` - User-selected feature slugs
- `selectedTemplate` - Selected template slug
- `resolvedFeatures` - Resolved selection with dependencies
- `pricing` - Calculated price breakdown
- `loading`, `error` - Loading state

**Actions:**

- `setTier(slug)` - Change tier (clears features now included)
- `selectFeature(slug)`, `deselectFeature(slug)`, `toggleFeature(slug)`
- `setFeatures(slugs)` - Set multiple features
- `setTemplate(slug)` - Select template
- `reset()` - Reset to initial state

---

### FeatureFlagProvider

**Location:** `/studio/web/src/lib/preview/feature-flags.tsx`

React context for feature-based conditional rendering in previews.

```tsx
// Wrap preview with feature flags
<FeatureFlagProvider features={["auth-basic", "payments-stripe"]} tier="pro">
  <AppPreview />
</FeatureFlagProvider>

// Use in preview components
function Dashboard() {
  const { hasFeature, hasTier, hasAllFeatures, hasAnyFeature } = useFeatureFlags();

  if (!hasFeature("analytics-basic")) {
    return <UpgradePrompt />;
  }

  return <AnalyticsDashboard />;
}

// Or use gate components
<FeatureGate feature="payments-stripe" fallback={<BasicPayments />}>
  <StripeIntegration />
</FeatureGate>

<TierGate tier="pro" fallback={<UpgradeButton />}>
  <ProFeatures />
</TierGate>

<MultiFeatureGate features={["auth-basic", "payments-stripe"]} requireAll>
  <CheckoutFlow />
</MultiFeatureGate>
```

**Context Value:**

- `tier` - Current tier slug
- `features` - Set of enabled feature slugs
- `hasFeature(slug)` - Check single feature
- `hasTier(slug)` - Check tier level
- `hasAllFeatures(slugs)` - Check all features
- `hasAnyFeature(slugs)` - Check any feature

**Gate Components:**

- `FeatureGate` - Render based on single feature
- `TierGate` - Render based on tier level
- `MultiFeatureGate` - Render based on multiple features
- `FeatureSwitch` - Switch between components
- `FeaturePlaceholder` - Placeholder for disabled features
- `FeatureWithPlaceholder` - Feature gate with automatic placeholder

---

## Development

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- pnpm (recommended) or npm

### Environment Setup

**Backend (`studio/backend/.env`):**

```env
# Required
DATABASE_URL="postgresql://user:pass@localhost:5432/studio"
JWT_SECRET=your-secret-key-min-32-chars

# Server
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3002

# Stripe (for payments)
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

**Frontend (`studio/web/.env.local`):**

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Running Locally

```bash
# 1. Install dependencies
cd studio/backend && pnpm install
cd ../web && pnpm install

# 2. Setup database
cd studio/backend
pnpm db:generate      # Generate Prisma client
pnpm db:migrate       # Run migrations
pnpm db:seed          # Seed initial data

# 3. Start backend (terminal 1)
cd studio/backend
pnpm dev              # Runs on http://localhost:3001

# 4. Start frontend (terminal 2)
cd studio/web
pnpm dev              # Runs on http://localhost:3002
```

### Available Scripts

**Backend:**

```bash
pnpm dev              # Start development server with hot reload
pnpm build            # Build for production
pnpm start            # Start production server
pnpm db:generate      # Generate Prisma client
pnpm db:migrate       # Run database migrations
pnpm db:migrate:deploy # Deploy migrations (production)
pnpm db:reset         # Reset database
pnpm db:studio        # Open Prisma Studio
pnpm db:seed          # Seed database
pnpm lint             # Run ESLint
pnpm typecheck        # TypeScript type checking
```

**Frontend:**

```bash
pnpm dev              # Start Next.js dev server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run Next.js lint
pnpm typecheck        # TypeScript type checking
```

### Project Structure Best Practices

1. **Feature-based organization**: Group related code in `lib/features/`, `lib/pricing/`, etc.
2. **Barrel exports**: Use `index.ts` files for clean imports
3. **Shared types**: Import from `@studio/shared` for backend/frontend type consistency
4. **Context providers**: Use for complex state (ConfiguratorProvider, FeatureFlagProvider)
5. **Custom hooks**: Abstract complex logic into reusable hooks

---

## Testing

### Unit Tests

```bash
# Backend tests
cd studio/backend
pnpm test             # Run all tests
pnpm test:watch       # Watch mode
pnpm test:coverage    # With coverage report

# Frontend tests
cd studio/web
pnpm test             # Run all tests
pnpm test:watch       # Watch mode
```

### Test Structure

```
studio/backend/
└── src/
    └── __tests__/
        ├── routes/
        │   ├── features.test.ts
        │   ├── pricing.test.ts
        │   └── templates.test.ts
        └── utils/
            └── response.test.ts

studio/web/
└── src/
    └── __tests__/
        ├── lib/
        │   ├── features/
        │   │   ├── registry.test.ts
        │   │   └── dependencies.test.ts
        │   └── pricing/
        │       └── calculator.test.ts
        └── components/
            └── configurator/
                └── context.test.tsx
```

### Key Test Cases

**DependencyResolver:**

- Resolves direct dependencies correctly
- Resolves transitive dependencies
- Detects circular dependencies
- Identifies conflicts between features
- Cascade deselection works properly

**PricingCalculator:**

- Calculates tier price correctly
- Adds feature prices for non-included features
- Applies bundle discounts correctly
- Applies coupon codes with limits
- Handles tax calculation
- Formats prices correctly

**ConfiguratorProvider:**

- Initializes with default state
- Fetches data on mount when not provided
- Updates resolved features on selection change
- Recalculates pricing on changes
- Handles tier changes (clears included features)

### E2E Tests

```bash
cd studio/web
pnpm test:e2e         # Run Playwright tests
pnpm test:e2e:ui      # With UI mode
```

Test scenarios:

- Feature selection flow
- Tier upgrade flow
- Price calculation accuracy
- Template application
- Checkout flow

---

## Key Patterns

### Dependency Resolution Flow

```
User selects feature
       │
       ▼
DependencyResolver.canSelect()
       │
       ├─ Check conflicts → Block if conflict exists
       │
       ▼
Add to userSelected
       │
       ▼
DependencyResolver.resolveSelection()
       │
       ├─ Get all dependencies
       ├─ Add to autoSelected
       ├─ Check for conflicts
       │
       ▼
Update ConfiguratorProvider state
       │
       ▼
Recalculate pricing
```

### Pricing Calculation Flow

```
Configuration input (tier + features + coupon)
       │
       ▼
Get tier price
       │
       ▼
Calculate add-on features price
  (features not included in tier)
       │
       ▼
Calculate subtotal (tier + features)
       │
       ▼
Apply bundle discounts
  (check eligibility: minFeatures, requiredFeatures, etc.)
       │
       ▼
Apply coupon discount
  (check: isActive, expiry, usageLimit, minAmount)
       │
       ▼
Calculate tax on discounted amount
       │
       ▼
Return final total with breakdown
```

---

## Admin Dashboard

### Authentication

The admin dashboard requires authentication. Configure credentials in backend `.env`:

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-secure-password
JWT_SECRET=your-jwt-secret
```

**Auth Flow:**

1. Navigate to `/login` to access admin login
2. JWT token stored in HTTP-only cookie
3. All `/api/admin/*` routes require authentication
4. Session automatically checked on page load

**Key Files:**

| File                                       | Description                            |
| ------------------------------------------ | -------------------------------------- |
| `backend/src/routes/public/auth.routes.ts` | Login, logout, session check endpoints |
| `web/src/contexts/auth-context.tsx`        | Auth context provider with user state  |
| `web/src/app/(admin)/login/page.tsx`       | Admin login page                       |
| `web/src/app/(admin)/layout.tsx`           | Auth guard wrapper for admin pages     |

**API Endpoints:**

| Method | Endpoint                | Description                    |
| ------ | ----------------------- | ------------------------------ |
| `POST` | `/api/auth/admin/login` | Login with email/password      |
| `GET`  | `/api/auth/me`          | Get current authenticated user |
| `POST` | `/api/auth/logout`      | Clear session                  |

### Admin Pages

All admin pages are connected to real backend APIs:

| Page      | Route              | Features                                                         |
| --------- | ------------------ | ---------------------------------------------------------------- |
| Orders    | `/admin/orders`    | List, filter, status update, refund, export CSV                  |
| Templates | `/admin/templates` | CRUD, feature selection, toggle active                           |
| Settings  | `/admin/settings`  | General, payment, download, email, feature flags                 |
| Customers | `/admin/customers` | List, search, view orders                                        |
| Licenses  | `/admin/licenses`  | List, revoke, regenerate download                                |
| Coupons   | `/admin/coupons`   | CRUD, usage tracking                                             |
| Pricing   | `/admin/pricing`   | Tier management, bundles, price history, upgrade recommendations |
| Analytics | `/admin/analytics` | Revenue, funnel, geo, features, templates, PDF export            |
| Generate  | `/admin/generate`  | Manual project generation for customers without payment          |

### Email Service

**Location:** `/studio/backend/src/services/email.service.ts`

The studio uses Resend for transactional emails. Emails are automatically sent for:

1. **Order Confirmation** - Sent after successful checkout with license key and download link
2. **Download Link** - Resent on admin request with regenerated download link
3. **Refund Confirmation** - Sent when refund is processed
4. **Welcome Email** - Sent for new user registration

**Configuration:**

```env
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com
```

**Usage:**

```typescript
import { emailService } from "../services/email.service.js";

// Send order confirmation
await emailService.sendOrderConfirmation({
  customerEmail: "customer@example.com",
  customerName: "John Doe",
  orderNumber: "FS-123456",
  tier: "pro",
  tierName: "Pro",
  selectedFeatures: ["auth", "payments"],
  subtotal: 14900,
  discount: 0,
  total: 14900,
  licenseKey: "FS-XXXX-XXXX-XXXX",
  downloadUrl: "https://studio.com/download/token",
});

// Resend download link
await emailService.sendDownloadLink({
  customerEmail: "customer@example.com",
  orderNumber: "FS-123456",
  licenseKey: "FS-XXXX-XXXX-XXXX",
  downloadUrl: "https://studio.com/download/new-token",
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
});

// Check if configured
if (emailService.isConfigured()) {
  // Ready to send emails
}
```

**Admin Endpoints:**

| Method | Endpoint                             | Description         |
| ------ | ------------------------------------ | ------------------- |
| `GET`  | `/api/admin/settings/email/status`   | Check email config  |
| `POST` | `/api/admin/settings/email/test`     | Send test email     |
| `POST` | `/api/admin/orders/:id/resend-email` | Resend order emails |

---

## Frontend Utilities

### Toast Notifications

**Location:** `/studio/web/src/lib/toast.ts`

Consistent toast notifications using Sonner:

```typescript
import {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showLoading,
  dismissToast,
} from "@/lib/toast";

// Simple notifications
showSuccess("Order updated successfully");
showError("Failed to save", "Please try again");
showWarning("Unsaved changes");
showInfo("Settings reset to defaults");

// Loading state
const toastId = showLoading("Processing...");
// ... async operation
dismissToast(toastId);
showSuccess("Done!");
```

### Form Validation

**Location:** `/studio/web/src/lib/validation.ts`

Reusable validation utilities:

```typescript
import { validators, validate, hasErrors } from "@/lib/validation";

// Single validator
const error = validators.required(value);
// => "This field is required" or null

// Chained validation
const error = validate(email, validators.required, validators.email);
// => First error or null

// Available validators
validators.required; // Non-empty
validators.email; // Email format
validators.url; // URL format (http/https)
validators.slug; // Lowercase letters, numbers, hyphens
validators.minLength(n); // Minimum length
validators.maxLength(n); // Maximum length
validators.positiveNumber; // >= 0
validators.greaterThanZero; // > 0
validators.percentage; // 0-100
```

### API Configuration

**Location:** `/studio/web/src/lib/constants.ts`

```typescript
import { API_CONFIG } from "@/lib/constants";

// Use in fetch calls
const response = await fetch(`${API_CONFIG.BASE_URL}/admin/orders`, {
  credentials: "include",
});
```

---

## UI Components

### Admin Components

**Location:** `/studio/web/src/components/admin/`

| Component            | Description                                 |
| -------------------- | ------------------------------------------- |
| `AdminPageHeader`    | Page title, description, and action buttons |
| `TableSkeleton`      | Loading skeleton for tables                 |
| `AdminTableSkeleton` | Full-page skeleton with stats and filters   |
| `OrderStatusBadge`   | Color-coded order status badge              |
| `TierBadge`          | Pricing tier badge                          |

**TableSkeleton Usage:**

```tsx
import { TableSkeleton, AdminTableSkeleton } from "@/components/admin";

// Simple table skeleton
<TableSkeleton columns={5} rows={10} showHeader showFilters />

// Full admin page skeleton with stats
<AdminTableSkeleton
  columns={7}
  rows={5}
  showStats
  statsCount={4}
  showFilters
  filterCount={3}
/>
```

### FormError Component

**Location:** `/studio/web/src/components/ui/form-error.tsx`

```tsx
import { FormError } from "@/components/ui";

<Input
  value={value}
  onChange={handleChange}
  aria-invalid={!!error}
/>
<FormError message={error} />
```

---

## Accessibility (a11y)

The admin dashboard follows WCAG guidelines:

### Focus Management

- All interactive elements have visible focus indicators
- Focus trapped in modals when open
- Logical tab order throughout

### ARIA Labels

- Icon-only buttons have `aria-label`
- Form fields connected to help text via `aria-describedby`
- Dynamic content uses `aria-live` for announcements
- Modals have `role="dialog"` and `aria-modal="true"`

### Screen Reader Support

- Proper heading hierarchy (h1 → h2 → h3)
- Decorative icons hidden with `aria-hidden="true"`
- Required fields indicated with `aria-required="true"`
- Error states use `aria-invalid="true"`

### Keyboard Navigation

- Arrow key navigation in dropdown menus
- Escape key closes modals
- Enter/Space activates buttons and toggles

---

## Mobile Responsiveness

The admin dashboard is fully responsive:

### Breakpoints

- `sm:` (640px) - Stack to row layouts
- `md:` (768px) - Sidebar visibility, column hiding
- `lg:` (1024px) - Extended layouts

### Sidebar

- Hidden by default on mobile
- Hamburger menu to toggle
- Overlay backdrop when open
- Slide-in animation

### Tables

- Horizontally scrollable with `overflow-x-auto`
- Less important columns hidden on mobile
- Pagination stacks vertically on small screens

### Forms

- Single column on mobile, two columns on tablet+
- Full-width buttons on mobile
- Stacked filter bars

---

## Quick Reference

### File Paths for Common Tasks

| Task                           | Path                                         |
| ------------------------------ | -------------------------------------------- |
| Add new admin page             | `web/src/app/(admin)/admin/{page}/page.tsx`  |
| Add new public page            | `web/src/app/(public)/{page}/page.tsx`       |
| Add new API route (public)     | `backend/src/routes/public/{name}.routes.ts` |
| Add new API route (admin)      | `backend/src/routes/admin/{name}.routes.ts`  |
| Add new service                | `backend/src/services/{name}.service.ts`     |
| Add new configurator component | `web/src/components/configurator/{name}.tsx` |
| Modify feature logic           | `web/src/lib/features/`                      |
| Modify pricing logic           | `web/src/lib/pricing/`                       |
| Modify database schema         | `backend/prisma/schema.prisma`               |
| Add seed data                  | `backend/prisma/seed.ts`                     |
| Add background job             | `backend/src/jobs/{name}.job.ts`             |

### Command Cheatsheet

```bash
# Development
cd studio/backend && pnpm dev          # Backend on :3001
cd studio/web && pnpm dev              # Frontend on :3002

# Database
cd studio/backend
pnpm db:generate                        # Generate Prisma client
pnpm db:migrate                         # Run migrations
pnpm db:migrate:deploy                  # Deploy migrations (production)
pnpm db:reset                           # Reset database
pnpm db:studio                          # Open Prisma Studio
pnpm db:seed                            # Seed database

# Build & Test
pnpm build                              # Build for production
pnpm lint                               # Run ESLint
pnpm typecheck                          # TypeScript type checking
pnpm test                               # Run tests
pnpm test:watch                         # Watch mode

# Code Generation
cd studio/backend
# Generate project ZIP for an order
# Called via API: POST /api/admin/orders/:id/download
```

### API Endpoints Summary

**Public API (`/api/*`):**
| Endpoint | Method | Description |
| ----------------------------- | ------ | -------------------------- |
| `/api/features` | GET | List features |
| `/api/templates` | GET | List templates |
| `/api/pricing/tiers` | GET | List pricing tiers |
| `/api/pricing/calculate` | POST | Calculate price |
| `/api/preview/session` | POST | Create preview session |
| `/api/checkout` | POST | Create checkout session |
| `/api/auth/admin/login` | POST | Admin login |
| `/api/auth/me` | GET | Get current user |

**Admin API (`/api/admin/*`):**
| Endpoint | Method | Description |
| ----------------------------- | ------ | -------------------------- |
| `/api/admin/dashboard/stats` | GET | Dashboard statistics |
| `/api/admin/orders` | GET | List orders |
| `/api/admin/orders/:id` | GET | Get order details |
| `/api/admin/orders/:id` | PATCH | Update order |
| `/api/admin/orders/:id/refund`| POST | Refund order |
| `/api/admin/templates` | CRUD | Template management |
| `/api/admin/features` | CRUD | Feature management |
| `/api/admin/pricing/tiers` | CRUD | Pricing tier management |
| `/api/admin/customers` | GET | Customer list |
| `/api/admin/licenses` | GET | License management |
| `/api/admin/coupons` | CRUD | Coupon management |
| `/api/admin/analytics/*` | GET | Analytics data |
| `/api/admin/settings` | GET/PUT| Platform settings |

---

## Related Documentation

- [Fullstack Starter Main CLAUDE.md](../CLAUDE.md)
- [Studio Web CLAUDE.md](./web/CLAUDE.md)
- [Studio Backend CLAUDE.md](./backend/CLAUDE.md)
- [Prisma Schema](./backend/prisma/schema.prisma)
- [@studio/shared types](./shared/)
