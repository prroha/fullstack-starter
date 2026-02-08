# Starter Studio - Phase Checklists

> Quick reference checklist for tracking development progress.

---

## Phase 1: MVP (~4 weeks)

### Week 1: Foundation & Showcase

#### Project Setup
- [ ] Create `/studio` directory structure
- [ ] Set up Next.js for studio web
- [ ] Set up Express for studio backend
- [ ] Configure Prisma schema for studio
- [ ] Set up path aliases (`@core/`, `@studio/`)
- [ ] Configure shared TypeScript config
- [ ] Set up development scripts

#### Component Showcase
- [ ] Create `/showcase` route
- [ ] Build showcase page layout (sidebar + main)
- [ ] Create component category navigation
  - [ ] Atoms
  - [ ] Molecules
  - [ ] Organisms
  - [ ] Layouts
- [ ] Build component gallery grid
- [ ] Create component preview cards
  - [ ] Component name
  - [ ] Preview thumbnail
  - [ ] Category badge
  - [ ] Tier indicator (Free/Paid)
- [ ] Create component detail page
  - [ ] Live demo
  - [ ] Props documentation
  - [ ] Code examples
  - [ ] Variants showcase
- [ ] Add component search
- [ ] Add category filters
- [ ] Add "Copy code" functionality

---

### Week 2: Feature Registry & Pricing

#### Feature Registry
- [ ] Create `lib/features/types.ts`
  - [ ] Feature interface
  - [ ] Category types
  - [ ] Tier types
  - [ ] FileMapping interface
  - [ ] Dependency types
- [ ] Create `lib/features/registry.ts`
  - [ ] Core features (setup, crud, database)
  - [ ] Auth features (basic, social, mfa)
  - [ ] Security features (csrf, rate-limit, audit)
  - [ ] Payment features (one-time, subscription)
  - [ ] Storage features (upload, images, pdf)
  - [ ] Communication features (email, push, realtime)
  - [ ] UI features (components, dashboard, admin)
  - [ ] Analytics features (charts, export, reports)
  - [ ] Mobile features (flutter, offline)
- [ ] Create `lib/features/dependencies.ts`
  - [ ] Dependency resolver
  - [ ] Conflict detector
  - [ ] Tier validator
- [ ] Create `lib/features/validation.ts`
  - [ ] Validate feature selection
  - [ ] Check required dependencies
  - [ ] Check tier requirements

#### Pricing Engine
- [ ] Create `lib/pricing/types.ts`
  - [ ] Tier definitions
  - [ ] PricingResult interface
  - [ ] Discount types
- [ ] Create `lib/pricing/calculator.ts`
  - [ ] Calculate total from features
  - [ ] Apply tier pricing
  - [ ] Apply bundle discounts
  - [ ] Calculate savings vs individual
- [ ] Create `lib/pricing/tiers.ts`
  - [ ] Basic tier ($0)
  - [ ] Starter tier ($49)
  - [ ] Pro tier ($149)
  - [ ] Business tier ($299)
  - [ ] Enterprise tier ($499)
- [ ] Create `lib/pricing/bundles.ts`
  - [ ] Bundle definitions
  - [ ] Bundle discount logic
- [ ] Create upgrade recommendation logic

---

### Week 3: Configurator UI

#### Configurator Page
- [ ] Create `/pricing` route (or `/configure`)
- [ ] Build page layout (3-column: nav, features, summary)
- [ ] Create category accordion component
- [ ] Create feature toggle component
  - [ ] Feature name & description
  - [ ] Price display
  - [ ] Toggle switch
  - [ ] Tier badge
  - [ ] Dependency indicator
- [ ] Create tier selector component
  - [ ] Tier cards with features
  - [ ] Comparison table
  - [ ] "Most Popular" badge
- [ ] Create cart/summary sidebar
  - [ ] Selected features list
  - [ ] Running total
  - [ ] Savings display
  - [ ] Upgrade suggestions
  - [ ] CTA buttons (Preview, Checkout)
- [ ] Implement feature dependency UI
  - [ ] Auto-select dependencies
  - [ ] Show "requires X" message
  - [ ] Disable conflicting features
- [ ] Create template quick-select
  - [ ] Template cards
  - [ ] "Apply template" button
  - [ ] Show included features

#### User Flow
- [ ] Create landing page
  - [ ] Hero section
  - [ ] Value proposition
  - [ ] Feature highlights
  - [ ] Template previews
  - [ ] Pricing teaser
  - [ ] CTA to configurator
