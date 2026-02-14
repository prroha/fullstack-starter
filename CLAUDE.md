# CLAUDE.md - Fullstack Starter Template

> **Last Updated**: 2026-02-14
> **Codebase Version**: 1.3.0
> **Maintainer**: AI-assisted documentation (auto-update on changes)

AI-optimized documentation for quick codebase navigation and understanding.

---

## MANDATORY RULES (Read First)

These are hard constraints. Violations are bugs.

### Rule 1: NEVER Write Raw HTML When a Core Component Exists

**BEFORE writing ANY UI element**, check the Component Registry in [`core/web/CLAUDE.md`](./core/web/CLAUDE.md). If a core component exists, you MUST use it. NEVER write:

- `<button>` — use `Button` from `@/components/ui/button`
- `<input>` — use `Input` from `@/components/ui/input`
- `<textarea>` — use `Textarea` from `@/components/ui/textarea`
- `<select>` — use `Select` from `@/components/ui/select`
- `<label>` — use `Label` from `@/components/ui/label`
- `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>` — use `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` from `@/components/ui/table`
- Custom star ratings (SVGs, Array.from loops) — use `Rating` from `@/components/ui/rating`
- Custom loading spinners — use `Spinner` from `@/components/ui/spinner` or `LoadingWrapper` from `@/components/feedback/loading-wrapper`
- Custom status badges — use `Badge` from `@/components/ui/badge` or `StatusBadge` from `@/components/ui/status-badge`
- Custom stat cards — use `StatCard` from `@/components/ui/stat-card`
- Custom pagination — use `Pagination` from `@/components/ui/pagination`
- Custom search with debounce — use `SearchInput` from `@/components/ui/search-input`
- Custom confirm dialogs — use `ConfirmButton` from `@/components/ui/confirm-button` or `Dialog` from `@/components/ui/dialog`
- Custom empty states — use `EmptyState` from `@/components/shared/empty-state`
- Custom error/success banners — use `Alert` from `@/components/feedback/alert` or `InlineFeedback` from `@/components/feedback/inline-feedback`
- Custom progress bars — use `Progress` from `@/components/ui/progress`
- Custom tooltips — use `Tooltip` from `@/components/ui/tooltip`
- Custom tabs — use `Tabs`, `TabList`, `Tab`, `TabPanels`, `TabPanel` from `@/components/ui/tabs`
- Custom breadcrumbs — use `Breadcrumb` from `@/components/ui/breadcrumb`
- Custom accordion — use `Accordion` from `@/components/ui/accordion`
- Custom modal/dialog — use `Modal` from `@/components/ui/modal` or `Dialog` from `@/components/ui/dialog`
- Custom dropdown menus — use `DropdownMenu` from `@/components/ui/dropdown-menu`

**The ONLY exceptions** where raw HTML is acceptable:

- `<label>` wrapping a checkbox tile (custom interactive layout)
- `<input type="checkbox">` inside a styled tile selector
- Highly custom SVG illustrations or animations

### Rule 2: Core-First Development Workflow

When building ANY new module or feature, follow this order:

1. **Read core components first** — `ls core/web/src/components/ui/` and check this registry
2. **Import from core** — use `@/components/ui/*`, `@/components/feedback/*`, `@/components/layout/*`, `@/components/forms/*`, `@/components/shared/*`
3. **Build domain-specific components** that COMPOSE core components — never rebuild what exists
4. **If something new is generic** (useful across modules), add it to `core/web/src/components/` — not inside the module

### Rule 3: Module Code Must Be Domain-Specific Only

Module code (e.g., `modules/ecommerce/`, `modules/lms/`) must ONLY contain:

- **Domain types** (`types.ts`) — interfaces specific to that domain
- **Domain API client** (`api.ts`) — API calls specific to that domain
- **Domain formatters** (`formatters.ts`) — formatting helpers specific to that domain
- **Domain components** — components that COMPOSE core UI for domain-specific layouts
- **Domain pages** — pages that import core UI + domain components
- **Domain backend** — routes + services for domain business logic

Module code must NEVER contain:

