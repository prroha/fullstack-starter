# Core Codebase Audit — Findings & Remediation Tracker

> **Created**: 2026-02-17
> **Status**: In Progress

---

## Backend Findings

### CRITICAL

| #      | Issue                                                                                 | File                               | Status |
| ------ | ------------------------------------------------------------------------------------- | ---------------------------------- | ------ |
| CRIT-1 | Access + refresh tokens share same secret, no `type` claim — token confusion          | `utils/jwt.ts`                     | [x]    |
| CRIT-2 | Refresh token rotation not implemented — old refresh tokens remain valid              | `services/auth.service.ts`         | [x]    |
| CRIT-4 | `authMiddleware` doesn't validate token type — refresh token accepted as access token | `middleware/auth.middleware.ts`    | [x]    |
| CRIT-5 | No `sensitiveRateLimiter` on `/change-password` endpoint                              | `routes/auth.routes.ts`            | [x]    |
| CRIT-6 | `starter-config.json` parsed with `as` cast, no Zod validation                        | `middleware/preview.middleware.ts` | [x]    |

### HIGH

| #      | Issue                                                                         | File                                  | Status |
| ------ | ----------------------------------------------------------------------------- | ------------------------------------- | ------ |
| HIGH-1 | Login timing oracle — `bcrypt.compare` not called for non-existent users      | `services/auth.service.ts`            | [x]    |
| HIGH-2 | Password reset tokens stored in plaintext (not SHA-256 hashed)                | `services/auth.service.ts`            | [x]    |
| HIGH-3 | No max session limit per user — unlimited sessions possible                   | `services/session.service.ts`         | [x]    |
| HIGH-4 | Rate limiter falls open when Redis is down — silently allows all traffic      | `middleware/rate-limit.middleware.ts` | [x]    |
| HIGH-6 | File upload MIME type validated from client header only — no magic byte check | `middleware/upload.middleware.ts`     | [ ]    |
| HIGH-8 | Raw SQL with timezone-unaware `DATE()` in `getSignupsByDay`                   | `services/admin.service.ts`           | [x]    |
| HIGH-9 | No cleanup job for expired `PasswordResetToken` and `EmailVerificationToken`  | `services/auth.service.ts`            | [ ]    |

### MEDIUM

| #      | Issue                                                                                              | File                                  | Status |
| ------ | -------------------------------------------------------------------------------------------------- | ------------------------------------- | ------ |
| MED-1  | Access token TTL defaults to 7 days (should be 15 minutes)                                         | `config/index.ts`                     | [x]    |
| MED-5  | Input sanitizer HTML-encodes ALL string fields — corrupts stored data (`O'Brien` → `O&#x27;Brien`) | `middleware/sanitize.middleware.ts`   | [x]    |
| MED-7  | Lockout counter race condition — concurrent requests increment by 1 instead of 2                   | `services/lockout.service.ts`         | [x]    |
| MED-8  | `updateProfile` allows email change without re-verification                                        | `services/user.service.ts`            | [x]    |
| MED-14 | Monetary fields use `Float` instead of `Int` (cents) or `Decimal`                                  | `prisma/schema.prisma`                | [ ]    |
| MED-2  | `requestContext.enterWith()` should be `requestContext.run()`                                      | `create-app.ts`                       | [x]    |
| MED-3  | No per-route body size limit on auth endpoints (global 1MB)                                        | `routes/auth.routes.ts`               | [x]    |
| MED-9  | Dead `process.on("beforeExit")` in db.ts — never fires in server process                           | `lib/db.ts`                           | [x]    |
| MED-10 | No max length limit on search query string                                                         | `services/search.service.ts`          | [x]    |
| MED-12 | Rate limit stores leak `setInterval` timers — never cleaned up                                     | `middleware/rate-limit.middleware.ts` | [ ]    |
| MED-13 | `/uploads/` served publicly with no authentication                                                 | `create-app.ts`                       | [x]    |

### LOW

| #      | Issue                                                                                  | File                            | Status |
| ------ | -------------------------------------------------------------------------------------- | ------------------------------- | ------ |
| LOW-1  | `decodeToken` exported without verification — dangerous API surface                    | `utils/jwt.ts`                  | [x]    |
| LOW-4  | `requireEnv` falls back to default in non-production — hides missing config in staging | `config/index.ts`               | [x]    |
| LOW-5  | `optionalAuthMiddleware` doesn't check `user.isActive`                                 | `middleware/auth.middleware.ts` | [x]    |
| LOW-8  | `attachCsrfToken` defined but never registered as a hook                               | `middleware/csrf.middleware.ts` | [x]    |
| LOW-9  | `global.prisma` pattern is for Next.js hot-reload, not needed in backend               | `lib/db.ts`                     | [x]    |
| LOW-12 | `package.json` description still says "Express + Prisma"                               | `package.json`                  | [x]    |
| LOW-15 | No `noUnusedLocals`/`noUnusedParameters` in tsconfig                                   | `tsconfig.json`                 | [x]    |

