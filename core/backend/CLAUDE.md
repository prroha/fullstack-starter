# CLAUDE.md - Fullstack Starter Backend

> **Last Updated**: 2026-02-17
> **Codebase Version**: 1.4.0
> **Maintainer**: AI-assisted documentation (auto-update on changes)

AI-optimized documentation for quick codebase navigation and understanding.

---

## Quick Search Keywords

Use these to quickly find what you need:

- **Authentication**: `auth.middleware.ts`, `jwt.ts`, `auth.routes.ts`, `authMiddleware`
- **Database**: `prisma/schema.prisma`, `db.ts`, `migrations`
- **Errors**: `error.middleware.ts`, `ApiError`, `response.ts`
- **Config**: `config/index.ts`, `.env`, environment variables
- **Validation**: `zod`, controller validation schemas
- **Routes**: `routes/index.ts`, `auth.routes.ts`
- **Swagger**: `swagger.ts`, API documentation

---

## Recent Changes

<!-- Add new entries at the top -->

| Date       | Change                                                                                                       | Files                                                                                                |
| ---------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| 2026-02-17 | Full Express.js → Fastify 5.x migration: entry point, middleware, controllers, routes, tests                 | All files in `src/`                                                                                  |
| 2026-02-09 | Documentation updates                                                                                        | `CLAUDE.md`                                                                                          |
| 2026-02-08 | Admin platform expansion: FAQs, Announcements, Settings, Content, Coupons, Orders, Notifications, Audit logs | `routes/*.routes.ts`, `controllers/*.controller.ts`, `services/*.service.ts`, `prisma/schema.prisma` |
| 2026-02-06 | Initial documentation                                                                                        | CLAUDE.md                                                                                            |

---

## 1. Architecture Overview

### Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Fastify 5.x
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (httpOnly cookies + Authorization header)
- **Validation**: Zod
- **Security**: @fastify/helmet, @fastify/cors, @fastify/rate-limit

### Design Patterns

- **Singleton Services**: Services exported as singleton instances
- **Controller-Service-Route**: Separation of concerns
- **Hook Chain**: Fastify hooks (onRequest, preHandler) for auth, rate limiting, validation
- **Error Handling**: Custom `ApiError` class with Fastify `setErrorHandler()`

### Folder Structure

```
src/
├── config/               # Configuration (index.ts)
├── controllers/          # Route handlers
├── lib/                  # Core utilities (db, logger)
├── middleware/           # Fastify hooks & middleware
├── routes/               # Route definitions
├── services/             # Business logic
├── types/                # TypeScript type definitions
├── utils/                # Helper utilities
└── app.ts                # Fastify app entry point
```

---

## 2. Key Files Index

### Entry Points

| File         | Purpose                                       |
| ------------ | --------------------------------------------- |
| `src/app.ts` | Fastify app setup, plugin chain, server start |

### Configuration

| File                   | Purpose                                     |
| ---------------------- | ------------------------------------------- |
| `src/config/index.ts`  | All env vars, config object, helper methods |
| `prisma/schema.prisma` | Database schema definition                  |
| `.env.example`         | Environment variable template               |

### Important Middleware

| File                                 | Purpose                              |
| ------------------------------------ | ------------------------------------ |
| `src/middleware/auth.middleware.ts`  | JWT auth, admin role checks          |
| `src/middleware/error.middleware.ts` | Global error handler, ApiError class |

### Core Utilities

| File                    | Purpose                                                |
| ----------------------- | ------------------------------------------------------ |
| `src/lib/db.ts`         | Prisma client singleton                                |
| `src/lib/logger.ts`     | Logging utility (debug/info/warn/error/audit/security) |
| `src/utils/jwt.ts`      | Token generation/verification                          |
| `src/utils/response.ts` | Error response formatting, error codes                 |

### Services

