# Studio Web Frontend

> **Last Updated**: 2026-02-11

AI-optimized documentation for the Studio web frontend (Next.js 15 + React 19).

---

## Overview

The Studio web frontend is a Next.js 15 application that provides:

1. **Public Pages** - Feature configurator, preview, checkout, showcase
2. **Admin Dashboard** - Order management, analytics, settings
3. **Feature Configuration** - Interactive feature selection with dependency resolution
4. **Live Preview** - Real-time preview of configured applications
5. **Checkout Flow** - Stripe-powered payment processing

---

## Project Structure

```
studio/web/
├── src/
│   ├── app/
│   │   ├── (public)/              # Public routes (no auth)
│   │   │   ├── page.tsx           # Landing page
│   │   │   ├── configure/         # Feature configurator
│   │   │   ├── preview/           # Live preview
│   │   │   ├── checkout/          # Checkout flow
│   │   │   │   └── success/       # Success page
│   │   │   ├── showcase/          # Component showcase
│   │   │   │   ├── [category]/    # Category view
│   │   │   │   └── [category]/[slug]/ # Component detail
│   │   │   ├── pricing/           # Pricing page
│   │   │   └── templates/         # Templates listing
│   │   ├── (admin)/               # Admin routes (auth required)
│   │   │   ├── login/             # Admin login
│   │   │   ├── layout.tsx         # Auth guard wrapper
│   │   │   └── admin/
│   │   │       ├── page.tsx       # Dashboard
│   │   │       ├── orders/        # Order management
│   │   │       ├── templates/     # Template CRUD
│   │   │       ├── features/      # Feature management
│   │   │       ├── pricing/       # Tier management
│   │   │       ├── customers/     # Customer list
│   │   │       ├── licenses/      # License management
│   │   │       ├── coupons/       # Coupon management
│   │   │       ├── analytics/     # Analytics dashboard
│   │   │       └── settings/      # Platform settings
│   │   ├── api/
│   │   │   └── health/            # Health check endpoint
│   │   ├── layout.tsx             # Root layout
│   │   └── page.tsx               # Root redirect
│   │
│   ├── components/
│   │   ├── configurator/          # Feature configuration UI
│   │   │   ├── context.tsx        # ConfiguratorProvider state
│   │   │   ├── category-sidebar.tsx
│   │   │   ├── feature-card.tsx
│   │   │   ├── feature-list.tsx
│   │   │   ├── tier-selector.tsx
│   │   │   ├── cart-summary.tsx
│   │   │   ├── template-picker.tsx
│   │   │   ├── dependency-badge.tsx
│   │   │   ├── price-breakdown.tsx
│   │   │   └── index.ts
│   │   ├── preview/               # Device preview components
│   │   │   ├── preview-canvas.tsx
│   │   │   ├── device-frame.tsx
│   │   │   ├── device-toolbar.tsx
│   │   │   ├── feature-panel.tsx
│   │   │   └── index.ts
│   │   ├── showcase/              # Component documentation
│   │   │   ├── code-block.tsx
│   │   │   ├── props-table.tsx
│   │   │   ├── component-preview.tsx
│   │   │   ├── component-card.tsx
│   │   │   ├── category-nav.tsx
│   │   │   ├── search-filter.tsx
│   │   │   └── index.ts
│   │   ├── admin/                 # Admin UI components
│   │   │   ├── admin-page-header.tsx
│   │   │   ├── admin-filters.tsx
│   │   │   ├── status-badges.tsx
│   │   │   ├── table-skeleton.tsx
│   │   │   └── index.ts
│   │   ├── public/                # Public page components
│   │   │   ├── public-header.tsx
│   │   │   ├── public-footer.tsx
│   │   │   └── index.ts
│   │   └── ui/                    # Shared UI primitives
│   │       ├── button.tsx
│   │       ├── skeleton.tsx
│   │       ├── image-upload.tsx
│   │       ├── form-error.tsx
│   │       └── index.ts
│   │
│   └── lib/
│       ├── features/              # Feature logic
│       │   ├── types.ts           # Feature types
│       │   ├── registry.ts        # FeatureRegistry class
│       │   ├── dependencies.ts    # DependencyResolver class
│       │   ├── validation.ts      # ConfigurationValidator
│       │   ├── hooks.ts           # React hooks
│       │   └── index.ts
│       ├── pricing/               # Pricing logic
│       │   ├── types.ts           # Pricing types
│       │   ├── calculator.ts      # PricingCalculator class
│       │   ├── tiers.ts           # Tier utilities
│       │   ├── bundles.ts         # Bundle utilities
│       │   ├── hooks.ts           # React hooks
│       │   └── index.ts
│       ├── preview/               # Preview logic
│       │   ├── feature-flags.tsx  # FeatureFlagProvider
│       │   ├── conditional-render.tsx # Gate components
│       │   ├── hooks.ts           # Preview hooks
│       │   └── index.ts
│       ├── config/                # Configuration persistence
│       │   ├── persistence.ts     # LocalStorage persistence
│       │   ├── url-state.ts       # URL state management
│       │   └── index.ts
│       ├── showcase/              # Showcase logic
│       │   ├── component-registry.ts
│       │   ├── code-examples.ts
│       │   └── index.ts
│       ├── api/                   # API utilities
│       │   └── index.ts
│       ├── api.ts                 # API client & types
│       ├── constants.ts           # App constants
│       ├── utils.ts               # Utility functions
│       ├── toast.ts               # Toast notifications
│       ├── validation.ts          # Form validation
│       ├── auth-context.tsx       # Auth context
│       └── theme-context.tsx      # Theme context
```