- Generic UI components (buttons, inputs, tables, badges, etc.)
- Generic utilities (debounce, cn, formatDate, etc.)
- Auth middleware (use the shared pattern from `modules/*/backend/src/middleware/auth.ts`)

### Rule 4: Design System Consistency

- Use CSS variables (`text-foreground`, `bg-background`, `border-border`, `text-muted-foreground`, etc.) — NOT hardcoded colors like `text-gray-900`, `bg-white`, `border-gray-200`
- Use `cn()` from `@/lib/utils` for conditional class merging
- Follow spacing conventions: `space-y-4`, `gap-4`, not manual margins
- Use `isLoading` prop on `Button` — never build custom loading states with disabled + spinner

### Rule 5: Quality Standards

- **No unused imports or variables** — clean up after refactoring
- **No `any` types** — use proper TypeScript types
- **No `_variable` hacks** — if a prop is unused, remove it from the interface
- **Prices in cents** — `formatPrice` divides by 100, all price fields are integers
- **Consistent error handling** — `try/catch` with `err instanceof Error ? err.message : 'fallback'`
- **Loading/error/empty states** — every data-fetching page needs all three

### Rule 6: Promote Generic Code to Core

When writing or fixing code, if you create something **not tied to a specific domain**, it belongs in core — not inside the module.

**Promote to core when the code:**

- Could be used by 2+ modules
- Has no domain-specific imports (no `@/lib/lms/*`, `@/lib/ecommerce/*`, etc.)
- Solves a general UI, data, or backend pattern

**Where to put it:**

| What                   | Location                                | Then                                                                          |
| ---------------------- | --------------------------------------- | ----------------------------------------------------------------------------- |
| UI component (generic) | `core/web/src/components/ui/<name>.tsx` | Add to barrel export in `ui/index.ts`, update Component Registry in this file |
| Hook (generic)         | `core/web/src/lib/hooks/<name>.ts`      | Add to barrel export in `hooks/index.ts`, update Hooks Registry in this file  |
| Utility function       | `core/web/src/lib/<name>.ts`            | Update Utilities Registry in this file                                        |
| Backend middleware     | `core/backend/src/middleware/<name>.ts` | Update Middleware Registry in this file                                       |
| Backend utility        | `core/backend/src/utils/<name>.ts`      | Update Utilities Registry in this file                                        |

**Examples of what to promote:**

- A `formatCurrency(amount, currency)` function → `core/web/src/lib/utils.ts`
- A `usePagination()` hook → `core/web/src/lib/hooks/`
- A `PriceDisplay` component → `core/web/src/components/ui/`
- A `validatePagination()` middleware → `core/backend/src/middleware/`

**Examples of what stays in module:**

- `formatOrderStatus()` that maps `EcommerceOrderStatus` enum → stays in `modules/ecommerce/`
- `CourseProgressBar` that uses LMS enrollment data → stays in `modules/lms/`

**IMPORTANT**: After promoting to core, update the relevant registry section in THIS file so future sessions know about it without scanning.

### Rule 7: Bug Fixes Follow the Same Rules

When fixing bugs, ALL rules above still apply:

- If the fix involves UI, use core components — don't introduce raw HTML even in a quick fix
- If the fix introduces utility code, check if it's generic → promote to core
- Fix root causes, not symptoms
- Don't refactor surrounding code unless directly related to the bug

---

## Registries (Detailed in Sub-Files)

Full component, backend, and frontend registries are in the sub-documentation files. **Always check these before writing code:**

- **Component Registry**: [`core/web/CLAUDE.md`](./core/web/CLAUDE.md) — Full list of UI atoms, molecules, organisms with props and usage examples
- **Backend Registry**: [`core/backend/CLAUDE.md`](./core/backend/CLAUDE.md) — Middleware, services, utilities, response helpers, error handling patterns
- **Frontend Hooks & Utilities**: [`core/web/CLAUDE.md`](./core/web/CLAUDE.md) — `useAuth`, `useDebounce`, `useAsync`, `useAdminList`, `cn()`, `api`, `toast`

**Key backend note:** Each module copies the lightweight auth middleware pattern (see `modules/lms/backend/src/middleware/auth.ts`). Do NOT import from core directly since modules are independently deployable.

