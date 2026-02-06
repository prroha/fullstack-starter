# Technical Module Documentation

> Comprehensive technical reference for all modules in the Fullstack Starter template.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Core Module](#core-module)
- [Authentication Module](#authentication-module)
- [User Management Module](#user-management-module)
- [Email Module](#email-module)
- [File Upload Module](#file-upload-module)
- [Payments Module](#payments-module)
- [Analytics Module](#analytics-module)
- [Admin Dashboard Module](#admin-dashboard-module)
- [Module Integration Guide](#module-integration-guide)

---

## Architecture Overview

### Monorepo Structure

```
fullstack-starter/
├── backend/          # Express.js + Prisma API
├── web/              # Next.js 15 web application
├── mobile/           # Flutter mobile app
└── docs/             # Documentation
```

### Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Backend Runtime | Node.js | 20+ |
| Backend Framework | Express.js | 4.x |
| ORM | Prisma | Latest |
| Database | PostgreSQL | 14+ |
| Web Framework | Next.js | 15 |
| Web UI | React + Tailwind CSS | 19 / v4 |
| Mobile Framework | Flutter | 3.2+ |
| Mobile State | Riverpod | Latest |

### Layer Communication

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Mobile    │     │     Web     │     │   Admin     │
│   (Flutter) │     │  (Next.js)  │     │   Panel     │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                    ┌──────▼──────┐
                    │   Backend   │
                    │  (Express)  │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  PostgreSQL │
                    │  + Prisma   │
                    └─────────────┘
```

---

## Core Module

The foundation that all other modules depend on.

### Features

- Express.js server setup with TypeScript
- Prisma ORM with PostgreSQL connection
- Request/response formatting utilities
- Error handling middleware
- Logging system
- Rate limiting
- Security headers (Helmet)
- CORS configuration

### Dependencies

```json
// Backend
{
  "express": "^4.x",
  "@prisma/client": "latest",
  "helmet": "^7.x",
  "cors": "^2.x",
  "express-rate-limit": "^7.x",
  "zod": "^3.x"
}

// Web
{
  "next": "^15.x",
  "react": "^19.x",
  "tailwindcss": "^4.x"
}

// Mobile (pubspec.yaml)
{
  "flutter_riverpod": "^2.x",
  "dio": "^5.x",
  "dartz": "^0.10.x",
  "freezed": "^2.x"
}
```

### Environment Variables

```bash
# Backend (.env)
NODE_ENV=development|production|test
PORT=8000
DATABASE_URL=postgresql://user:pass@host:5432/dbname
CORS_ORIGIN=http://localhost:3000
TRUST_PROXY=false

# Web (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Mobile (dart-define)
API_URL=http://10.0.2.2:8000/api/v1
```

### Key Files

| File | Purpose |
|------|---------|
| `backend/src/app.ts` | Express application entry |
| `backend/src/config/index.ts` | Environment configuration |
| `backend/src/lib/db.ts` | Prisma client singleton |
| `backend/src/lib/logger.ts` | Logging utilities |
| `backend/src/utils/response.ts` | Response formatting |
| `backend/src/middleware/error.middleware.ts` | Global error handler |

### API Response Format

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

**Error:**
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

**Paginated:**
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

## Authentication Module

JWT-based authentication with httpOnly cookies for web and secure storage for mobile.

### Features

- Email/password registration and login
- JWT access and refresh tokens
- Password hashing with bcrypt
- Email verification (optional)
- Password reset flow
- Session management
- Role-based access (USER, ADMIN)
- Single device enforcement (optional)

### Dependencies

```json
// Backend
{
  "bcrypt": "^5.x",
  "jsonwebtoken": "^9.x"
}

// Mobile
{
  "flutter_secure_storage": "^9.x"
}
```

### Environment Variables

```bash
# Backend
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
```

### Database Schema

```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String    @map("password_hash")
  name          String?
  role          UserRole  @default(USER)
  isActive      Boolean   @default(true) @map("is_active")
  emailVerified Boolean   @default(false) @map("email_verified")
  googleId      String?   @unique @map("google_id")
  authProvider  String    @default("email") @map("auth_provider")
  activeDeviceId String?  @map("active_device_id")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  @@map("users")
}

enum UserRole {
  USER
  ADMIN
}
```

### API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/auth/register` | POST | No | Create new user |
| `/api/v1/auth/login` | POST | No | Login, returns tokens |
| `/api/v1/auth/logout` | POST | Yes | Clear session/cookies |
| `/api/v1/auth/me` | GET | Yes | Get current user |
| `/api/v1/auth/refresh` | POST | No | Refresh tokens |
| `/api/v1/auth/forgot-password` | POST | No | Request password reset |
| `/api/v1/auth/reset-password` | POST | No | Reset password with token |
| `/api/v1/auth/verify-email` | POST | No | Verify email with token |

### Key Files

| File | Purpose |
|------|---------|
| `backend/src/routes/auth.routes.ts` | Auth route definitions |
| `backend/src/controllers/auth.controller.ts` | Auth request handlers |
| `backend/src/services/auth.service.ts` | Auth business logic |
| `backend/src/utils/jwt.ts` | Token generation/verification |
| `backend/src/middleware/auth.middleware.ts` | Auth middleware |
| `web/src/lib/auth-context.tsx` | React auth context |
| `mobile/lib/core/services/token_manager.dart` | Mobile token storage |

### Integration Points

- **Email Module**: For verification and password reset emails
- **User Management Module**: For profile management
- **Admin Module**: For user administration

### Usage Example

**Backend (Middleware):**
```typescript
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware";

// Require authentication
router.get("/protected", authMiddleware, handler);

// Require admin role
router.get("/admin-only", authMiddleware, adminMiddleware, handler);
```

**Web (React):**
```tsx
import { useAuth } from "@/lib/auth-context";

function Component() {
  const { user, isAuthenticated, login, logout } = useAuth();

  if (!isAuthenticated) {
    return <LoginForm onSubmit={login} />;
  }

  return <div>Welcome, {user.name}</div>;
}
```

**Mobile (Flutter):**
```dart
final authState = ref.watch(authProvider);

if (authState.isAuthenticated) {
  // Show authenticated content
}
```

---

## User Management Module

User profile and account management functionality.

### Features

- View and update profile
- Change password
- Account deletion
- Avatar upload
- User preferences
- Activity history

### Dependencies

Depends on: **Core Module**, **Authentication Module**

Optional: **File Upload Module** (for avatars)

### Database Schema

```prisma
model User {
  // ... auth fields

  // Profile fields
  avatar        String?
  bio           String?
  phone         String?
  timezone      String?   @default("UTC")
  locale        String?   @default("en")

  // Preferences (JSON field or separate table)
  preferences   Json?

  // Relations
  activities    Activity[]
}

model Activity {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  action    String
  details   Json?
  createdAt DateTime @default(now()) @map("created_at")

  user      User     @relation(fields: [userId], references: [id])

  @@index([userId])
  @@map("activities")
}
```

### API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/users/me` | GET | Yes | Get current user profile |
| `/api/v1/users/me` | PATCH | Yes | Update profile |
| `/api/v1/users/me/password` | PUT | Yes | Change password |
| `/api/v1/users/me/avatar` | POST | Yes | Upload avatar |
| `/api/v1/users/me/avatar` | DELETE | Yes | Remove avatar |
| `/api/v1/users/me` | DELETE | Yes | Delete account |

### Key Files

| File | Purpose |
|------|---------|
| `backend/src/routes/user.routes.ts` | User routes |
| `backend/src/controllers/user.controller.ts` | User handlers |
| `backend/src/services/user.service.ts` | User business logic |

---

## Email Module

Transactional email system with templates and queue support.

### Features

- Transactional email sending
- HTML email templates
- Template variables
- Email queue (optional)
- Multiple provider support (SendGrid, Resend, SMTP)
- Email logs

### Dependencies

```json
// Backend
{
  "nodemailer": "^6.x",
  // OR
  "@sendgrid/mail": "^8.x",
  // OR
  "resend": "^2.x"
}
```

Depends on: **Core Module**

### Environment Variables

```bash
# SMTP Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-username
SMTP_PASS=your-password
EMAIL_FROM=noreply@example.com
EMAIL_FROM_NAME=Your App Name

# OR SendGrid
SENDGRID_API_KEY=your-api-key

# OR Resend
RESEND_API_KEY=your-api-key
```

### Database Schema (Optional - for email logs)

```prisma
model EmailLog {
  id          String   @id @default(uuid())
  to          String
  subject     String
  template    String
  status      String   @default("pending") // pending, sent, failed
  error       String?
  sentAt      DateTime?
  createdAt   DateTime @default(now()) @map("created_at")

  @@index([to])
  @@index([status])
  @@map("email_logs")
}
```

### Key Files

| File | Purpose |
|------|---------|
| `backend/src/services/email.service.ts` | Email sending logic |
| `backend/src/templates/emails/` | Email HTML templates |
| `backend/src/config/email.ts` | Email configuration |

### Integration Points

- **Authentication Module**: Password reset, email verification
- **Payments Module**: Receipt emails, subscription notifications
- **Admin Module**: Admin notifications

### Usage Example

```typescript
import { emailService } from "../services/email.service";

// Send verification email
await emailService.send({
  to: user.email,
  template: "verify-email",
  data: {
    name: user.name,
    verificationUrl: `${config.frontendUrl}/verify?token=${token}`,
  },
});
```

---

## File Upload Module

File storage and management with support for local and cloud storage.

### Features

- Image upload with validation
- Document upload (PDF, DOC, etc.)
- S3/R2/MinIO cloud storage
- Local storage fallback
- Image resizing (optional)
- File type validation
- Size limits
- Secure signed URLs

### Dependencies

```json
// Backend
{
  "multer": "^1.x",
  "@aws-sdk/client-s3": "^3.x",
  "sharp": "^0.33.x"  // for image processing
}
```

Depends on: **Core Module**, **Authentication Module**

### Environment Variables

```bash
# Storage Configuration
STORAGE_TYPE=local|s3
UPLOAD_MAX_SIZE=10485760  # 10MB in bytes

# Local Storage
UPLOAD_DIR=./uploads
UPLOAD_URL_PREFIX=/uploads

# S3/R2/MinIO Configuration
S3_ENDPOINT=https://s3.amazonaws.com  # or R2/MinIO endpoint
S3_REGION=us-east-1
S3_BUCKET=your-bucket-name
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_PUBLIC_URL=https://cdn.example.com  # optional CDN URL
```

### Database Schema

```prisma
model File {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  filename    String
  originalName String  @map("original_name")
  mimeType    String   @map("mime_type")
  size        Int
  path        String
  url         String
  isPublic    Boolean  @default(false) @map("is_public")
  createdAt   DateTime @default(now()) @map("created_at")

  user        User     @relation(fields: [userId], references: [id])

  @@index([userId])
  @@map("files")
}
```

### API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/files/upload` | POST | Yes | Upload single file |
| `/api/v1/files/upload/multiple` | POST | Yes | Upload multiple files |
| `/api/v1/files/:id` | GET | Yes | Get file metadata |
| `/api/v1/files/:id` | DELETE | Yes | Delete file |
| `/api/v1/files/:id/url` | GET | Yes | Get signed URL |

### Key Files

| File | Purpose |
|------|---------|
| `backend/src/routes/file.routes.ts` | File routes |
| `backend/src/controllers/file.controller.ts` | File handlers |
| `backend/src/services/storage.service.ts` | Storage abstraction |
| `backend/src/services/storage/local.storage.ts` | Local storage |
| `backend/src/services/storage/s3.storage.ts` | S3 storage |
| `backend/src/middleware/upload.middleware.ts` | Multer configuration |

### Integration Points

- **User Management**: Avatar uploads
- **Admin Module**: Content management
- **Any module requiring file attachments**

### Usage Example

```typescript
import { storageService } from "../services/storage.service";

// Upload file
const file = await storageService.upload({
  buffer: req.file.buffer,
  filename: req.file.originalname,
  mimeType: req.file.mimetype,
  userId: req.user.id,
});

// Get signed URL (for private files)
const url = await storageService.getSignedUrl(file.path, 3600); // 1 hour
```

---

## Payments Module

Payment processing with Stripe or Razorpay integration.

### Features

- One-time payments
- Subscription management
- Multiple payment methods
- Webhook handling
- Invoice generation
- Refund processing
- Payment history

### Dependencies

```json
// Backend
{
  "stripe": "^14.x"
  // OR
  "razorpay": "^2.x"
}
```

Depends on: **Core Module**, **Authentication Module**, **Email Module**

### Environment Variables

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# OR Razorpay
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

# General
PAYMENT_CURRENCY=usd
```

### Database Schema

```prisma
model Subscription {
  id              String   @id @default(uuid())
  userId          String   @map("user_id")
  stripeCustomerId String? @map("stripe_customer_id")
  stripeSubId     String?  @unique @map("stripe_subscription_id")
  planId          String   @map("plan_id")
  status          String   @default("active") // active, canceled, past_due
  currentPeriodStart DateTime @map("current_period_start")
  currentPeriodEnd   DateTime @map("current_period_end")
  cancelAtPeriodEnd  Boolean  @default(false) @map("cancel_at_period_end")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  user            User     @relation(fields: [userId], references: [id])
  plan            Plan     @relation(fields: [planId], references: [id])

  @@index([userId])
  @@map("subscriptions")
}

model Plan {
  id            String   @id @default(uuid())
  name          String
  description   String?
  stripePriceId String?  @unique @map("stripe_price_id")
  price         Decimal  @db.Decimal(10, 2)
  currency      String   @default("usd")
  interval      String   @default("month") // month, year
  features      Json?
  isActive      Boolean  @default(true) @map("is_active")
  createdAt     DateTime @default(now()) @map("created_at")

  subscriptions Subscription[]

  @@map("plans")
}

model Payment {
  id            String   @id @default(uuid())
  userId        String   @map("user_id")
  stripePaymentId String? @unique @map("stripe_payment_id")
  amount        Decimal  @db.Decimal(10, 2)
  currency      String   @default("usd")
  status        String   // succeeded, pending, failed
  description   String?
  metadata      Json?
  createdAt     DateTime @default(now()) @map("created_at")

  user          User     @relation(fields: [userId], references: [id])

  @@index([userId])
  @@map("payments")
}
```

### API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/payments/create-checkout` | POST | Yes | Create Stripe checkout session |
| `/api/v1/payments/create-intent` | POST | Yes | Create payment intent |
| `/api/v1/payments/webhook` | POST | No | Stripe webhook handler |
| `/api/v1/subscriptions` | GET | Yes | Get user subscriptions |
| `/api/v1/subscriptions` | POST | Yes | Create subscription |
| `/api/v1/subscriptions/:id/cancel` | POST | Yes | Cancel subscription |
| `/api/v1/plans` | GET | No | List available plans |

### Key Files

| File | Purpose |
|------|---------|
| `backend/src/routes/payment.routes.ts` | Payment routes |
| `backend/src/controllers/payment.controller.ts` | Payment handlers |
| `backend/src/services/stripe.service.ts` | Stripe integration |
| `backend/src/services/subscription.service.ts` | Subscription logic |

### Integration Points

- **Email Module**: Payment receipts, subscription notifications
- **Admin Module**: Payment management, plan configuration
- **User Management**: Subscription status display

### Usage Example

```typescript
import { stripeService } from "../services/stripe.service";

// Create checkout session
const session = await stripeService.createCheckoutSession({
  userId: user.id,
  priceId: plan.stripePriceId,
  successUrl: `${config.frontendUrl}/payment/success`,
  cancelUrl: `${config.frontendUrl}/payment/cancel`,
});

// Webhook handling
app.post("/api/v1/payments/webhook", async (req, res) => {
  const event = stripeService.verifyWebhook(req.body, req.headers["stripe-signature"]);
  await stripeService.handleWebhook(event);
  res.json({ received: true });
});
```

---

## Analytics Module

Application analytics and metrics tracking.

### Features

- Page view tracking
- Event tracking
- User activity metrics
- Custom dashboards
- Export to CSV/PDF
- Real-time statistics (optional)

### Dependencies

```json
// Backend - no external deps for basic analytics
// Optional for advanced:
{
  "posthog-node": "^3.x"  // for PostHog integration
}
```

Depends on: **Core Module**, **Authentication Module**

### Environment Variables

```bash
# Optional - PostHog integration
POSTHOG_API_KEY=phc_...
POSTHOG_HOST=https://app.posthog.com

# Internal analytics
ANALYTICS_RETENTION_DAYS=90
```

### Database Schema

```prisma
model AnalyticsEvent {
  id         String   @id @default(uuid())
  userId     String?  @map("user_id")
  sessionId  String?  @map("session_id")
  event      String
  properties Json?
  timestamp  DateTime @default(now())

  @@index([userId])
  @@index([event])
  @@index([timestamp])
  @@map("analytics_events")
}

model DailyMetric {
  id        String   @id @default(uuid())
  date      DateTime @db.Date
  metric    String
  value     Int
  metadata  Json?

  @@unique([date, metric])
  @@index([date])
  @@map("daily_metrics")
}
```

### API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/analytics/track` | POST | Optional | Track event |
| `/api/v1/analytics/dashboard` | GET | Admin | Get dashboard metrics |
| `/api/v1/analytics/events` | GET | Admin | List events |
| `/api/v1/analytics/export` | GET | Admin | Export data |

### Key Files

| File | Purpose |
|------|---------|
| `backend/src/routes/analytics.routes.ts` | Analytics routes |
| `backend/src/controllers/analytics.controller.ts` | Analytics handlers |
| `backend/src/services/analytics.service.ts` | Analytics logic |

### Integration Points

- **Admin Module**: Dashboard display
- **All modules**: Event tracking

### Usage Example

```typescript
import { analyticsService } from "../services/analytics.service";

// Track event
await analyticsService.track({
  userId: user?.id,
  event: "purchase_completed",
  properties: {
    planId: plan.id,
    amount: payment.amount,
  },
});

// Get dashboard metrics
const metrics = await analyticsService.getDashboard({
  startDate: thirtyDaysAgo,
  endDate: now,
});
```

---

## Admin Dashboard Module

Administrative interface for managing the application.

### Features

- User management (CRUD, roles, status)
- Content moderation
- System settings
- Analytics dashboard
- Activity logs
- Bulk operations

### Dependencies

Depends on: **All other modules**

### Database Schema

```prisma
model AdminSetting {
  id        String   @id @default(uuid())
  key       String   @unique
  value     Json
  updatedBy String   @map("updated_by")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("admin_settings")
}

model AuditLog {
  id         String   @id @default(uuid())
  userId     String   @map("user_id")
  action     String
  entityType String   @map("entity_type")
  entityId   String?  @map("entity_id")
  oldValue   Json?    @map("old_value")
  newValue   Json?    @map("new_value")
  ipAddress  String?  @map("ip_address")
  userAgent  String?  @map("user_agent")
  createdAt  DateTime @default(now()) @map("created_at")

  user       User     @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([entityType, entityId])
  @@index([createdAt])
  @@map("audit_logs")
}
```

### API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/admin/users` | GET | Admin | List all users |
| `/api/v1/admin/users/:id` | GET | Admin | Get user details |
| `/api/v1/admin/users/:id` | PATCH | Admin | Update user |
| `/api/v1/admin/users/:id/activate` | POST | Admin | Activate user |
| `/api/v1/admin/users/:id/deactivate` | POST | Admin | Deactivate user |
| `/api/v1/admin/settings` | GET | Admin | Get all settings |
| `/api/v1/admin/settings/:key` | PUT | Admin | Update setting |
| `/api/v1/admin/audit-logs` | GET | Admin | List audit logs |
| `/api/v1/admin/dashboard` | GET | Admin | Dashboard metrics |

### Key Files

| File | Purpose |
|------|---------|
| `backend/src/routes/admin.routes.ts` | Admin routes |
| `backend/src/controllers/admin.controller.ts` | Admin handlers |
| `backend/src/services/admin.service.ts` | Admin business logic |
| `web/src/app/admin/` | Admin web pages |

### Integration Points

- **Authentication Module**: Admin role verification
- **Analytics Module**: Dashboard data
- **All modules**: CRUD operations

---

## Module Integration Guide

### Adding a New Module

1. **Create directory structure:**
```
backend/src/
├── routes/{module}.routes.ts
├── controllers/{module}.controller.ts
├── services/{module}.service.ts
└── types/{module}.types.ts
```

2. **Register routes in `backend/src/routes/index.ts`:**
```typescript
import moduleRoutes from "./{module}.routes";
v1Router.use("/{module}", moduleRoutes);
```

3. **Add environment variables to `.env.example`**

4. **Update Prisma schema if needed:**
```bash
npx prisma migrate dev --name add_{module}_tables
```

5. **Create web pages in `web/src/app/{module}/`**

6. **Create mobile screens in `mobile/lib/presentation/screens/{module}/`**

### Module Dependency Matrix

| Module | Depends On | Optional Dependencies |
|--------|------------|----------------------|
| Core | - | - |
| Authentication | Core | Email |
| User Management | Core, Auth | File Upload |
| Email | Core | - |
| File Upload | Core, Auth | - |
| Payments | Core, Auth | Email |
| Analytics | Core | Auth |
| Admin Dashboard | All | - |

### Environment Variable Checklist

When setting up a new deployment, ensure these are configured:

**Required (Core):**
- [ ] `DATABASE_URL`
- [ ] `JWT_SECRET`
- [ ] `CORS_ORIGIN`

**Email Module:**
- [ ] `SMTP_HOST` / `SENDGRID_API_KEY` / `RESEND_API_KEY`
- [ ] `EMAIL_FROM`

**File Upload Module:**
- [ ] `STORAGE_TYPE`
- [ ] S3 credentials (if using cloud storage)

**Payments Module:**
- [ ] `STRIPE_SECRET_KEY` / `RAZORPAY_KEY_ID`
- [ ] `STRIPE_WEBHOOK_SECRET`

---

## Quick Reference

### API Versioning

All endpoints are prefixed with `/api/v1/`. Future versions will use `/api/v2/`.

### Authentication Header

```
Authorization: Bearer <access_token>
```

Or use httpOnly cookies (automatically handled for web).

### Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Missing or invalid token |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `VALIDATION_ERROR` | Invalid input data |
| `CONFLICT` | Resource already exists |
| `INTERNAL_ERROR` | Server error |

### Rate Limits

Default: 100 requests per minute per IP.

Authenticated users: 200 requests per minute.

Admin users: 500 requests per minute.

---

*For detailed implementation of each module, refer to the individual CLAUDE.md files in each project directory.*