- [ ] Implement configuration persistence
  - [ ] Save to localStorage
  - [ ] Generate shareable URL
  - [ ] Load from URL params
- [ ] Add navigation flow
  - [ ] Browse → Configure → Preview → Checkout
  - [ ] Progress indicator

---

### Week 4: Basic Preview

#### Preview Engine (Basic)
- [ ] Create `lib/preview/types.ts`
  - [ ] PreviewConfig interface
  - [ ] FeatureFlags type
- [ ] Create `lib/preview/engine.ts`
  - [ ] Feature flag generator
  - [ ] Preview URL builder
  - [ ] Feature combination validator
- [ ] Create FeatureFlagProvider context
- [ ] Create useFeatureFlag hook
- [ ] Create FeatureGate component

#### Preview UI
- [ ] Create `/preview` route
- [ ] Build preview container
  - [ ] Iframe for preview app
  - [ ] Device frame selector (Desktop/Tablet/Mobile)
  - [ ] Viewport dimensions display
- [ ] Create preview toolbar
  - [ ] Device toggles
  - [ ] Theme toggle (light/dark)
  - [ ] Feature summary
  - [ ] "Back to Configure" button
  - [ ] "Checkout" button
- [ ] Create preview navigation
  - [ ] Route selector
  - [ ] Page navigation

#### Preview App
- [ ] Create preview app routes
- [ ] Implement conditional rendering
  - [ ] Show/hide auth pages
  - [ ] Show/hide admin panel
  - [ ] Show/hide dashboard
  - [ ] Show/hide payments UI
- [ ] Add demo data service
  - [ ] Mock users
  - [ ] Mock content
  - [ ] Mock analytics
- [ ] Create feature-gated layouts

---

## Phase 2: Pilot Release (~3 weeks)

### Week 5: Payment & Checkout

#### Stripe Integration
- [ ] Set up Stripe account
- [ ] Create Stripe products for tiers
- [ ] Create Stripe prices
- [ ] Implement checkout session API
- [ ] Create checkout page
- [ ] Handle Stripe webhooks
  - [ ] checkout.session.completed
  - [ ] payment_intent.succeeded
  - [ ] payment_intent.failed
- [ ] Create success page
- [ ] Create cancel page
- [ ] Send receipt email

#### Order System
- [ ] Create Order model (Prisma)
- [ ] Create order creation API
- [ ] Create order lookup API
- [ ] Generate order confirmation
- [ ] Create order detail page
- [ ] Store feature selections

---

### Week 6: Code Generation

#### Generator Engine
- [ ] Create `lib/generator/types.ts`
- [ ] Create `lib/generator/index.ts`
  - [ ] Main generator class
  - [ ] Step orchestration
- [ ] Create `lib/generator/steps/`
  - [ ] `createStructure.ts` - Project structure
  - [ ] `copyBase.ts` - Base files
  - [ ] `copyFeatures.ts` - Feature files
  - [ ] `generateSchema.ts` - Prisma schema
  - [ ] `generatePackage.ts` - package.json
  - [ ] `generateEnv.ts` - .env.example
  - [ ] `generateReadme.ts` - README.md
  - [ ] `cleanup.ts` - Remove unused
  - [ ] `bundle.ts` - Create zip
- [ ] Create file transformation utilities
- [ ] Create schema composition logic
- [ ] Test generation with all feature combos

#### Download System
- [ ] Create download token generation
- [ ] Create `/api/download` endpoint
- [ ] Implement download expiry (7 days)
- [ ] Create re-download API
- [ ] Send download link email
- [ ] Track download count
- [ ] Create download page UI

---

### Week 7: Admin & First Template

#### Company Admin (Basic)
- [ ] Create `/admin` route group
- [ ] Create admin layout
- [ ] Create admin navigation
- [ ] Build dashboard page
  - [ ] Revenue stats
  - [ ] Order count
  - [ ] Preview count
  - [ ] User count
  - [ ] Revenue chart
  - [ ] Recent orders
- [ ] Create orders page
  - [ ] Orders table
  - [ ] Filters (date, status, tier)
  - [ ] Order detail modal
- [ ] Create basic user list

#### LMS Template
- [ ] Define LMS feature configuration
- [ ] Create LMS-specific modules
  - [ ] Course management
  - [ ] Lesson management
  - [ ] Student enrollment
  - [ ] Progress tracking
  - [ ] Quiz system
  - [ ] Certificate generation
- [ ] Create LMS-specific routes
- [ ] Create LMS-specific components
- [ ] Add LMS to template registry
- [ ] Test LMS generation end-to-end

---