---

## Quick Search Keywords

Use these to quickly find what you need:

- **Backend**: `core/backend/`, `Express`, `Prisma`, `auth.controller.ts`
- **Web**: `core/web/`, `Next.js`, `React`, `auth-context.tsx`
- **Mobile**: `mobile/`, `Flutter`, `Riverpod`, `api_client.dart`
- **Authentication**: `jwt.ts`, `auth.middleware.ts`, `auth-context.tsx`, `token_manager.dart`
- **Database**: `prisma/schema.prisma`, `db.ts`
- **API**: `routes/`, `controllers/`, `api.ts`
- **Config**: `config/index.ts`, `.env`
- **UI Components**: `components/ui/`, `skeleton.tsx`, `skeleton-composites.tsx`
- **Admin Components**: `components/admin/`, `AdminPageHeader`, `AdminFilters`
- **LMS Module**: `modules/lms/`, `course.routes.ts`, `enrollment.service.ts`, `lms.prisma`
- **E-Commerce Module**: `modules/ecommerce/`, `product.routes.ts`, `cart.service.ts`, `ecommerce.prisma`

---

## Recent Changes

<!-- Add new entries at the top -->

| Date       | Change                                                                                                                                                    | Files                                                                                                                    |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 2026-02-14 | Events module: Complete implementation — 43 files (backend routes/services, frontend pages/components, Prisma schema, mobile placeholders, seed data)     | `modules/events/`, `studio/backend/prisma/seed.ts`, `templates/events/config.json`                                       |
| 2026-02-14 | Tasks module: Complete implementation — 44 files (backend routes/services, frontend pages/components, Prisma schema, mobile placeholders, seed data)      | `modules/tasks/`, `studio/backend/prisma/seed.ts`, `templates/tasks/config.json`                                         |
| 2026-02-14 | Helpdesk module: Complete implementation — 47 files (backend routes/services, frontend pages/components, Prisma schema, mobile placeholders, seed data)   | `modules/helpdesk/`, `studio/backend/prisma/seed.ts`, `templates/helpdesk/config.json`                                   |
| 2026-02-14 | Invoicing module: Complete implementation — 46 files (backend routes/services, frontend pages/components, Prisma schema, mobile placeholders, seed data)  | `modules/invoicing/`, `studio/backend/prisma/seed.ts`, `templates/invoicing/config.json`                                 |
| 2026-02-13 | Booking module: Complete implementation — 46 files (backend routes/services, frontend pages/components, Prisma schema, mobile placeholders, seed data)    | `modules/booking/`, `studio/backend/prisma/seed.ts`, `templates/booking/config.json`                                     |
| 2026-02-13 | E-Commerce module: Complete implementation — 46 files (backend routes/services, frontend pages/components, Prisma schema, mobile placeholders, seed data) | `modules/ecommerce/`, `studio/backend/prisma/seed.ts`, `templates/ecommerce/config.json`                                 |
| 2026-02-12 | LMS module: DRY refactoring pass — shared formatters, auth middleware, core Rating reuse, prop bug fixes, extracted EnrollmentCard                        | `modules/lms/web/src/lib/lms/formatters.ts`, `modules/lms/backend/src/middleware/auth.ts`, multiple component/page fixes |
| 2026-02-12 | LMS module: Complete implementation — 42+ files (backend routes/services, frontend pages/components, Prisma schema, mobile placeholders, seed data)       | `modules/lms/`, `studio/backend/prisma/seed.ts`, `templates/lms/config.json`                                             |
| 2026-02-12 | Studio: Admin generation page, pricing management (bundles/history/recommendations), enhanced analytics (geo/PDF), PriceHistory model, enhanced seed data | `studio/backend/src/routes/admin/`, `studio/web/src/app/(admin)/admin/`, `studio/backend/prisma/`                        |
| 2026-02-11 | Studio code generator service, preview sessions, cleanup jobs                                                                                             | `studio/backend/src/services/generator.service.ts`, `studio/backend/src/jobs/`                                           |
| 2026-02-11 | Documentation updates: Studio web/backend CLAUDE.md files                                                                                                 | `studio/CLAUDE.md`, `studio/web/CLAUDE.md`, `studio/backend/CLAUDE.md`                                                   |
| 2026-02-10 | Studio MVP: Admin auth, API integration, toast notifications, validation, mobile responsive, a11y                                                         | `studio/backend/src/routes/`, `studio/web/src/app/(admin)/`, `studio/web/src/lib/`                                       |
| 2026-02-10 | Studio bug fixes: Route ordering, Stripe refunds, API path fixes                                                                                          | `studio/backend/src/routes/admin/`, `studio/backend/src/services/stripe.service.ts`                                      |
| 2026-02-09 | Documentation updates, ESLint configuration, skeleton composites                                                                                          | `CLAUDE.md`, `eslint.config.mjs`, `skeleton-composites.tsx`                                                              |
| 2026-02-08 | Admin platform expansion with FAQ, Announcements, Settings, Content, Coupons, Orders modules                                                              | `backend/src/routes/*.routes.ts`, `prisma/schema.prisma`, `web/src/app/(protected)/admin/*`                              |
| 2026-02-06 | Initial documentation                                                                                                                                     | CLAUDE.md                                                                                                                |

