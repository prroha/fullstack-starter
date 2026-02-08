# Starter Studio - Product Documentation

> Build Your Own SaaS Platform - A template marketplace with dynamic configuration, live preview, and instant code generation.

**Version:** 1.0.0
**Last Updated:** 2026-02-08
**Status:** Planning → MVP Development

---

## Table of Contents

1. [Vision & Overview](#vision--overview)
2. [Architecture](#architecture)
3. [Feature Tiers & Pricing](#feature-tiers--pricing)
4. [Admin Panels](#admin-panels)
5. [Template Presets](#template-presets)
6. [Technical Implementation](#technical-implementation)
7. [Development Phases](#development-phases)
8. [Phase Checklists](#phase-checklists)

---

## Vision & Overview

### What is Starter Studio?

Starter Studio is a **self-service platform** where developers and entrepreneurs can:

1. **Browse** all available components, features, and layouts
2. **Configure** their app by selecting features they need
3. **Preview** a fully working app with their selections
4. **Pay** for their configuration
5. **Download** production-ready code

### Value Proposition

| For Customers | For Us (Company) |
|---------------|------------------|
| Save weeks of development time | Recurring revenue from one codebase |
| Pay only for what they need | Scalable business model |
| Preview before buying | Low support overhead |
| Production-ready code | Continuous improvement cycle |
| Multiple app templates | Multiple revenue streams |

### Unique Differentiators

1. **Modular Pricing** - Pay per feature, not flat rate
2. **Live Preview** - See your app working before purchase
3. **Template Presets** - Quick-start with pre-configured apps
4. **Code Ownership** - Download and own your code forever
5. **No Vendor Lock-in** - Standard tech stack, no proprietary tools

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         STARTER STUDIO                               │
│                    (Public-Facing Platform)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────────┐ │
│  │   SHOWCASE   │  │ CONFIGURATOR │  │         PREVIEW            │ │
│  │              │  │              │  │                            │ │
│  │ • Components │  │ • Features   │  │ • Live working app         │ │
│  │ • Layouts    │  │ • Tiers      │  │ • All pages functional     │ │
│  │ • Features   │  │ • Pricing    │  │ • Demo data                │ │
│  │ • Docs       │  │ • Cart       │  │ • Responsive viewports     │ │
│  │ • Demos      │  │ • Templates  │  │ • Feature flags driven     │ │
│  └──────────────┘  └──────────────┘  └────────────────────────────┘ │
│                            │                                         │
│                            ▼                                         │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                        CHECKOUT                               │   │
│  │  • Stripe Payment  • License Generation  • Code Generation   │   │
│  │  • Email Delivery  • Download Link       • Order History     │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                    COMPANY ADMIN PANEL                               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │ Sales & │ │Template │ │ Preview │ │  User   │ │Analytics│       │
│  │ Orders  │ │  Mgmt   │ │  Stats  │ │  Mgmt   │ │& Reports│       │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘       │
├─────────────────────────────────────────────────────────────────────┤
│                      CORE SYSTEM (Template)                          │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ │
│  │  CRUD  │ │  Auth  │ │Security│ │Payments│ │ Admin  │ │  ...   │ │
│  │ (Base) │ │ (+$)   │ │  (+$)  │ │  (+$)  │ │  (+$)  │ │  (+$)  │ │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│                      TEMPLATE PRESETS                                │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐          │
│  │ LMS │ │Book-│ │Event│ │Task │ │Invoi│ │Help-│ │ CRM │          │
│  │     │ │ ing │ │Mgmt │ │Mgmt │ │cing │ │desk │ │     │          │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘          │
└─────────────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
fullstack-starter/
├── core/                              # Core template system
│   ├── backend/                       # Backend modules
│   ├── web/                           # Web components & pages
│   └── mobile/                        # Mobile widgets & screens
│
├── studio/                            # Starter Studio platform
│   ├── web/                           # Studio website
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (public)/          # Public pages
│   │   │   │   │   ├── page.tsx       # Landing/Home
│   │   │   │   │   ├── showcase/      # Component showcase
│   │   │   │   │   ├── pricing/       # Pricing & configurator
│   │   │   │   │   ├── templates/     # Template presets
│   │   │   │   │   └── preview/       # Live preview
│   │   │   │   ├── (checkout)/        # Checkout flow
│   │   │   │   └── (admin)/           # Company admin panel
│   │   │   ├── components/
│   │   │   │   ├── showcase/          # Showcase components
│   │   │   │   ├── configurator/      # Configuration UI
│   │   │   │   ├── preview/           # Preview engine
│   │   │   │   └── admin/             # Admin components
│   │   │   └── lib/
│   │   │       ├── features/          # Feature registry
│   │   │       ├── pricing/           # Pricing engine
│   │   │       └── generator/         # Code generator
│   │   └── package.json
│   │
│   └── backend/                       # Studio API
│       ├── src/
│       │   ├── modules/
│       │   │   ├── orders/            # Order management
│       │   │   ├── templates/         # Template management
│       │   │   ├── analytics/         # Usage analytics
│       │   │   ├── generator/         # Code generation
│       │   │   └── licenses/          # License management
│       │   └── app.ts
│       └── prisma/
│           └── schema.prisma
│
├── templates/                         # Pre-configured templates
│   ├── lms/                           # Learning Management
│   ├── booking/                       # Appointment Booking
│   ├── events/                        # Event Management
│   ├── invoicing/                     # Invoice & Billing
│   ├── tasks/                         # Task Management
│   └── helpdesk/                      # Customer Support
│
├── docs/                              # Documentation
│   ├── STARTER_STUDIO.md              # This file
│   ├── FEATURE_REGISTRY.md            # Feature definitions
│   ├── PRICING_STRUCTURE.md           # Pricing details
│   └── API.md                         # API documentation
│
└── scripts/
    ├── generate-project.ts            # Project generator
    ├── build-preview.ts               # Preview builder
    └── bundle-template.ts             # Template bundler
```

---

## Feature Tiers & Pricing

### Tier Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│                           PRICING TIERS                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────┐                                                │
│  │   BASIC ($0)    │  Foundation - CRUD operations only             │
│  │   ─────────────  │                                                │
│  │   • Project Setup (TypeScript, ESLint, Prettier)                 │
│  │   • Basic CRUD Operations                                        │
│  │   • Database Setup (Prisma + PostgreSQL)                         │
│  │   • Basic UI Components (Button, Input, Card, etc.)              │
│  │   • Basic Layouts (Container, Stack, Grid)                       │
│  │   • Basic API Structure                                          │
│  │   • Environment Configuration                                    │
│  │                                                                  │
│  │   ⚠️  NO: Auth, Security, Rate Limiting, Admin                  │
│  └─────────────────┘                                                │
│           │                                                          │
│           ▼                                                          │
│  ┌─────────────────┐                                                │
│  │  STARTER ($49)  │  Add authentication & basic security           │
│  │  ───────────────  │                                                │
│  │  Everything in Basic, PLUS:                                      │
│  │   • Email/Password Authentication                                │
│  │   • JWT Sessions                                                 │
│  │   • Password Reset Flow                                          │
│  │   • Email Verification                                           │
│  │   • Basic Rate Limiting                                          │
│  │   • CSRF Protection                                              │
│  │   • Auth Pages (Login, Register, etc.)                           │
│  └─────────────────┘                                                │
│           │                                                          │
│           ▼                                                          │
│  ┌─────────────────┐                                                │
│  │   PRO ($149)    │  Add admin panel & advanced features           │
│  │  ───────────────  │                                                │
│  │  Everything in Starter, PLUS:                                    │
│  │   • Admin Dashboard Layout                                       │
│  │   • User Management                                              │
│  │   • Role-Based Access Control                                    │
│  │   • Audit Logging                                                │
│  │   • Basic Analytics (Charts, Stats)                              │
│  │   • Settings Management                                          │
│  │   • File Uploads (Avatar, Documents)                             │
│  └─────────────────┘                                                │
│           │                                                          │
│           ▼                                                          │
│  ┌─────────────────┐                                                │
│  │ BUSINESS ($299) │  Full-featured business application            │
│  │  ───────────────  │                                                │
│  │  Everything in Pro, PLUS:                                        │
│  │   • Payment Integration (Stripe)                                 │
│  │   • Subscription Management                                      │
│  │   • Email Notifications (Resend)                                 │
│  │   • Real-time Features (WebSockets)                              │
│  │   • Advanced Analytics                                           │
│  │   • Export Functions (CSV, PDF)                                  │
│  │   • Multi-tenancy Support                                        │
│  │   • API Rate Limiting (Advanced)                                 │
│  └─────────────────┘                                                │
│           │                                                          │
│           ▼                                                          │
│  ┌─────────────────┐                                                │
│  │ENTERPRISE ($499)│  Everything + premium support                  │
│  │  ───────────────  │                                                │
│  │  Everything in Business, PLUS:                                   │
│  │   • Social Authentication                                        │
│  │   • Two-Factor Authentication                                    │
│  │   • SSO Integration                                              │
│  │   • White-labeling                                               │
│  │   • Priority Support (30 days)                                   │
│  │   • Custom Branding                                              │
│  │   • Mobile App (Flutter)                                         │
│  └─────────────────┘                                                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Individual Add-ons (À La Carte)

| Category | Add-on | Price | Requires |
|----------|--------|-------|----------|
| **AUTH** | Social Login (Google, GitHub, Facebook) | $29 | Starter+ |
| **AUTH** | Two-Factor Authentication | $39 | Starter+ |
| **AUTH** | Magic Link / Passwordless | $29 | Starter+ |
| **AUTH** | SSO (SAML/OIDC) | $99 | Pro+ |
| **SECURITY** | Advanced Rate Limiting | $29 | Starter+ |
| **SECURITY** | IP Blocking & Geofencing | $39 | Pro+ |
| **SECURITY** | Audit Logging | $29 | Starter+ |
| **PAYMENTS** | One-Time Payments (Stripe) | $49 | Starter+ |
| **PAYMENTS** | Subscriptions & Billing | $79 | Starter+ |
| **PAYMENTS** | Usage-Based Billing | $49 | Pro+ |
| **PAYMENTS** | Multi-Currency | $29 | Pro+ |
| **STORAGE** | File Uploads (S3/R2) | $39 | Basic+ |
| **STORAGE** | Image Processing | $29 | Basic+ |
| **STORAGE** | Document Generation (PDF) | $39 | Basic+ |
| **COMMS** | Transactional Email | $29 | Basic+ |
| **COMMS** | Email Templates | $19 | Basic+ |
| **COMMS** | Push Notifications | $39 | Starter+ |
| **COMMS** | Real-time (WebSockets) | $49 | Starter+ |
| **COMMS** | SMS Notifications | $39 | Pro+ |
| **UI** | Dashboard Layout | $29 | Basic+ |
| **UI** | Admin Panel | $49 | Starter+ |
| **UI** | Landing Page Templates | $39 | Basic+ |
| **UI** | Email Templates (HTML) | $29 | Basic+ |
| **ANALYTICS** | Basic Charts & Stats | $29 | Basic+ |
| **ANALYTICS** | Advanced Analytics Dashboard | $49 | Pro+ |
| **ANALYTICS** | Export (CSV/Excel) | $19 | Basic+ |
| **ANALYTICS** | Report Generation (PDF) | $39 | Pro+ |
| **MOBILE** | Flutter Mobile App | $99 | Starter+ |
| **MOBILE** | Push Notifications (Mobile) | $39 | Mobile |
| **MOBILE** | Offline Support | $49 | Mobile |

### Pricing Calculator Example

```
┌─────────────────────────────────────────────────────────────────────┐
│  YOUR CONFIGURATION                                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Base Tier: STARTER                                          $49.00 │
│                                                                      │
│  Add-ons Selected:                                                   │
│  ├─ [✓] Social Login (Google, GitHub)                       +$29.00 │
│  ├─ [✓] File Uploads (S3)                                   +$39.00 │
│  ├─ [✓] Transactional Email                                 +$29.00 │
│  ├─ [✓] Dashboard Layout                                    +$29.00 │
│  └─ [✓] Basic Charts & Stats                                +$29.00 │
│                                                              ─────── │
│                                                    Subtotal: $204.00 │
│                                                                      │
│  💡 TIP: Upgrade to PRO tier ($149) to save $55!                    │
│     PRO includes: Dashboard Layout, Audit Logging, File Uploads     │
│                                                                      │
│  [  Apply PRO Upgrade  ]                                            │
│                                                              ─────── │
│                                              YOUR TOTAL:     $178.00 │
│                                                                      │
│  [    Preview Your App    ]     [    Checkout $178    ]             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Admin Panels

### Two Types of Admin Panels

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ADMIN PANELS                                 │
├──────────────────────────────┬──────────────────────────────────────┤
│      COMPANY ADMIN           │         CUSTOMER ADMIN               │
│   (For Us - Platform Owner)  │    (For Customers - In Their App)    │
├──────────────────────────────┼──────────────────────────────────────┤
│                              │                                      │
│  FREE (Internal Use)         │  PAID ADD-ON ($49-99)                │
│                              │                                      │
│  • Sales & Revenue           │  • User Management                   │
│  • Order Management          │  • Role-Based Access                 │
│  • Template Management       │  • Audit Logs                        │
│  • Preview Analytics         │  • Settings                          │
│  • User/Customer Mgmt        │  • Analytics Dashboard               │
│  • License Management        │  • Reports & Export                  │
│  • Coupon/Discount Mgmt      │  • Content Management                │
│  • Feature Usage Stats       │  • System Health                     │
│  • Revenue Reports           │                                      │
│  • System Health             │  Included in: Pro, Business,         │
│                              │  Enterprise tiers                    │
│                              │                                      │
└──────────────────────────────┴──────────────────────────────────────┘
```

### Company Admin Panel Features

#### 1. Dashboard Overview
```
┌─────────────────────────────────────────────────────────────────────┐
│  STARTER STUDIO - ADMIN DASHBOARD                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  📊 TODAY'S STATS                                                    │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │  Sales  │ │ Revenue │ │Previews │ │Downloads│ │  Users  │       │
│  │   12    │ │ $2,340  │ │   847   │ │   45    │ │  1,234  │       │
│  │  +23%   │ │  +15%   │ │  +45%   │ │  +12%   │ │  +8%    │       │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘       │
│                                                                      │
│  📈 REVENUE CHART (Last 30 Days)                                    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                    ▄▄       │   │
│  │                                          ▄▄      ████      │   │
│  │                              ▄▄  ██     ████    ██████     │   │
│  │               ▄▄    ██      ████████   ██████  ████████    │   │
│  │      ██      ████  ████    ██████████ ████████████████     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  🔥 TOP SELLING                    📦 RECENT ORDERS                 │
│  ┌──────────────────────────┐     ┌──────────────────────────┐     │
│  │ 1. LMS Template    $299  │     │ #1234 - Pro Tier   $149  │     │
│  │ 2. Pro Tier        $149  │     │ #1233 - LMS        $299  │     │
│  │ 3. Booking         $249  │     │ #1232 - Business   $299  │     │
│  │ 4. Business Tier   $299  │     │ #1231 - Starter     $49  │     │
│  └──────────────────────────┘     └──────────────────────────┘     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

#### 2. Order Management
- View all orders with filters (date, status, tier, template)
- Order details (features selected, payment info)
- Refund management
- Download regeneration
- License management

#### 3. Template Management
- Create/Edit/Delete templates
- Set template pricing
- Configure included features
- Preview templates
- Enable/Disable templates
- Analytics per template

#### 4. Preview Analytics
- Track preview sessions
- Feature selection patterns
- Conversion rates (preview → purchase)
- Drop-off points
- A/B testing data

#### 5. User Management
- Customer list
- Purchase history per user
- Account status
- Support tickets

#### 6. Coupon & Discounts
- Create discount codes
- Percentage or fixed discounts
- Usage limits
- Expiration dates
- Tier-specific discounts

#### 7. Reports
- Revenue reports
- Sales by tier/template
- Feature popularity
- Geographic distribution
- Export to CSV/PDF

---

## Template Presets

### Available Templates

| Template | Description | Price | Tier Equivalent |
|----------|-------------|-------|-----------------|
| **LMS** | Learning Management System | $299 | Business + Courses module |
| **Booking** | Appointment Booking | $249 | Pro + Booking module |
| **Events** | Event Management & Ticketing | $199 | Pro + Events module |
| **Invoicing** | Invoice & Client Management | $179 | Pro + Invoicing module |
| **Tasks** | Project & Task Management | $199 | Pro + Tasks module |
| **Helpdesk** | Customer Support System | $249 | Business + Tickets module |
| **CRM** | Customer Relationship Mgmt | $349 | Business + CRM module |
| **Marketplace** | Multi-vendor Marketplace | $449 | Enterprise + Marketplace |

### Template: LMS (Learning Management System)

```
┌─────────────────────────────────────────────────────────────────────┐
│  TEMPLATE: LEARNING MANAGEMENT SYSTEM                                │
│  Price: $299 (Save $127 vs individual features)                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  INCLUDED FEATURES:                                                  │
│                                                                      │
│  ✅ CORE                          ✅ UI & LAYOUTS                    │
│  • TypeScript + ESLint            • All UI Components                │
│  • Prisma + PostgreSQL            • Dashboard Layout                 │
│  • API Structure                  • Admin Panel                      │
│                                   • Landing Pages                    │
│  ✅ AUTHENTICATION                                                   │
│  • Email/Password                 ✅ PAYMENTS                        │
│  • Social Login (Google)          • Stripe Integration               │
│  • Email Verification             • Subscription Plans               │
│  • Password Reset                 • Course Purchases                 │
│                                   • Instructor Payouts               │
│  ✅ SECURITY                                                         │
│  • JWT Sessions                   ✅ COMMUNICATIONS                  │
│  • CSRF Protection                • Transactional Email              │
│  • Rate Limiting                  • Email Templates                  │
│  • Role-Based Access              • Notifications                    │
│                                                                      │
│  ✅ LMS-SPECIFIC MODULES:                                            │
│  • Course Management              • Quiz & Assessments               │
│  • Lesson Builder (Video/Text)    • Progress Tracking                │
│  • Student Enrollment             • Certificates (QR)                │
│  • Instructor Dashboard           • Course Reviews                   │
│  • Categories & Tags              • Search & Filters                 │
│                                                                      │
│  📱 OPTIONAL ADD-ONS:                                                │
│  • Flutter Mobile App (+$99)      • Live Classes (+$79)              │
│  • Discussion Forums (+$49)       • Gamification (+$59)              │
│                                                                      │
│  [  Preview LMS  ]    [  Customize  ]    [  Buy $299  ]             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Technical Implementation

### Feature Registry System

```typescript
// lib/features/registry.ts

export interface Feature {
  id: string;
  name: string;
  description: string;
  category: FeatureCategory;
  price: number;
  tier?: Tier;                    // Minimum tier required
  requires?: string[];            // Dependency feature IDs
  conflicts?: string[];           // Conflicting feature IDs
  files: FileMapping[];           // Files to include
  dependencies: PackageDep[];     // npm/pub packages
  schemas?: SchemaMapping[];      // Prisma schema additions
  envVars?: EnvVar[];            // Required environment variables
}

export interface FileMapping {
  source: string;                 // Source path in core
  destination: string;            // Destination in generated project
  transform?: TransformFn;        // Optional transformation
}

export const featureRegistry: Record<string, Feature> = {
  // BASIC TIER (Free)
  'core.setup': {
    id: 'core.setup',
    name: 'Project Setup',
    description: 'TypeScript, ESLint, Prettier configuration',
    category: 'core',
    price: 0,
    tier: 'basic',
    files: [
      { source: 'core/backend/tsconfig.json', destination: 'backend/tsconfig.json' },
      { source: 'core/backend/.eslintrc.js', destination: 'backend/.eslintrc.js' },
      // ...
    ],
    dependencies: [
      { name: 'typescript', version: '^5.0.0', dev: true },
      { name: 'eslint', version: '^9.0.0', dev: true },
    ],
  },

  'core.crud': {
    id: 'core.crud',
    name: 'Basic CRUD Operations',
    description: 'Create, Read, Update, Delete API structure',
    category: 'core',
    price: 0,
    tier: 'basic',
    requires: ['core.setup'],
    files: [
      { source: 'core/backend/src/utils/response.ts', destination: 'backend/src/utils/response.ts' },
      { source: 'core/backend/src/utils/errors.ts', destination: 'backend/src/utils/errors.ts' },
    ],
  },

  // STARTER TIER ($49)
  'auth.basic': {
    id: 'auth.basic',
    name: 'Basic Authentication',
    description: 'Email/Password login with JWT sessions',
    category: 'auth',
    price: 49,
    tier: 'starter',
    requires: ['core.setup', 'core.crud'],
    files: [
      { source: 'core/backend/src/middleware/auth.middleware.ts', destination: '...' },
      { source: 'core/backend/src/routes/auth.routes.ts', destination: '...' },
      { source: 'core/backend/src/services/auth.service.ts', destination: '...' },
      { source: 'core/web/src/app/(auth)/**/*', destination: '...' },
    ],
    schemas: [
      { model: 'User', source: 'core/backend/prisma/models/user.prisma' },
      { model: 'Session', source: 'core/backend/prisma/models/session.prisma' },
    ],
    envVars: [
      { key: 'JWT_SECRET', description: 'JWT signing secret', required: true },
      { key: 'JWT_EXPIRES_IN', description: 'Token expiration', default: '7d' },
    ],
  },

  'security.csrf': {
    id: 'security.csrf',
    name: 'CSRF Protection',
    description: 'Cross-Site Request Forgery protection',
    category: 'security',
    price: 0, // Included with auth
    tier: 'starter',
    requires: ['auth.basic'],
    files: [
      { source: 'core/backend/src/middleware/csrf.middleware.ts', destination: '...' },
    ],
  },

  // ... more features
};
```

### Preview Engine

```typescript
// lib/preview/engine.ts

export interface PreviewConfig {
  selectedFeatures: string[];
  templateId?: string;
  customizations?: Record<string, unknown>;
}

export class PreviewEngine {
  private featureFlags: Record<string, boolean> = {};

  constructor(config: PreviewConfig) {
    this.featureFlags = this.buildFeatureFlags(config.selectedFeatures);
  }

  private buildFeatureFlags(features: string[]): Record<string, boolean> {
    const flags: Record<string, boolean> = {};

    for (const feature of features) {
      flags[feature] = true;

      // Include dependencies
      const deps = featureRegistry[feature]?.requires || [];
      for (const dep of deps) {
        flags[dep] = true;
      }
    }

    return flags;
  }

  hasFeature(featureId: string): boolean {
    return this.featureFlags[featureId] ?? false;
  }

  getPreviewUrl(): string {
    const encoded = encodeURIComponent(JSON.stringify(this.featureFlags));
    return `/preview?features=${encoded}`;
  }
}

// In preview app
export function PreviewApp() {
  const features = useFeatureFlags();

  return (
    <FeatureFlagProvider flags={features}>
      <AppShell>
        {features.has('auth.basic') && <AuthRoutes />}
        {features.has('ui.dashboard') && <DashboardLayout />}
        {features.has('admin.panel') && <AdminRoutes />}
        {/* ... */}
      </AppShell>
    </FeatureFlagProvider>
  );
}
```

### Code Generator

```typescript
// lib/generator/index.ts

export interface GeneratorConfig {
  orderId: string;
  features: string[];
  templateId?: string;
  projectName: string;
  outputFormat: 'zip' | 'github';
}

export class ProjectGenerator {
  async generate(config: GeneratorConfig): Promise<GeneratedProject> {
    const steps = [
      this.createProjectStructure,
      this.copyBaseFiles,
      this.copyFeatureFiles,
      this.generatePrismaSchema,
      this.generatePackageJson,
      this.generateEnvExample,
      this.generateReadme,
      this.cleanupUnusedCode,
      this.runLinter,
      this.createBundle,
    ];

    let project = new GeneratedProject(config);

    for (const step of steps) {
      project = await step.call(this, project);
    }

    return project;
  }

  private async copyFeatureFiles(project: GeneratedProject): Promise<GeneratedProject> {
    for (const featureId of project.features) {
      const feature = featureRegistry[featureId];

      for (const file of feature.files) {
        await project.copyFile(file.source, file.destination, file.transform);
      }
    }

    return project;
  }

  private async generatePrismaSchema(project: GeneratedProject): Promise<GeneratedProject> {
    let schema = BASE_PRISMA_SCHEMA;

    for (const featureId of project.features) {
      const feature = featureRegistry[featureId];

      for (const schemaMapping of feature.schemas || []) {
        const modelSchema = await fs.readFile(schemaMapping.source, 'utf-8');
        schema += '\n' + modelSchema;
      }
    }

    await project.writeFile('prisma/schema.prisma', schema);
    return project;
  }

  // ... more methods
}
```

---

## Development Phases

### Phase Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                      DEVELOPMENT ROADMAP                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  PHASE 1: MVP                                         ~4 weeks       │
│  ────────────────────────────────────────────────────────────────   │
│  • Component Showcase                                                │
│  • Feature Registry                                                  │
│  • Basic Configurator                                                │
│  • Pricing Engine                                                    │
│  • Simple Preview                                                    │
│                                                                      │
│  PHASE 2: PILOT RELEASE                               ~3 weeks       │
│  ────────────────────────────────────────────────────────────────   │
│  • Stripe Integration                                                │
│  • Code Generator                                                    │
│  • Download System                                                   │
│  • Company Admin (Basic)                                             │
│  • First Template (LMS)                                              │
│                                                                      │
│  PHASE 3: INITIAL RELEASE                             ~3 weeks       │
│  ────────────────────────────────────────────────────────────────   │
│  • Full Preview Engine                                               │
│  • All Core Features                                                 │
│  • 3+ Templates                                                      │
│  • Company Admin (Full)                                              │
│  • Documentation                                                     │
│                                                                      │
│  PHASE 4: GROWTH                                      ~4 weeks       │
│  ────────────────────────────────────────────────────────────────   │
│  • More Templates                                                    │
│  • Mobile App Generation                                             │
│  • Advanced Analytics                                                │
│  • A/B Testing                                                       │
│  • Marketing Site                                                    │
│                                                                      │
│  PHASE 5: SCALE                                       Ongoing        │
│  ────────────────────────────────────────────────────────────────   │
│  • Custom Template Builder                                           │
│  • Marketplace (User Templates)                                      │
│  • API Access                                                        │
│  • White-label Options                                               │
│  • Enterprise Features                                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Phase Checklists

### Phase 1: MVP (~4 weeks)

#### Week 1: Foundation & Showcase

- [ ] **Project Setup**
  - [ ] Create `/studio` directory structure
  - [ ] Set up Next.js for studio web
  - [ ] Set up Express for studio backend
  - [ ] Configure shared Prisma schema
  - [ ] Set up path aliases for core imports

- [ ] **Component Showcase**
  - [ ] Create showcase page layout
  - [ ] Build component gallery grid
  - [ ] Add component preview cards
  - [ ] Create component detail pages
  - [ ] Add live component demos
  - [ ] Add code snippets for each component
  - [ ] Create component search/filter
  - [ ] Add component categories navigation

#### Week 2: Feature Registry & Pricing

- [ ] **Feature Registry**
  - [ ] Define feature data structure
  - [ ] Create all feature definitions
  - [ ] Map features to files
  - [ ] Define feature dependencies
  - [ ] Create tier definitions
  - [ ] Add feature validation

- [ ] **Pricing Engine**
  - [ ] Create pricing calculator
  - [ ] Implement tier logic
  - [ ] Add bundle discounts
  - [ ] Create upgrade recommendations
  - [ ] Build pricing display components

#### Week 3: Configurator UI

- [ ] **Configurator Page**
  - [ ] Create feature selection UI
  - [ ] Build category accordions
  - [ ] Add feature toggle switches
  - [ ] Show feature dependencies
  - [ ] Display running total
  - [ ] Create cart/summary sidebar
  - [ ] Add tier comparison view
  - [ ] Build template quick-select

- [ ] **User Flow**
  - [ ] Landing page with value prop
  - [ ] Browse → Configure → Preview flow
  - [ ] Save configuration (local storage)
  - [ ] Share configuration (URL params)

#### Week 4: Basic Preview

- [ ] **Preview Engine (Basic)**
  - [ ] Create feature flag system
  - [ ] Build preview iframe container
  - [ ] Implement responsive viewports
  - [ ] Add device frame mockups
  - [ ] Create preview navigation
  - [ ] Show/hide features based on selection

- [ ] **Preview App**
  - [ ] Set up preview routes
  - [ ] Create conditional rendering
  - [ ] Add demo data for previews
  - [ ] Implement feature-gated components

---

### Phase 2: Pilot Release (~3 weeks)

#### Week 5: Payment & Checkout

- [ ] **Stripe Integration**
  - [ ] Set up Stripe account
  - [ ] Create product/price objects
  - [ ] Implement checkout session
  - [ ] Handle webhooks
  - [ ] Create success/cancel pages
  - [ ] Implement receipt emails

- [ ] **Order System**
  - [ ] Create order data model
  - [ ] Save order details
  - [ ] Generate order confirmation
  - [ ] Create order lookup

#### Week 6: Code Generation

- [ ] **Generator Engine**
  - [ ] Create base project template
  - [ ] Implement file copying
  - [ ] Add file transformations
  - [ ] Generate Prisma schema
  - [ ] Generate package.json
  - [ ] Generate .env.example
  - [ ] Generate README
  - [ ] Clean unused code
  - [ ] Create zip bundle

- [ ] **Download System**
  - [ ] Generate download tokens
  - [ ] Create download API
  - [ ] Implement download expiry
  - [ ] Add re-download capability
  - [ ] Send download email

#### Week 7: Admin & Template

- [ ] **Company Admin (Basic)**
  - [ ] Create admin layout
  - [ ] Build dashboard overview
  - [ ] Add orders list
  - [ ] Create order detail view
  - [ ] Basic revenue chart
  - [ ] User list

- [ ] **First Template: LMS**
  - [ ] Define LMS feature set
  - [ ] Create LMS-specific modules
  - [ ] Build course management
  - [ ] Add lesson builder
  - [ ] Create student dashboard
  - [ ] Test full generation

---

### Phase 3: Initial Release (~3 weeks)

#### Week 8: Full Preview Engine

- [ ] **Advanced Preview**
  - [ ] Full app preview (not just pages)
  - [ ] Working forms (demo submissions)
  - [ ] Working navigation
  - [ ] Authentication simulation
  - [ ] Admin panel preview
  - [ ] Data persistence (session)

- [ ] **Preview Features**
  - [ ] Theme customization preview
  - [ ] Color scheme selector
  - [ ] Logo upload preview
  - [ ] Mobile preview mode
  - [ ] Share preview link

#### Week 9: All Core Features

- [ ] **Complete Feature Registry**
  - [ ] All auth features
  - [ ] All security features
  - [ ] All payment features
  - [ ] All storage features
  - [ ] All communication features
  - [ ] All UI features
  - [ ] All analytics features

- [ ] **Feature Testing**
  - [ ] Test each feature generation
  - [ ] Test feature combinations
  - [ ] Test dependency resolution
  - [ ] Test conflict detection
  - [ ] Fix edge cases

#### Week 10: Templates & Admin

- [ ] **Additional Templates**
  - [ ] Booking template
  - [ ] Invoice template
  - [ ] Events template

- [ ] **Company Admin (Full)**
  - [ ] Template management
  - [ ] Feature analytics
  - [ ] Coupon system
  - [ ] Revenue reports
  - [ ] User management
  - [ ] System settings

- [ ] **Documentation**
  - [ ] User documentation
  - [ ] Generated project docs
  - [ ] API documentation
  - [ ] Video tutorials

---

### Phase 4: Growth (~4 weeks)

#### Week 11-12: More Templates & Mobile

- [ ] **Templates**
  - [ ] Task Management template
  - [ ] Helpdesk template
  - [ ] CRM template

- [ ] **Mobile Generation**
  - [ ] Flutter project generation
  - [ ] Mobile feature mapping
  - [ ] Mobile preview
  - [ ] Combined web+mobile download

#### Week 13-14: Analytics & Marketing

- [ ] **Advanced Analytics**
  - [ ] Funnel analytics
  - [ ] Feature popularity
  - [ ] Conversion tracking
  - [ ] A/B testing framework

- [ ] **Marketing Site**
  - [ ] Landing page redesign
  - [ ] Customer testimonials
  - [ ] Case studies
  - [ ] Blog setup
  - [ ] SEO optimization

---

### Phase 5: Scale (Ongoing)

- [ ] **Custom Template Builder**
  - [ ] Visual template creator
  - [ ] Drag-and-drop features
  - [ ] Save custom templates

- [ ] **Marketplace**
  - [ ] User-submitted templates
  - [ ] Review system
  - [ ] Revenue sharing

- [ ] **API Access**
  - [ ] Public API
  - [ ] Programmatic generation
  - [ ] CI/CD integration

- [ ] **Enterprise**
  - [ ] White-label option
  - [ ] Volume licensing
  - [ ] Custom development
  - [ ] Priority support

---

## Success Metrics

### MVP Success Criteria

| Metric | Target |
|--------|--------|
| Showcase load time | < 2 seconds |
| Configuration to preview | < 30 seconds |
| Preview load time | < 3 seconds |
| Feature combinations tested | > 50 |
| Zero critical bugs | ✓ |

### Pilot Release Success Criteria

| Metric | Target |
|--------|--------|
| Successful purchases | > 10 |
| Generated projects working | 100% |
| Payment success rate | > 95% |
| Customer satisfaction | > 4/5 |
| Support tickets | < 5% of orders |

### Initial Release Success Criteria

| Metric | Target |
|--------|--------|
| Monthly revenue | > $5,000 |
| Conversion rate | > 3% |
| Customer retention | > 20% |
| Template downloads | > 100/month |
| Preview to purchase | > 5% |

---

## Appendix

### A. Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, Tailwind CSS |
| Backend | Express, TypeScript, Prisma |
| Database | PostgreSQL |
| Payments | Stripe |
| Email | Resend |
| Storage | Cloudflare R2 / AWS S3 |
| Hosting | Vercel (web), Railway (API) |
| Mobile | Flutter, Dart, Riverpod |

### B. Environment Variables

```env
# Studio Backend
DATABASE_URL=
JWT_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
S3_BUCKET=
S3_ACCESS_KEY=
S3_SECRET_KEY=

# Studio Frontend
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

### C. Database Schema (Studio)

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  orders        Order[]
  createdAt     DateTime  @default(now())
}

model Order {
  id            String    @id @default(cuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  features      String[]
  templateId    String?
  tier          String
  amount        Int       // cents
  currency      String    @default("usd")
  status        String    @default("pending")
  stripeId      String?
  downloadToken String?
  downloadCount Int       @default(0)
  expiresAt     DateTime?
  createdAt     DateTime  @default(now())
}

model Template {
  id            String    @id @default(cuid())
  slug          String    @unique
  name          String
  description   String
  price         Int
  features      String[]
  isActive      Boolean   @default(true)
  previewUrl    String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Coupon {
  id            String    @id @default(cuid())
  code          String    @unique
  type          String    // percentage | fixed
  value         Int
  maxUses       Int?
  usedCount     Int       @default(0)
  expiresAt     DateTime?
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
}

model Analytics {
  id            String    @id @default(cuid())
  event         String
  data          Json?
  sessionId     String?
  userId        String?
  createdAt     DateTime  @default(now())
}
```

---

*Document Version: 1.0.0*
*Last Updated: 2026-02-08*
*Status: Ready for Implementation*