## Phase 3: Initial Release (~3 weeks)

### Week 8: Full Preview Engine

#### Advanced Preview
- [ ] Implement full app preview (not just pages)
- [ ] Create auth simulation
  - [ ] Demo login
  - [ ] Demo session
  - [ ] Demo logout
- [ ] Create working forms
  - [ ] Form submissions (demo)
  - [ ] Success feedback
- [ ] Create working navigation
- [ ] Implement data persistence (session)
- [ ] Admin panel preview
- [ ] Analytics preview (demo data)

#### Preview Features
- [ ] Theme customization preview
- [ ] Color scheme selector
- [ ] Logo upload preview
- [ ] Mobile preview mode
- [ ] Generate shareable preview link

---

### Week 9: All Core Features

#### Complete Feature Registry
- [ ] Verify all auth features work
- [ ] Verify all security features work
- [ ] Verify all payment features work
- [ ] Verify all storage features work
- [ ] Verify all communication features work
- [ ] Verify all UI features work
- [ ] Verify all analytics features work
- [ ] Verify mobile features work

#### Testing
- [ ] Test every feature individually
- [ ] Test common feature combinations
- [ ] Test edge cases
  - [ ] Maximum features
  - [ ] Minimum features
  - [ ] Conflicting features
  - [ ] Missing dependencies
- [ ] Fix all identified bugs
- [ ] Performance testing

---

### Week 10: Templates & Admin

#### Additional Templates
- [ ] Booking Template
  - [ ] Service management
  - [ ] Availability calendar
  - [ ] Booking flow
  - [ ] Customer management
- [ ] Invoice Template
  - [ ] Client management
  - [ ] Invoice creation
  - [ ] Payment tracking
  - [ ] Report generation
- [ ] Events Template
  - [ ] Event creation
  - [ ] Ticket types
  - [ ] Registration
  - [ ] Check-in (QR)

#### Company Admin (Full)
- [ ] Template management page
  - [ ] Create/edit templates
  - [ ] Enable/disable templates
  - [ ] Template analytics
- [ ] Feature analytics
  - [ ] Most selected features
  - [ ] Feature combinations
  - [ ] Tier distribution
- [ ] Coupon management
  - [ ] Create coupons
  - [ ] Usage tracking
  - [ ] Expiration
- [ ] Revenue reports
  - [ ] Daily/weekly/monthly
  - [ ] By tier
  - [ ] By template
  - [ ] Export to CSV
- [ ] User management
  - [ ] User list
  - [ ] User orders
  - [ ] Account status

#### Documentation
- [ ] User documentation
  - [ ] Getting started
  - [ ] Feature guide
  - [ ] FAQ
- [ ] Generated project docs
  - [ ] Setup instructions
  - [ ] Environment variables
  - [ ] Deployment guide
- [ ] API documentation
- [ ] Video tutorials (optional)

---

## Phase 4: Growth (~4 weeks)

### Week 11-12: Templates & Mobile

#### More Templates
- [ ] Task Management Template
- [ ] Helpdesk Template
- [ ] CRM Template

#### Mobile Generation
- [ ] Flutter project structure
- [ ] Mobile feature mapping
- [ ] Mobile file generation
- [ ] Mobile preview
- [ ] Combined web+mobile download

---

### Week 13-14: Analytics & Marketing

#### Advanced Analytics
- [ ] Funnel analytics (view → configure → preview → purchase)
- [ ] Feature popularity tracking
- [ ] Conversion rate tracking
- [ ] A/B testing framework

#### Marketing
- [ ] Landing page redesign
- [ ] Customer testimonials
- [ ] Case studies
- [ ] Blog setup
- [ ] SEO optimization
- [ ] Social media presence

---

## Phase 5: Scale (Ongoing)

- [ ] Custom Template Builder (visual)
- [ ] User Marketplace
- [ ] Public API
- [ ] White-label Options
- [ ] Enterprise Features

---

## Quick Status

| Phase | Status | Progress | Target Date |
|-------|--------|----------|-------------|
| Phase 1: MVP | ⬜ Not Started | 0% | TBD |
| Phase 2: Pilot | ⬜ Not Started | 0% | TBD |
| Phase 3: Release | ⬜ Not Started | 0% | TBD |
| Phase 4: Growth | ⬜ Not Started | 0% | TBD |
| Phase 5: Scale | ⬜ Not Started | 0% | TBD |

### Status Legend
- ⬜ Not Started
- 🟡 In Progress
- ✅ Completed
- ⏸️ Blocked

---

*Last Updated: 2026-02-08*