---

## Project Overview

This is a fullstack starter template with three main applications:

1. **Backend** - Express.js + Prisma + TypeScript API server
2. **Web** - Next.js 15 + React 19 + Tailwind CSS web application
3. **Mobile** - Flutter + Riverpod + Clean Architecture mobile app

All three applications share a common authentication flow using JWT tokens with httpOnly cookies (web) and secure storage (mobile).

---

## Tech Stack Summary

| Layer                 | Technology                         |
| --------------------- | ---------------------------------- |
| **Backend Runtime**   | Node.js 20+                        |
| **Backend Framework** | Express.js 4.x                     |
| **Database**          | PostgreSQL + Prisma ORM            |
| **Web Framework**     | Next.js 15 (App Router)            |
| **Web UI**            | React 19 + Tailwind CSS v4         |
| **Mobile Framework**  | Flutter 3.2+                       |
| **Mobile State**      | Riverpod (flutter_riverpod)        |
| **Authentication**    | JWT (access + refresh tokens)      |
| **Validation**        | Zod (backend), native (web/mobile) |

---

## Project Structure

```
fullstack-starter/
├── core/
│   ├── backend/               # Express + Prisma API server
│   │   ├── src/
│   │   │   ├── config/        # Environment configuration
│   │   │   ├── controllers/   # Route handlers
│   │   │   ├── lib/           # Core utilities (db, logger)
│   │   │   ├── middleware/    # Express middleware
│   │   │   ├── routes/        # Route definitions
│   │   │   ├── services/      # Business logic
│   │   │   ├── types/         # TypeScript types
│   │   │   ├── utils/         # Helper utilities
│   │   │   └── app.ts         # Express app entry
│   │   └── prisma/            # Database schema & migrations
│   │
│   └── web/                   # Next.js web application
│       └── src/
│           ├── app/           # App Router pages
│           │   ├── (auth)/    # Auth pages (login, register)
│           │   ├── (dashboard)/ # User dashboard
│           │   ├── (protected)/ # Protected pages (admin, profile)
│           │   ├── (public)/  # Public pages
│           │   └── settings/  # User settings
│           ├── components/    # React components
│           │   ├── ui/        # Core UI components (atomic design)
│           │   ├── admin/     # Admin-specific components
│           │   ├── feedback/  # Alerts, toasts, loading states
│           │   ├── forms/     # Form components
│           │   ├── layout/    # Page layout components
│           │   ├── shared/    # Cross-cutting components
│           │   └── providers/ # Context providers
│           └── lib/           # Utilities (api, auth-context)
│
├── mobile/                    # Flutter mobile app
│   └── lib/
│       ├── core/              # Shared utilities
│       ├── data/              # Data layer (models, datasources)
│       ├── domain/            # Domain layer (entities, repositories)
│       └── presentation/      # UI layer (screens, widgets, providers)
│
├── modules/                   # Optional feature modules
│   ├── admin-dashboard/
│   ├── analytics/
│   ├── file-upload/
│   ├── ecommerce/             # E-Commerce module
│   │   ├── backend/src/       # Routes (6), services (6), auth middleware
│   │   ├── web/src/           # Pages (12), components (13), lib (types/api/formatters)
│   │   ├── mobile/lib/        # Flutter placeholders (3)
│   │   ├── prisma/ecommerce.prisma # 10 models + 3 enums
│   │   └── module.json        # Module metadata
│   ├── helpdesk/              # Helpdesk & Support module
│   │   ├── backend/src/       # Routes (6), services (6), auth middleware
│   │   ├── web/src/           # Pages (12), components (13), lib (types/api/formatters/constants)
│   │   ├── mobile/lib/        # Flutter placeholders (3)
│   │   ├── prisma/helpdesk.prisma # 10 models + 4 enums
│   │   └── module.json        # Module metadata
│   ├── invoicing/             # Invoicing & Billing module
│   │   ├── backend/src/       # Routes (6), services (6), auth middleware
│   │   ├── web/src/           # Pages (12), components (13), lib (types/api/formatters)
│   │   ├── mobile/lib/        # Flutter placeholders (3)
│   │   ├── prisma/invoicing.prisma # 8 models + 4 enums
│   │   └── module.json        # Module metadata
│   ├── lms/                   # Learning Management System module
│   │   ├── backend/src/       # Routes (6), services (7), auth middleware
│   │   ├── web/src/           # Pages (10), components (13), lib (types/api/formatters)
│   │   ├── mobile/lib/        # Flutter placeholders (3)
│   │   ├── prisma/lms.prisma  # 12 models + 4 enums
│   │   └── module.json        # Module metadata
│   ├── tasks/                 # Tasks & Projects module
│   │   ├── backend/src/       # Routes (6), services (5), auth middleware
│   │   ├── web/src/           # Pages (11), components (11), lib (types/api/formatters/constants)
│   │   ├── mobile/lib/        # Flutter placeholders (3)
│   │   ├── prisma/tasks.prisma # 6 models + 3 enums
│   │   └── module.json        # Module metadata
│   ├── events/                # Events & Ticketing module
│   │   ├── backend/src/       # Routes (6), services (5), auth middleware
│   │   ├── web/src/           # Pages (11), components (11), lib (types/api/formatters/constants)
│   │   ├── mobile/lib/        # Flutter placeholders (3)
│   │   ├── prisma/events.prisma # 6 models + 3 enums
│   │   └── module.json        # Module metadata
│   ├── payments/
│   └── real-time/
│
├── studio/                    # Starter Studio - Configuration & Pricing Platform
│   ├── backend/               # Express API (port 3001)
│   ├── web/                   # Next.js frontend (port 3002)
│   ├── shared/                # Shared TypeScript types
│   └── CLAUDE.md              # Studio-specific documentation
│
└── CLAUDE.md                  # This file
```