---

## Feature Configurator Flow

### Overview

The configurator allows users to select features and calculate pricing dynamically.

```
┌─────────────────────────────────────────────────────────────────┐
│                    ConfiguratorProvider                          │
│  (Context wrapping the entire configurator page)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Load Data on Mount                                          │
│     - Fetch features, modules, tiers, templates from API        │
│     - Initialize DependencyResolver and PricingCalculator       │
│                                                                  │
│  2. User Selects Feature                                        │
│     └─> toggleFeature(slug)                                     │
│         └─> DependencyResolver.canSelect(slug, selected)        │
│             ├─> Check conflicts                                 │
│             └─> If valid, add to selectedFeatures               │
│                                                                  │
│  3. Resolve Dependencies (useEffect)                            │
│     └─> DependencyResolver.resolveSelection(userSelected, tier) │
│         ├─> Get all recursive dependencies                      │
│         ├─> Separate: userSelected, autoSelected, tierIncluded  │
│         └─> Detect any conflicts                                │
│                                                                  │
│  4. Calculate Pricing (useEffect)                               │
│     └─> PricingCalculator.calculate({tier, features, coupon})   │
│         ├─> Tier base price                                     │
│         ├─> Add-on features price (not in tier)                 │
│         ├─> Apply bundle discounts                              │
│         ├─> Apply coupon discount                               │
│         └─> Calculate tax and total                             │
│                                                                  │
│  5. Update UI                                                   │
│     - Feature cards show selected/auto-selected/included states │
│     - Cart summary shows pricing breakdown                      │
│     - Dependency badges show requires/conflicts                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Classes

#### DependencyResolver

**Location:** `lib/features/dependencies.ts`

Handles feature dependencies and conflicts using graph-based resolution.

```typescript
const resolver = new DependencyResolver(features);

// Get all dependencies (recursive)
resolver.getDependencies("payments-subscription");
// => ["auth-basic", "payments-stripe"]

// Check if feature can be selected
resolver.canSelect("auth-firebase", ["auth-supabase"]);
// => { canSelect: false, reason: "Conflicts with auth-supabase" }

// Resolve complete selection
resolver.resolveSelection(userSelected, tierIncluded);
// => { selectedFeatures, userSelected, autoSelected, tierIncluded, conflicts, isValid }
```

#### PricingCalculator

**Location:** `lib/pricing/calculator.ts`

Calculates prices with tier pricing, add-ons, discounts, and coupons.

```typescript
const calculator = new PricingCalculator(features, tiers, bundles, taxRate);

const price = calculator.calculate({
  tier: "pro",
  selectedFeatures: ["analytics-advanced"],
  couponCode: "SAVE20",
});
// => { tierPrice, featuresPrice, subtotal, bundleDiscounts, couponDiscount, total }
```

#### ConfiguratorProvider

**Location:** `components/configurator/context.tsx`

React context for configurator state management.

```tsx
<ConfiguratorProvider>
  <ConfiguratorPage />
</ConfiguratorProvider>;

// In child components:
const {
  selectedTier,
  selectedFeatures,
  pricing,
  toggleFeature,
  setTier,
  isFeatureSelected,
  isFeatureIncludedInTier,
  formatPrice,
} = useConfigurator();
```

---

## Preview System

### FeatureFlagProvider

**Location:** `lib/preview/feature-flags.tsx`

Controls feature-based conditional rendering in previews.

```tsx
<FeatureFlagProvider features={["auth-basic", "payments-stripe"]} tier="pro">
  <AppPreview />
