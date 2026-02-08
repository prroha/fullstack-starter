# CLAUDE.md - Fullstack Starter Template

> **Last Updated**: 2026-02-08
> **Codebase Version**: 1.0.0
> **Maintainer**: AI-assisted documentation (auto-update on changes)

AI-optimized documentation for quick codebase navigation and understanding.

---

## Quick Search Keywords

Use these to quickly find what you need:
- **Backend**: `backend/`, `Express`, `Prisma`, `auth.controller.ts`
- **Web**: `web/`, `Next.js`, `React`, `auth-context.tsx`
- **Mobile**: `mobile/`, `Flutter`, `Riverpod`, `api_client.dart`
- **Authentication**: `jwt.ts`, `auth.middleware.ts`, `auth-context.tsx`, `token_manager.dart`
- **Database**: `prisma/schema.prisma`, `db.ts`
- **API**: `routes/`, `controllers/`, `api.ts`
- **Config**: `config/index.ts`, `.env`

---

## Recent Changes

<!-- Add new entries at the top -->
| Date | Change | Files |
|------|--------|-------|
| 2026-02-08 | Admin platform expansion with FAQ, Announcements, Settings, Content, Coupons, Orders modules | `backend/src/routes/*.routes.ts`, `prisma/schema.prisma`, `web/src/app/(protected)/admin/*` |
| 2026-02-06 | Initial documentation | CLAUDE.md |

---

## Project Overview

This is a fullstack starter template with three main applications:

1. **Backend** - Express.js + Prisma + TypeScript API server
2. **Web** - Next.js 15 + React 19 + Tailwind CSS web application
3. **Mobile** - Flutter + Riverpod + Clean Architecture mobile app

All three applications share a common authentication flow using JWT tokens with httpOnly cookies (web) and secure storage (mobile).

---

## Tech Stack Summary

| Layer | Technology |
|-------|------------|
| **Backend Runtime** | Node.js 20+ |
| **Backend Framework** | Express.js 4.x |
| **Database** | PostgreSQL + Prisma ORM |
| **Web Framework** | Next.js 15 (App Router) |
| **Web UI** | React 19 + Tailwind CSS v4 |
| **Mobile Framework** | Flutter 3.2+ |
| **Mobile State** | Riverpod (flutter_riverpod) |
| **Authentication** | JWT (access + refresh tokens) |
| **Validation** | Zod (backend), native (web/mobile) |

---

## Project Structure

```
fullstack-starter/
├── backend/               # Express + Prisma API server
│   ├── src/
│   │   ├── config/        # Environment configuration
│   │   ├── controllers/   # Route handlers
│   │   ├── lib/           # Core utilities (db, logger)
│   │   ├── middleware/    # Express middleware
│   │   ├── routes/        # Route definitions
│   │   ├── services/      # Business logic
│   │   ├── types/         # TypeScript types
│   │   ├── utils/         # Helper utilities
│   │   └── app.ts         # Express app entry
│   └── prisma/            # Database schema & migrations
│
├── web/                   # Next.js web application
│   └── src/
│       ├── app/           # App Router pages
│       ├── components/    # React components
│       └── lib/           # Utilities (api, auth-context)
│
├── mobile/                # Flutter mobile app
│   └── lib/
│       ├── core/          # Shared utilities
│       ├── data/          # Data layer (models, datasources)
│       ├── domain/        # Domain layer (entities, repositories)
│       └── presentation/  # UI layer (screens, widgets, providers)
│
└── CLAUDE.md              # This file
```

---

## Quick Reference

### Backend (Express + Prisma)

| Item | Location |
|------|----------|
| Entry point | `backend/src/app.ts` |
| Config | `backend/src/config/index.ts` |
| Database schema | `backend/prisma/schema.prisma` |
| Routes | `backend/src/routes/` |
| Auth middleware | `backend/src/middleware/auth.middleware.ts` |

**Key Commands:**
```bash
cd backend
npm run dev              # Start dev server (port 8000)
npm run db:migrate:dev   # Create migration
npm run db:studio        # Open Prisma Studio
npm run build            # Production build
```

### Web (Next.js)

| Item | Location |
|------|----------|
| Entry layout | `web/src/app/layout.tsx` |
| Homepage | `web/src/app/page.tsx` |
| Auth context | `web/src/lib/auth-context.tsx` |
| API client | `web/src/lib/api.ts` |

**Key Commands:**
```bash
cd web
npm run dev     # Start dev server (port 3000)
npm run build   # Production build
npm run lint    # Run ESLint
```

### Mobile (Flutter)

| Item | Location |
|------|----------|
| Entry point | `mobile/lib/main.dart` |
| App widget | `mobile/lib/app.dart` |
| API constants | `mobile/lib/core/constants/api_constants.dart` |
| API client | `mobile/lib/core/network/api_client.dart` |
| Theme | `mobile/lib/core/theme/` |

**Key Commands:**
```bash
cd mobile
flutter run                    # Run on connected device
flutter build apk              # Build Android APK
flutter pub run build_runner build --delete-conflicting-outputs  # Generate code
```

---

## Authentication Flow

### Overview
```
1. User submits credentials (email + password)
2. Backend validates and returns JWT tokens
3. Web: Tokens stored in httpOnly cookies
4. Mobile: Tokens stored in flutter_secure_storage
5. Authenticated requests include token automatically
6. Token refresh handled transparently
```