| Service                    | File                            | Purpose                                |
| -------------------------- | ------------------------------- | -------------------------------------- |
| `authService`              | `auth.service.ts`               | Authentication logic, password hashing |
| `userService`              | `user.service.ts`               | User CRUD operations                   |
| `adminService`             | `admin.service.ts`              | Admin dashboard stats, user management |
| `sessionService`           | `session.service.ts`            | Multi-device session management        |
| `auditService`             | `audit.service.ts`              | Audit log creation and querying        |
| `notificationService`      | `notification.service.ts`       | In-app notification management         |
| `emailService`             | `email.service.ts`              | Email sending (transactional)          |
| `emailVerificationService` | `email-verification.service.ts` | Email verification flow                |
| `lockoutService`           | `lockout.service.ts`            | Account lockout/brute force protection |
| `contactService`           | `contact.service.ts`            | Contact form message handling          |
| `orderService`             | `order.service.ts`              | Order management and stats             |
| `searchService`            | `search.service.ts`             | Global search across entities          |
| `exportService`            | `export.service.ts`             | CSV export for admin data              |
| `faqService`               | `faq.service.ts`                | FAQ and category management            |
| `announcementService`      | `announcement.service.ts`       | System announcements                   |
| `settingService`           | `setting.service.ts`            | App settings (key-value)               |
| `contentService`           | `content.service.ts`            | CMS static pages                       |
| `couponService`            | `coupon.service.ts`             | Discount coupon management             |

---

## 3. API Structure

### Route Files

| Route File               | Base Path               | Description                                              |
| ------------------------ | ----------------------- | -------------------------------------------------------- |
| `auth.routes.ts`         | `/api/v1/auth`          | Login, register, logout, me, refresh                     |
| `user.routes.ts`         | `/api/v1/users`         | User profile management                                  |
| `admin.routes.ts`        | `/api/v1/admin`         | Dashboard stats, user mgmt, audit logs, contact messages |
| `faq.routes.ts`          | `/api/v1/faqs`          | FAQ CRUD, categories (public + admin)                    |
| `announcement.routes.ts` | `/api/v1/announcements` | Announcements (active public, CRUD admin)                |
| `setting.routes.ts`      | `/api/v1/settings`      | App settings (public readable, admin writable)           |
| `content.routes.ts`      | `/api/v1/content`       | CMS pages (public by slug, CRUD admin)                   |
| `coupon.routes.ts`       | `/api/v1/coupons`       | Coupon validation (public), CRUD (admin)                 |
| `order.routes.ts`        | `/api/v1/orders`        | User orders                                              |
| `order.routes.ts`        | `/api/v1/admin/orders`  | Order management, stats, export (admin)                  |
| `contact.routes.ts`      | `/api/v1/contact`       | Contact form submission (rate limited)                   |
| `notification.routes.ts` | `/api/v1/notifications` | User notifications (authenticated)                       |
| `search.routes.ts`       | `/api/v1/search`        | Global search                                            |

### Route Registration

```typescript
// src/routes/index.ts
const routes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(
    async (v1) => {
      await v1.register(authRoutes, { prefix: "/auth" });
      // Add more routes here
    },
    { prefix: "/v1" },
  );
};
```

### Authentication Flow

```
1. Register: POST /api/v1/auth/register
   - Creates user with hashed password
   - Returns user object (no auto-login)

2. Login: POST /api/v1/auth/login
   - Validates credentials
   - Sets httpOnly cookies (for web)
   - Returns: { user, accessToken, refreshToken }

3. Auth Middleware Chain:
   - authMiddleware: Verifies JWT, attaches req.user + req.dbUser
   - adminMiddleware: Requires ADMIN role
   - optionalAuthMiddleware: Attaches user if token present, doesn't fail
```

### Request/Response Patterns

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
    "message": "Human readable message",
    "details": { ... }
  }
}
```

**Paginated Response:**

```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

## 4. Database Schema

### Core Models

| Model                    | Table                       | Description                                        |
| ------------------------ | --------------------------- | -------------------------------------------------- |
| `User`                   | `users`                     | User accounts with auth, OAuth, lockout protection |
| `Session`                | `sessions`                  | Multi-device login sessions with device info       |
| `PasswordResetToken`     | `password_reset_tokens`     | Password reset flow                                |
| `EmailVerificationToken` | `email_verification_tokens` | Email verification flow                            |
| `AuditLog`               | `audit_logs`                | Action audit trail with changes, IP, user agent    |
| `Notification`           | `notifications`             | In-app user notifications                          |

### Admin/CMS Models

| Model            | Table              | Description                                         |
| ---------------- | ------------------ | --------------------------------------------------- |
| `FaqCategory`    | `faq_categories`   | FAQ categories with slug, ordering                  |
| `Faq`            | `faqs`             | FAQ entries with question, answer, ordering         |
| `Announcement`   | `announcements`    | System banners with scheduling, type                |
| `Setting`        | `settings`         | Key-value app settings (string/number/boolean/json) |
| `ContentPage`    | `content_pages`    | Static CMS pages with SEO metadata                  |
| `Coupon`         | `coupons`          | Discount codes with type, limits, validity          |
| `Order`          | `orders`           | Orders/purchases with items, payment, status        |
| `ContactMessage` | `contact_messages` | Contact form submissions                            |