---

## Quick Reference

### Backend (Express + Prisma)

| Item            | Location                                         |
| --------------- | ------------------------------------------------ |
| Entry point     | `core/backend/src/app.ts`                        |
| Config          | `core/backend/src/config/index.ts`               |
| Database schema | `core/backend/prisma/schema.prisma`              |
| Routes          | `core/backend/src/routes/`                       |
| Auth middleware | `core/backend/src/middleware/auth.middleware.ts` |

**Key Commands:**

```bash
cd core/backend
npm run dev              # Start dev server (port 8000)
npm run db:migrate:dev   # Create migration
npm run db:studio        # Open Prisma Studio
npm run build            # Production build
```

### Web (Next.js)

| Item             | Location                            |
| ---------------- | ----------------------------------- |
| Entry layout     | `core/web/src/app/layout.tsx`       |
| Homepage         | `core/web/src/app/page.tsx`         |
| Auth context     | `core/web/src/lib/auth-context.tsx` |
| API client       | `core/web/src/lib/api.ts`           |
| UI Components    | `core/web/src/components/ui/`       |
| Admin Components | `core/web/src/components/admin/`    |

**Key Commands:**

```bash
cd core/web
npm run dev     # Start dev server (port 3000)
npm run build   # Production build
npm run lint    # Run ESLint
```

