# Starter Studio Module

## Overview

The **Starter Studio** is a full-stack configuration and pricing platform that allows users to:

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
DATABASE_URL="postgresql://user:pass@localhost:5432/studio"
PORT=3001
NODE_ENV=development
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:3002
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

## Related Documentation

- [Fullstack Starter Main CLAUDE.md](/home/proha/.worspace/fullstack-starter/CLAUDE.md)
- [Prisma Schema](/home/proha/.worspace/fullstack-starter/studio/backend/prisma/schema.prisma)
- [@studio/shared types](shared types package)