### Key Enums

| Enum                   | Values                                                                                                                 |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `UserRole`             | USER, ADMIN                                                                                                            |
| `AuditAction`          | CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT, LOGIN_FAILED, PASSWORD_CHANGE, PASSWORD_RESET, EMAIL_VERIFY, ADMIN_ACTION |
| `NotificationType`     | INFO, SUCCESS, WARNING, ERROR, SYSTEM                                                                                  |
| `AnnouncementType`     | INFO, WARNING, SUCCESS, PROMO                                                                                          |
| `SettingType`          | STRING, NUMBER, BOOLEAN, JSON                                                                                          |
| `DiscountType`         | PERCENTAGE, FIXED                                                                                                      |
| `OrderStatus`          | PENDING, COMPLETED, REFUNDED, FAILED                                                                                   |
| `PaymentMethod`        | STRIPE, PAYPAL, MANUAL                                                                                                 |
| `ContactMessageStatus` | PENDING, READ, REPLIED                                                                                                 |

### Database Commands

```bash
npm run db:migrate:dev   # Create/apply migrations
npm run db:push          # Push schema (no migration)
npm run db:studio        # Open Prisma Studio
npm run db:generate      # Regenerate Prisma client
```

---

## 5. Common Patterns

### Error Handling

```typescript
// Use ApiError class for operational errors
import { ApiError } from "../middleware/error.middleware";

throw ApiError.notFound("Resource not found");
throw ApiError.badRequest("Invalid input");
throw ApiError.unauthorized("Token expired");
throw ApiError.forbidden("Admin access required");
throw ApiError.conflict("Email already registered");

// Error middleware catches all errors automatically
```

### Validation with Zod

```typescript
// In controller
const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1).optional(),
});

const validated = registerSchema.parse(req.body); // Throws ZodError if invalid
```

### Response Formatting

```typescript
import {
  successResponse,
  errorResponse,
  paginatedResponse,
} from "../utils/response.js";

// Success
return reply.send(successResponse({ user }, "User created"));

// Error
return reply.code(400).send(errorResponse("VALIDATION_ERROR", "Invalid input"));

// Paginated
return reply.send(paginatedResponse(items, page, limit, total));
```

### Authentication Helpers

```typescript
import {
  authMiddleware,
  adminMiddleware,
  optionalAuthMiddleware,
  getAuthenticatedUser,
  isAuthenticated,
} from "../middleware/auth.middleware";

// Get user in controller (after authMiddleware)
const { payload, user } = getAuthenticatedUser(req);

// Check if authenticated (after optionalAuthMiddleware)
if (isAuthenticated(req)) {
  const { user } = getAuthenticatedUser(req);
}
```

---

## 6. Environment Variables

### Required

| Variable       | Purpose                                     |
| -------------- | ------------------------------------------- |
| `DATABASE_URL` | PostgreSQL connection string                |
| `JWT_SECRET`   | JWT signing secret (required in production) |

### Server

| Variable      | Default               | Purpose                                             |
| ------------- | --------------------- | --------------------------------------------------- |
| `NODE_ENV`    | development           | Environment mode                                    |
| `PORT`        | 8000                  | Server port                                         |
| `CORS_ORIGIN` | http://localhost:3000 | Allowed origins (comma-separated)                   |
| `TRUST_PROXY` | false                 | Trust proxy headers (set true behind load balancer) |

### JWT

| Variable                 | Default | Purpose              |
| ------------------------ | ------- | -------------------- |
| `JWT_EXPIRES_IN`         | 7d      | Access token expiry  |
| `JWT_REFRESH_EXPIRES_IN` | 30d     | Refresh token expiry |

### Rate Limiting

| Variable                  | Default | Purpose                 |
| ------------------------- | ------- | ----------------------- |
| `RATE_LIMIT_WINDOW_MS`    | 60000   | Rate limit window (ms)  |
| `RATE_LIMIT_MAX_REQUESTS` | 100     | Max requests per window |

---

## 7. Quick Reference

### Adding a New API Endpoint

1. **Create/update route file** (`src/routes/example.routes.ts`):

```typescript
import { FastifyPluginAsync } from "fastify";
import { exampleController } from "../controllers/example.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const routePlugin: FastifyPluginAsync = async (fastify) => {
  fastify.get("/", (req, reply) => exampleController.list(req, reply));
  fastify.post("/", { preHandler: [authMiddleware] }, (req, reply) =>
    exampleController.create(req, reply),
  );
};

export default routePlugin;
```