### Mobile (Flutter)

| Item          | Location                                       |
| ------------- | ---------------------------------------------- |
| Entry point   | `mobile/lib/main.dart`                         |
| App widget    | `mobile/lib/app.dart`                          |
| API constants | `mobile/lib/core/constants/api_constants.dart` |
| API client    | `mobile/lib/core/network/api_client.dart`      |
| Theme         | `mobile/lib/core/theme/`                       |

**Key Commands:**

```bash
cd mobile
flutter run                    # Run on connected device
flutter build apk              # Build Android APK
flutter pub run build_runner build --delete-conflicting-outputs  # Generate code
```

### Studio (Configuration Platform)

| Item               | Location                                           |
| ------------------ | -------------------------------------------------- |
| Backend entry      | `studio/backend/src/index.ts`                      |
| Frontend entry     | `studio/web/src/app/layout.tsx`                    |
| Configurator       | `studio/web/src/components/configurator/`          |
| Admin dashboard    | `studio/web/src/app/(admin)/admin/`                |
| Feature resolver   | `studio/web/src/lib/features/dependencies.ts`      |
| Pricing calculator | `studio/web/src/lib/pricing/calculator.ts`         |
| Code generator     | `studio/backend/src/services/generator.service.ts` |
| Shared types       | `studio/shared/types/`                             |

**Key Commands:**

```bash
cd studio
npm run dev              # Start both backend (3001) and frontend (3002)

cd studio/backend
npm run dev              # Backend only
pnpm db:migrate          # Run database migrations
pnpm db:seed             # Seed features, tiers, templates

cd studio/web
npm run dev              # Frontend only
```

**Documentation:** See detailed Studio documentation:

- [`studio/CLAUDE.md`](./studio/CLAUDE.md) - Main Studio overview
- [`studio/web/CLAUDE.md`](./studio/web/CLAUDE.md) - Frontend documentation
- [`studio/backend/CLAUDE.md`](./studio/backend/CLAUDE.md) - Backend documentation

---

> **Auth flow, API endpoints, env vars, database schema, and Prisma models** are documented in [`core/backend/CLAUDE.md`](./core/backend/CLAUDE.md).

---

## Common Patterns

### Module Page Pattern (Correct Way)

Every module page should look like this — composing core components, never recreating them:

```tsx
// modules/<module>/web/src/app/<page>/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
// 1. Core UI components — ALWAYS import from core
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/ui/search-input";
import { Pagination } from "@/components/ui/pagination";
import { Rating } from "@/components/ui/rating";
import { StatCard } from "@/components/ui/stat-card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Alert } from "@/components/feedback/alert";

// 2. Domain-specific imports — from the module's own lib
import { moduleApi } from "@/lib/<module>/api";
import { formatPrice } from "@/lib/<module>/formatters";
import type { ModuleType } from "@/lib/<module>/types";

// 3. Domain components — composed from core UI
import ModuleDomainComponent from "@/components/<module>/domain-component";
```

> **Anti-patterns, backend endpoint patterns, common issues, spacing conventions, skeleton components, and admin components** are documented in the sub-files: [`core/web/CLAUDE.md`](./core/web/CLAUDE.md) and [`core/backend/CLAUDE.md`](./core/backend/CLAUDE.md).

---

## Template Implementation Roadmap

Each template needs: seed data (module + features), `config.json`, and a `modules/<name>/` directory with backend/frontend/mobile code. All templates reuse core components and generic features (`auth.*`, `payments.*`, `ui.*`, `analytics.*`, etc.) — only domain-specific code goes in each module.

### Template Status