### API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/register` | POST | Create new user |
| `/api/v1/auth/login` | POST | Login, returns tokens |
| `/api/v1/auth/logout` | POST | Clear session |
| `/api/v1/auth/me` | GET | Get current user |
| `/api/v1/auth/refresh` | POST | Refresh tokens |

### Admin API Endpoints

| Base Path | Description | Auth |
|-----------|-------------|------|
| `/api/v1/admin/stats` | Dashboard statistics | Admin |
| `/api/v1/admin/users` | User management (CRUD, export) | Admin |
| `/api/v1/admin/audit-logs` | Audit log viewing and export | Admin |
| `/api/v1/admin/contact-messages` | Contact message management | Admin |
| `/api/v1/admin/orders` | Order management and stats | Admin |
| `/api/v1/faqs` | FAQ management (public + admin) | Mixed |
| `/api/v1/announcements` | Announcement management | Mixed |
| `/api/v1/settings` | Application settings | Mixed |
| `/api/v1/content` | CMS content pages | Mixed |
| `/api/v1/coupons` | Coupon/discount management | Mixed |
| `/api/v1/notifications` | User notification system | Auth |

### Request/Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

---

## Environment Variables

### Backend (`backend/.env`)
```bash
# Required
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
JWT_SECRET=your-secure-secret-min-32-chars

# Optional
NODE_ENV=development
PORT=8000
CORS_ORIGIN=http://localhost:3000
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
```

### Web (`web/.env.local`)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### Mobile (via dart-define)
```bash
flutter run --dart-define=API_URL=http://10.0.2.2:8000/api/v1
```

---

## Database Schema (Prisma)

### Core Models

| Model | Description |
|-------|-------------|
| `User` | Core user with auth, OAuth, session management, account lockout |
| `Session` | Multi-device session management with device info |
| `PasswordResetToken` | Password reset flow tokens |
| `EmailVerificationToken` | Email verification tokens |
| `AuditLog` | Action tracking with entity, changes, IP, user agent |
| `Notification` | In-app user notifications (info, success, warning, error, system) |

### Admin/CMS Models

| Model | Description |
|-------|-------------|
| `FaqCategory` | FAQ category organization with slug and ordering |
| `Faq` | FAQ items with category, question, answer, ordering |
| `Announcement` | System announcements/banners with scheduling |
| `Setting` | Key-value app settings (string, number, boolean, json) |
| `ContentPage` | Static CMS pages with SEO metadata |
| `Coupon` | Discount codes (percentage/fixed, usage limits, validity) |
| `Order` | Order/purchase tracking with items, payment, status |
| `ContactMessage` | Contact form submissions with status tracking |

### Enums

| Enum | Values |
|------|--------|
| `UserRole` | USER, ADMIN |
| `AuditAction` | CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT, LOGIN_FAILED, PASSWORD_CHANGE, PASSWORD_RESET, EMAIL_VERIFY, ADMIN_ACTION |
| `NotificationType` | INFO, SUCCESS, WARNING, ERROR, SYSTEM |
| `AnnouncementType` | INFO, WARNING, SUCCESS, PROMO |
| `SettingType` | STRING, NUMBER, BOOLEAN, JSON |
| `DiscountType` | PERCENTAGE, FIXED |
| `OrderStatus` | PENDING, COMPLETED, REFUNDED, FAILED |
| `PaymentMethod` | STRIPE, PAYPAL, MANUAL |
| `ContactMessageStatus` | PENDING, READ, REPLIED |

---

## Common Patterns

### Backend: Adding New Endpoints

1. Create route file (`src/routes/example.routes.ts`):
```typescript
import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/", (req, res) => { ... });
router.post("/", authMiddleware, (req, res) => { ... });

export default router;
```

2. Register in `src/routes/index.ts`:
```typescript
import exampleRoutes from "./example.routes";
v1Router.use("/examples", exampleRoutes);
```

### Web: Adding New Pages

Create file in `src/app/`:
```typescript
// src/app/new-page/page.tsx
"use client";

import { useAuth } from "@/lib/auth-context";

export default function NewPage() {
  const { user, isAuthenticated } = useAuth();
  return <div>New Page</div>;
}
```

### Mobile: Adding New Features

1. Create provider in `lib/presentation/providers/`
2. Create screen in `lib/presentation/screens/`
3. Add route (when using go_router)
4. Use `ConsumerWidget` to access providers

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| CORS errors | Origin not whitelisted | Add to `CORS_ORIGIN` in backend |
| 401 Unauthorized | Token expired | Refresh token or re-login |
| Database connection | Invalid URL | Check `DATABASE_URL` format |
| Mobile API fails | Wrong localhost | Use `10.0.2.2` for Android emulator |
| JWT validation | Missing secret | Set `JWT_SECRET` environment variable |

---

## Development Workflow

### Starting Development
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Web
cd web && npm run dev

# Terminal 3: Mobile (optional)
cd mobile && flutter run
```

### Database Changes
```bash
cd backend
npm run db:migrate:dev    # Create migration from schema changes
npm run db:push           # Push schema without migration (dev only)
npm run db:studio         # Visual database browser
```

---

## Detailed Documentation

For detailed documentation of each application, see:

- **Backend**: [`backend/CLAUDE.md`](./backend/CLAUDE.md)
- **Web**: [`web/CLAUDE.md`](./web/CLAUDE.md)
- **Mobile**: [`mobile/CLAUDE.md`](./mobile/CLAUDE.md)

---

*This documentation is designed to be self-growing. Update the "Recent Changes" section when making significant changes to the codebase.*