2. **Register route** in `src/routes/index.ts`:

```typescript
import exampleRoutes from "./example.routes.js";
await v1.register(exampleRoutes, { prefix: "/examples" });
```

3. **Create controller** (`src/controllers/example.controller.ts`):

```typescript
import { FastifyRequest, FastifyReply } from "fastify";
import { exampleService } from "../services/example.service.js";
import { successResponse } from "../utils/response.js";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
});

class ExampleController {
  async list(req: FastifyRequest, reply: FastifyReply) {
    const result = await exampleService.getAll();
    return reply.send(successResponse({ items: result }));
  }

  async create(req: FastifyRequest, reply: FastifyReply) {
    const validated = createSchema.parse(req.body);
    const result = await exampleService.create(validated);
    return reply.code(201).send(successResponse({ item: result }));
  }
}

export const exampleController = new ExampleController();
```

4. **Create service** (`src/services/example.service.ts`):

```typescript
import { db } from "../lib/db";

class ExampleService {
  async getAll() {
    return db.example.findMany();
  }

  async create(data: { name: string }) {
    return db.example.create({ data });
  }
}

export const exampleService = new ExampleService();
```

### Adding a New Database Model

1. **Update schema** (`prisma/schema.prisma`):

```prisma
model Example {
  id        String   @id @default(uuid())
  name      String
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@index([isActive])
  @@map("examples")
}
```

2. **Create migration**:

```bash
npm run db:migrate:dev -- --name add_example_table
```

3. **Regenerate Prisma client**:

```bash
npm run db:generate
```

---

## 8. Useful Commands

```bash
# Development
npm run dev              # Start with nodemon
npm run db:studio        # Open Prisma Studio

# Database
npm run db:migrate:dev   # Create/apply migrations
npm run db:push          # Push schema (no migration)
npm run db:generate      # Regenerate Prisma client

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues

# Production
npm run build            # Compile TypeScript
npm start                # Run production server
```

---

## 9. Common Issues & Solutions

| Issue                   | Cause                   | Solution                            |
| ----------------------- | ----------------------- | ----------------------------------- |
| `JWT_SECRET required`   | Missing env var in prod | Set `JWT_SECRET` in environment     |
| CORS errors             | Origin not in whitelist | Add origin to `CORS_ORIGIN`         |
| Database connection     | Invalid `DATABASE_URL`  | Verify PostgreSQL connection string |
| Prisma errors           | Schema out of sync      | Run `npm run db:push` or migrate    |
| 401 on protected routes | Invalid/expired token   | Check token, refresh, or re-login   |

---

## 10. Critical Code Locations

| Functionality        | File                                 | Key Lines                           |
| -------------------- | ------------------------------------ | ----------------------------------- |
| JWT token generation | `src/utils/jwt.ts`                   | `generateTokenPair()`               |
| Auth middleware      | `src/middleware/auth.middleware.ts`  | `authMiddleware`, `adminMiddleware` |
| Error handling       | `src/middleware/error.middleware.ts` | `ApiError` class                    |
| Database singleton   | `src/lib/db.ts`                      | Prisma client export                |
| Config               | `src/config/index.ts`                | All environment variables           |

---

## Notes

- All services are singletons - import and use directly
- Use `logger.audit()` for sensitive operations
- Use `logger.security()` for security events
- httpOnly cookies are used for web clients; Authorization header for mobile
- Single device policy available via `activeDeviceId` field

---

## Code Conventions

### Response Formatting

Always use helper functions from `utils/response.ts`:

```typescript
import {
  successResponse,
  errorResponse,
  paginatedResponse,
} from "../utils/response.js";

// Success with data
return reply.send(successResponse({ user }, "User created"));

// Error response
return reply.code(400).send(errorResponse("VALIDATION_ERROR", "Invalid input"));

// Paginated list
return reply.send(paginatedResponse(items, page, limit, total));
```

### Error Handling

Use `ApiError` for all operational errors:

```typescript
import { ApiError } from "../middleware/error.middleware";

throw ApiError.notFound("User not found");
throw ApiError.badRequest("Invalid email format");
throw ApiError.unauthorized("Token expired");
throw ApiError.forbidden("Admin access required");
throw ApiError.conflict("Email already exists");
```

### Validation with Zod

Define schemas at the top of controllers:

```typescript
const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

// In handler
const validated = createUserSchema.parse(req.body);
```

---

_This documentation is designed to be self-growing. Update the "Recent Changes" section when making significant changes to the codebase._