| #   | Template            | Seed Data        | config.json    | Domain Features           | Module Code                           | Status             |
| --- | ------------------- | ---------------- | -------------- | ------------------------- | ------------------------------------- | ------------------ |
| 1   | **SaaS Starter**    | Yes              | Yes            | None (core-only)          | N/A                                   | **Done**           |
| 2   | **LMS**             | Yes (6 features) | Yes            | `lms.*` (6)               | `modules/lms/` (43 files)             | **Done**           |
| 3   | **Admin Dashboard** | Yes              | No (seed only) | None (`admin.*` generic)  | `modules/admin-dashboard/` (14 files) | **Done** (generic) |
| 4   | **Mobile App Kit**  | Yes              | No (seed only) | None (`mobile.*` generic) | N/A (core mobile)                     | **Done** (generic) |
| 5   | **E-commerce**      | Yes (6 features) | Yes            | `ecommerce.*` (6)         | `modules/ecommerce/` (46 files)       | **Done**           |
| 6   | **Booking**         | Yes (6 features) | Yes            | `booking.*` (6)           | `modules/booking/` (46 files)         | **Done**           |
| 7   | **Helpdesk**        | Yes (6 features) | Yes            | `helpdesk.*` (6)          | `modules/helpdesk/` (47 files)        | **Done**           |
| 8   | **Invoicing**       | Yes (6 features) | Yes            | `invoicing.*` (6)         | `modules/invoicing/` (46 files)       | **Done**           |
| 9   | **Events**          | Yes (6 features) | Yes            | `events.*` (6)            | `modules/events/` (43 files)          | **Done**           |
| 10  | **Tasks**           | Yes (6 features) | Yes            | `tasks.*` (6)             | `modules/tasks/` (44 files)           | **Done**           |

### Existing Generic Modules (shared across templates)

| Module               | Files | Provides Features | Used By                             |
| -------------------- | ----- | ----------------- | ----------------------------------- |
| `admin-dashboard`    | 14    | `admin.*`         | Admin Dashboard, SaaS Starter       |
| `analytics`          | 9     | `analytics.*`     | All templates                       |
| `file-upload`        | 9     | `storage.*`       | E-commerce, LMS, Booking            |
| `payments`           | 8     | `payments.*`      | E-commerce, LMS, Booking, Invoicing |
| `real-time`          | 8     | `comms.websocket` | Helpdesk, Events                    |
| `push-notifications` | 6     | `comms.push`      | Mobile App Kit, LMS                 |
| `audit-log`          | 6     | `security.audit`  | Admin Dashboard, SaaS Starter       |
| `email`              | 5     | `comms.email`     | All templates                       |
| `social-auth`        | 4     | `auth.social`     | SaaS Starter, E-commerce, LMS       |

### Per-Template Work Scope

Each remaining template needs:

1. **Seed data** — Module entry + domain features with `fileMappings`, `schemaMappings`, `envVars`, `npmPackages`
2. **`config.json`** — Template definition with `includedFeatures` (generic + domain)
3. **`module.json`** — Module metadata
4. **Prisma schema** — Domain models + enums
5. **Backend** — Routes + services (reuse shared auth middleware pattern from LMS)
6. **Frontend lib** — `types.ts`, `api.ts`, `formatters.ts` (domain-specific only)
7. **Frontend components** — Domain components that COMPOSE core UI (see Component Registry above)
8. **Frontend pages** — Import core UI + domain components. NEVER write raw `<button>`, `<input>`, `<table>`, etc.
9. **Mobile** — Flutter placeholders
10. **Verification checklist**:
    - `grep -r '<button' modules/<name>/web/` returns 0 results (except checkbox tiles)
    - `grep -r '<input' modules/<name>/web/` returns 0 results (except checkbox tiles)
    - `grep -r '<table\|<thead\|<tbody' modules/<name>/web/` returns 0 results
    - `grep -r '<select' modules/<name>/web/` returns 0 results
    - All imports come from `@/components/ui/*`, `@/components/feedback/*`, `@/components/layout/*`, `@/components/forms/*`, or `@/components/shared/*`
    - No hardcoded colors (no `text-gray-900`, `bg-white` — use `text-foreground`, `bg-card`)

---

## Detailed Documentation

For detailed documentation of each application, see:

- **Backend**: [`core/backend/CLAUDE.md`](./core/backend/CLAUDE.md)
- **Web**: [`core/web/CLAUDE.md`](./core/web/CLAUDE.md)
- **Mobile**: [`mobile/CLAUDE.md`](./mobile/CLAUDE.md)

---

_This documentation is designed to be self-growing. Update the "Recent Changes" section when making significant changes to the codebase._
