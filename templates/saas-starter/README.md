# SaaS Starter Template

> Minimal foundation for building SaaS applications.

---

## Overview

The SaaS Starter template provides the essential building blocks for any SaaS application. It includes authentication, user management, and security features out of the box, allowing you to focus on building your core product features.

## Price

**$49** (STARTER tier)

The most affordable way to start building your SaaS product with production-ready authentication.

---

## Included Features

### Core Features

- Project setup (TypeScript, ESLint, Prettier)
- CRUD operations with standardized patterns
- Database setup (Prisma + PostgreSQL)
- Environment configuration
- Error handling & logging

### Authentication

- Email/Password authentication
- JWT session management with refresh tokens
- Email verification
- Password reset flow
- Protected routes

### Security

- CSRF protection
- Basic rate limiting
- Secure password hashing (bcrypt)
- HTTP-only cookies

### UI Components

- 50+ UI components (Shadcn/ui based)
- Basic layouts (Container, Stack, Grid)
- Authentication pages (Login, Register, Forgot Password, Reset Password)
- Dashboard layout with sidebar

---

## What's Included

### Authentication Pages

- `/login` - User login
- `/register` - User registration
- `/forgot-password` - Request password reset
- `/reset-password` - Reset password form
- `/verify-email` - Email verification

### Dashboard

- `/dashboard` - Main dashboard (protected)
- `/settings` - User settings
- `/settings/profile` - Profile management
- `/settings/password` - Change password

### API Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/verify-email` - Verify email
- `GET /api/auth/me` - Get current user
- `PUT /api/users/me` - Update current user
- `PUT /api/users/me/password` - Change password

---

## Database Schema

The template includes pre-configured Prisma models:

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String
  name          String?
  emailVerified DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  sessions      Session[]
  tokens        Token[]
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id])
}

model Token {
  id        String    @id @default(cuid())
  userId    String
  type      TokenType
  token     String    @unique
  expiresAt DateTime
  createdAt DateTime  @default(now())

  user      User      @relation(fields: [userId], references: [id])
}

enum TokenType {
  EMAIL_VERIFICATION
  PASSWORD_RESET
}
```

---

## Quick Start

1. Generate your project with this template
2. Copy `.env.example` to `.env` and configure:
   ```
   DATABASE_URL="postgresql://..."
   JWT_SECRET="your-secret-key"
   JWT_REFRESH_SECRET="your-refresh-secret"
   ```
3. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

---

## Upgrade Path

The SaaS Starter is designed to grow with your product. Add features as needed:

| Add-on          | Price | What it adds                     |
| --------------- | ----- | -------------------------------- |
| Social Login    | +$29  | Google, GitHub, Facebook auth    |
| Admin Panel     | +$49  | User management, admin dashboard |
| Stripe Payments | +$49  | One-time payments                |
| Subscriptions   | +$79  | Recurring billing                |
| File Uploads    | +$39  | S3/R2 integration                |
| Email           | +$29  | Transactional email              |
| Mobile App      | +$99  | Flutter app                      |

---

## Tech Stack

- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Frontend:** Next.js, React, Tailwind CSS
- **Auth:** JWT with refresh tokens
- **UI:** Shadcn/ui components

---

## Best For

- MVPs and prototypes
- Small SaaS products
- Side projects
- Learning projects
- Starting point for larger applications

---

_Last Updated: 2026-02-10_