</FeatureFlagProvider>

// In preview components:
const { hasFeature, hasTier } = useFeatureFlags();

// Gate components:
<FeatureGate feature="payments-stripe" fallback={<BasicPayments />}>
  <StripeIntegration />
</FeatureGate>

<TierGate tier="pro">
  <ProFeatures />
</TierGate>
```

---

## Admin Dashboard

### Authentication Flow

1. Navigate to `/login`
2. Submit credentials -> POST `/api/auth/admin/login`
3. JWT stored in HTTP-only cookie
4. All admin routes wrapped in auth guard (`(admin)/layout.tsx`)
5. Session checked via GET `/api/auth/me` on page load

### Admin Pages

| Page      | Route              | Features                                |
| --------- | ------------------ | --------------------------------------- |
| Dashboard | `/admin`           | Stats, charts, recent orders            |
| Orders    | `/admin/orders`    | List, filter, status, refund, export    |
| Templates | `/admin/templates` | CRUD, feature selection                 |
| Features  | `/admin/features`  | CRUD, dependencies, pricing             |
| Pricing   | `/admin/pricing`   | Tier management, bundle discounts       |
| Customers | `/admin/customers` | Customer list, search, order history    |
| Licenses  | `/admin/licenses`  | List, revoke, regenerate download       |
| Coupons   | `/admin/coupons`   | CRUD, usage tracking                    |
| Analytics | `/admin/analytics` | Revenue charts, conversion funnel       |
| Settings  | `/admin/settings`  | Payment, email, download, feature flags |

---

## Component Showcase

The showcase system documents and demonstrates UI components.

### Structure

- **Category pages:** `/showcase/[category]` - Lists components in category
- **Component pages:** `/showcase/[category]/[slug]` - Component detail with:
  - Live preview
  - Props table
  - Code examples
  - Usage notes

### Component Registry

**Location:** `lib/showcase/component-registry.ts`

```typescript
const registry = {
  buttons: {
    button: { name: "Button", component: Button, ... },
    "icon-button": { name: "Icon Button", ... },
  },
  forms: { ... },
  feedback: { ... },
};
```

---

## Key Utilities

### Toast Notifications

**Location:** `lib/toast.ts`

```typescript
import { showSuccess, showError, showWarning, showLoading } from "@/lib/toast";

showSuccess("Order updated");
showError("Failed to save", "Please try again");
const id = showLoading("Processing...");
// ... later
dismissToast(id);
```

### Form Validation

**Location:** `lib/validation.ts`

```typescript
import { validators, validate } from "@/lib/validation";

const error = validate(email, validators.required, validators.email);
// Available: required, email, url, slug, minLength, maxLength, positiveNumber, percentage
```

### API Configuration

**Location:** `lib/constants.ts`

```typescript
import { API_CONFIG } from "@/lib/constants";

fetch(`${API_CONFIG.BASE_URL}/admin/orders`, { credentials: "include" });
```

---

## File Paths for Common Tasks

| Task                       | Path                                     |
| -------------------------- | ---------------------------------------- |
| Add admin page             | `src/app/(admin)/admin/{page}/page.tsx`  |
| Add public page            | `src/app/(public)/{page}/page.tsx`       |
| Add configurator component | `src/components/configurator/{name}.tsx` |
| Add showcase component     | `src/components/showcase/{name}.tsx`     |
| Add admin component        | `src/components/admin/{name}.tsx`        |
| Modify feature logic       | `src/lib/features/`                      |
| Modify pricing logic       | `src/lib/pricing/`                       |
| Modify preview logic       | `src/lib/preview/`                       |
| Add API types              | `src/lib/api.ts`                         |
| Add constants              | `src/lib/constants.ts`                   |

---

## Command Cheatsheet

```bash
# Development
pnpm dev                    # Start dev server on :3002

# Build
pnpm build                  # Production build
pnpm start                  # Start production server

# Code Quality
pnpm lint                   # Run ESLint
pnpm typecheck              # TypeScript type checking

# Testing
pnpm test                   # Run tests
pnpm test:watch             # Watch mode
pnpm test:e2e               # Playwright E2E tests
```

---

## Environment Variables

```bash
# Required
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Optional
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## Related Documentation

- [Studio Main CLAUDE.md](../CLAUDE.md)
- [Studio Backend CLAUDE.md](../backend/CLAUDE.md)
- [Fullstack Starter CLAUDE.md](../../CLAUDE.md)