### DI Readiness

| #    | Issue                                                                | File              | Status |
| ---- | -------------------------------------------------------------------- | ----------------- | ------ |
| DI-1 | All services are module-level singletons — can't inject alternate db | all service files | [ ]    |
| DI-2 | `db` is a global singleton — can't swap for per-schema client        | `lib/db.ts`       | [ ]    |

---

## Frontend Findings

### CRITICAL

| #   | Issue                                                                       | File                   | Status |
| --- | --------------------------------------------------------------------------- | ---------------------- | ------ |
| C-1 | Double `/v1` prefix on 4 URLs — avatar upload + exports 404                 | `lib/api.ts`           | [x]    |
| C-2 | No `middleware.ts` — all route protection is client-side `useEffect` only   | (missing file)         | [ ]    |
| C-3 | Auth race condition: `isLoading=false` fires before `refreshAuth` completes | `lib/auth-context.tsx` | [x]    |
| C-5 | Missing CSP, HSTS, Permissions-Policy security headers                      | `next.config.ts`       | [x]    |

### HIGH

| #   | Issue                                                                       | File                    | Status |
| --- | --------------------------------------------------------------------------- | ----------------------- | ------ |
| H-2 | Logger sends `window.location.href` (may contain tokens) to remote endpoint | `lib/logger.ts`         | [x]    |
| H-3 | User email logged on failed login — privacy/GDPR issue                      | `(auth)/login/page.tsx` | [x]    |
| H-5 | Non-idempotent requests (POST/DELETE) retried — duplicate mutations         | `lib/api.ts`            | [x]    |
| R-1 | `"My App"` hardcoded in 3 places — should use `NEXT_PUBLIC_APP_NAME`        | multiple                | [x]    |
| R-2 | `AuthProvider` tightly coupled to singleton `api` — not injectable          | `lib/auth-context.tsx`  | [ ]    |

### MEDIUM

| #    | Issue                                                                 | File                     | Status |
| ---- | --------------------------------------------------------------------- | ------------------------ | ------ |
| M-2  | No `?redirect=` param preserved when redirecting to login             | multiple                 | [ ]    |
| M-3  | Raw `<button>` in `DashboardNavItem` — violates Rule 1                | `dashboard-layout.tsx`   | [ ]    |
| M-5  | `formatDate` silently returns "Invalid Date" for null/undefined       | `lib/utils.ts`           | [x]    |
| M-8  | Double redirect after login (`/` → `/dashboard`), `?redirect` ignored | `(auth)/login/page.tsx`  | [ ]    |
| M-12 | Dead `_isActive` function — Rule 5 violation                          | `(dashboard)/layout.tsx` | [x]    |
| M-1  | `generateRequestId` defined twice (module function + class method)    | `lib/api.ts`             | [x]    |
| M-9  | Body overflow cleanup resets to `""` instead of original value        | `(dashboard)/layout.tsx` | [x]    |

### LOW

| #   | Issue                                                                         | File                   | Status |
| --- | ----------------------------------------------------------------------------- | ---------------------- | ------ |
| L-5 | `API_ENDPOINTS` constants are dead code — never used in `api.ts`              | `lib/constants.ts`     | [x]    |
| L-6 | `formatPrice` hardcodes `en-US` locale                                        | `lib/utils.ts`         | [x]    |
| L-7 | No `metadataBase` or Open Graph in root layout metadata                       | `app/layout.tsx`       | [x]    |
| L-8 | "Member Since" stat always shows `--` — `user.createdAt` available but unused | `dashboard/page.tsx`   | [x]    |
| L-9 | `aria-current="true"` should be `aria-current="page"` on nav buttons          | `dashboard-layout.tsx` | [x]    |

---

## Progress Summary

| Category          | Total  | Done   | Remaining |
| ----------------- | ------ | ------ | --------- |
| Backend CRITICAL  | 5      | 5      | 0         |
| Backend HIGH      | 7      | 5      | 2         |
| Backend MEDIUM    | 11     | 9      | 2         |
| Backend LOW       | 7      | 7      | 0         |
| Backend DI        | 2      | 0      | 2         |
| Frontend CRITICAL | 4      | 3      | 1         |
| Frontend HIGH     | 5      | 4      | 1         |
| Frontend MEDIUM   | 7      | 4      | 3         |
| Frontend LOW      | 5      | 5      | 0         |
| **Total**         | **53** | **42** | **11**    |
