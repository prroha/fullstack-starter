# Live Preview System - Implementation Plan

> **Created**: 2026-02-15
> **Status**: Planning (updated 2026-02-17 — Fastify migration, security hardening, DRY refactoring)
> **Priority**: After app stabilization

---

## Context

Currently, when users select features in the Xitolaunch configurator, they see a **static mockup** — hardcoded React components in `PreviewCanvas` (`studio/web/src/components/preview/preview-canvas.tsx`) that show placeholder cards like "1,234 users" and "Make Payment" buttons that don't actually work. The real module code (ecommerce, LMS, booking, helpdesk, invoicing, events, tasks) already exists with full backend routes, services, Prisma schemas, and frontend pages.

**The goal** is to let users interact with a real working app before they buy — register users, create products, browse courses, submit tickets — powered by the same codebase they'll download. Each preview session gets an isolated PostgreSQL schema that's seeded with demo data and cleaned up on expiry.

**Architecture**: Single preview app with ALL modules loaded + PostgreSQL schema-per-session isolation (Option A). Cost is near-zero on top of existing infrastructure.

---

## Architecture Overview

```
Studio Web (:3002)                    Preview Frontend (:3004)
   |                                        |
   | iframe / "open in new tab"             | (Next.js app w/ all module pages)
   |                                        |
Studio Backend (:3001)            Preview Backend (:3003)
   |                                        |
   | POST /api/preview/sessions             | tenant middleware sets search_path
   | (creates session, triggers             | feature-gate blocks disabled routes
   |  schema provisioning)                  |
   |                                        |
   +------------- PostgreSQL ---------------+
                  |            |
               studio_dev    preview_<token> schemas (temporary)
```

**New deployable units:**

1. **Preview Backend** (`preview/backend/`) — Fastify app loading core + all module routes, with multi-tenant schema isolation
2. **Preview Frontend** (`preview/web/`) — Next.js app loading core + all module pages, with feature-gated navigation

---

## Codebase Findings Summary

Key patterns and constraints discovered during codebase exploration:

### Backend Patterns

1. **Studio backend uses Zod-validated env** (`studio/backend/src/config/env.ts`): All env vars validated at startup via `z.object({...}).safeParse(process.env)`. Preview backend should follow this pattern (not core's `requireEnv`/`optionalEnv` approach).

2. **Studio error handling** (`studio/backend/src/middleware/error.middleware.ts` + `studio/backend/src/utils/errors.ts`):
   - `ApiError` class with static factories: `.badRequest()`, `.unauthorized()`, `.forbidden()`, `.notFound()`, `.conflict()`, `.tooManyRequests()`, `.internal()`, `.validation()`
   - `errorHandler` catches `ApiError`, `PrismaClientKnownRequestError` (P2002 conflict, P2025 not found), `ZodError`
   - Response helpers: `sendSuccess()`, `sendPaginated()`, `sendError()` from `studio/backend/src/utils/response.ts`

3. **Studio auth middleware** (`studio/backend/src/middleware/auth.middleware.ts`):
   - Checks cookie `auth_token` first, then `Authorization: Bearer` header
   - Verifies JWT against `env.JWT_SECRET`, looks up `prisma.studioUser`
   - Attaches `req.user: { id, email, name, role }` to request
   - Exports `authenticate`, `requireAdmin`, `optionalAuth`

4. **Core backend auth** (`core/backend/src/middleware/auth.middleware.ts`):
   - Similar pattern but uses `db.user` (not `studioUser`), checks `accessToken` cookie
   - Attaches both `req.user` (JWT payload) and `req.dbUser` (full DB record)
   - Uses `UserRole` enum from `@prisma/client`
   - **Preview backend needs its OWN auth** that works against the per-schema `User` table

5. **Module services use PLACEHOLDER db operations** — NOT real Prisma calls:
   - Example: `modules/ecommerce/backend/src/services/product.service.ts` has `dbOperations` with `console.log` stubs
   - All real Prisma calls are commented out with `// Replace with: db.product.findMany(...)`
   - Services are singletons via `getProductService()` factory
   - **CRITICAL**: For preview, we need to either make these services work with real Prisma OR write preview-specific service wrappers

6. **Module auth is a placeholder** (`modules/lms/backend/src/middleware/auth.ts`):
   - Just checks `Bearer` header exists, doesn't verify JWT or look up user
   - Comment says: "Replace with core auth middleware"
   - **Preview backend needs real auth that resolves against per-schema User table**

7. **Core route structure** (`core/backend/src/routes/index.ts`):

   ```
   /api/v1/auth, /users, /admin, /search, /contact, /notifications,
   /faqs, /announcements, /settings, /content, /coupons, /orders,
   /admin/orders, /config
   ```

8. **Module route prefixes** (from `module.json` files):
   - Ecommerce: `/api/v1/ecommerce` → products, cart, orders, reviews, customers, sellers
   - LMS: `/api/v1/lms` → courses, lessons, enrollments, quizzes, certificates, instructors
   - Booking: `/api/v1/booking` → services, providers, bookings, schedules, reviews, admin
   - Helpdesk: `/api/v1/helpdesk` → tickets, categories, agents, articles, canned-responses, sla
   - Invoicing: `/api/v1/invoicing` → clients, invoices, invoice-items, payments, tax-rates, recurring
   - Events: `/api/v1/events` → events, venues, registrations, speakers, settings
   - Tasks: `/api/v1/tasks` → projects, tasks, comments, labels, settings

9. **Studio cleanup job** (`studio/backend/src/jobs/cleanup.job.ts`):
   - Uses `node-cron` with `"0 * * * *"` (hourly)
   - Deletes expired preview sessions: `prisma.previewSession.deleteMany({ where: { expiresAt: { lt: new Date() } } })`
   - Started from `studio/backend/src/index.ts` on boot

10. **Schema merger** (`studio/backend/src/utils/schema-merger.ts`):
    - `mergeSchemas(coreBasePath, schemaMappings[], projectRootPath?)`
    - Input: `SchemaMappingConfig { model: string, source: string }` — source is relative path like `"modules/ecommerce/prisma/ecommerce.prisma"`
    - Parses models and enums via regex, deduplicates, outputs single `.prisma` file
    - Also has `validateSchemaCompleteness()` and `generateBaseSchema()`

11. **Validate middleware** (`studio/backend/src/middleware/validate.middleware.ts`):
    - `validateRequest(zodSchema)` — validates `{ body, query, params }` against Zod schema
    - Throws `ApiError.validation(formattedErrors)` on failure

### Frontend Patterns

12. **PreviewSession model** (current, `studio/backend/prisma/schema.prisma`):

    ```prisma
    model PreviewSession {
      id              String   @id @default(cuid())
      sessionToken    String   @unique @default(cuid())
      selectedFeatures String[]
      tier            String
      templateSlug    String?
      createdAt       DateTime @default(now())
      expiresAt       DateTime
      @@index([sessionToken])
      @@index([expiresAt])
      @@map("preview_sessions")
    }
    ```

    No `schemaName`, `schemaStatus`, or `lastAccessedAt` fields yet.

13. **Preview routes** (`studio/backend/src/routes/public/preview.routes.ts`):
    - Token format validation: `/^[a-zA-Z0-9-]{20,}$/`
    - `POST /sessions` creates session with 24h expiry
    - `GET /sessions/:token` returns features/tier (410 if expired)
    - `DELETE /sessions/:token` removes session (graceful if missing)
    - No `PATCH` endpoint yet (needed for heartbeat)

14. **PreviewCanvas** (`studio/web/src/components/preview/preview-canvas.tsx`):
    - Wraps content in `FeatureFlagProvider` → `PreviewContent`
    - Uses `data-theme={theme}` for CSS variable scoping
    - Currently renders static cards with `hasFeature()` checks
    - `PreviewContent` accesses `{ tier, features, hasFeature }` from `useFeatureFlags()`

15. **ConfiguratorProvider** (`studio/web/src/components/configurator/context.tsx`):
    - Uses `useReducer` with typed actions: `SET_DATA`, `SET_TIER`, `SELECT_FEATURE`, `DESELECT_FEATURE`, `TOGGLE_FEATURE`, `SET_FEATURES`, `SET_TEMPLATE`, `SET_RESOLVED`, `SET_PRICING`, `SET_LOADING`, `SET_ERROR`, `RESET`
    - Fetches from `${API_CONFIG.BASE_URL}/features`, `/pricing/tiers`, `/templates`
    - Uses `DependencyResolver` and `PricingCalculator` (memoized)
    - **No `livePreview` state exists yet** — needs new action types

16. **usePreviewSession hook** (`studio/web/src/lib/preview/hooks.ts`):
    - Creates local session immediately, then optionally persists to backend
    - `startSession(tier, features, templateSlug?)` — non-blocking backend call
    - `endSession()` — DELETEs backend session
    - `loadSessionFromToken(token)` — for shared preview links
    - Returns `{ session, isLoading, error, startSession, endSession, loadSessionFromToken }`
    - Session type: `{ id, sessionToken?, tier, features, startedAt, expiresAt? }`

17. **DeviceToolbar** (`studio/web/src/components/preview/device-toolbar.tsx`):
    - Props: `device`, `onDeviceChange`, `theme`, `onThemeChange`, `onReset?`, `onOpenExternal?`
    - Has device toggle (desktop/tablet/mobile), theme toggle (light/dark), reset and external-link buttons
    - **No "Launch Live Preview" button yet**

18. **Preview page** (`studio/web/src/app/(public)/preview/page.tsx`):
    - Reads `?preview=<token>` for shared sessions, or `?tier=X&features=a,b,c` for direct params
    - Renders `DeviceToolbar` + `PreviewCanvas` + `FeaturePanel`
    - Has share button that copies URL with session token
    - Currently shows static mockup only

19. **API config** (`studio/web/src/lib/constants.ts`):
    - `API_CONFIG.BASE_URL` = `process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"`
    - No `PREVIEW_FRONTEND_URL` or `PREVIEW_BACKEND_URL` constants yet

20. **CORS already allows `X-Preview-Session`** header in core backend (`core/backend/src/app.ts` line 58)

---

## Code Reuse Strategy

The preview system is built on top of the existing codebase — it should **import and compose** existing code, not duplicate it. This section defines what to reuse and how.

### Backend: Direct Registration of Existing Route Plugins

The core backend and all 7 module backends export `FastifyPluginAsync` route plugins. The preview backend should **register these directly** — not rewrite them:

```typescript
// preview/backend/src/routes/index.ts
import coreRoutes from "../../../../core/backend/src/routes/index.js";
import ecommerceProductRoutes from "../../../../modules/ecommerce/backend/src/routes/product.routes.js";
import ecommerceCartRoutes from "../../../../modules/ecommerce/backend/src/routes/cart.routes.js";
// ... all module routes

const routes: FastifyPluginAsync = async (fastify) => {
  // Core routes — register the exact same plugin
  await fastify.register(coreRoutes, { prefix: "/v1" });

  // Module routes — register each module's route plugins
  await fastify.register(
    async (ecommerce) => {
      await ecommerce.register(ecommerceProductRoutes, { prefix: "/products" });
      await ecommerce.register(ecommerceCartRoutes, { prefix: "/cart" });
      // ... other ecommerce routes
    },
    { prefix: "/v1/ecommerce" },
  );

  // ... repeat for lms, booking, helpdesk, invoicing, events, tasks
};
```

This works because:

- Route plugins are pure Fastify plugins — they don't hardcode a database client
- After Phase 1's DI refactoring, services accept `req.db` from the tenant middleware
- The preview backend's `onRequest` hooks (tenant, feature gate, sandbox) run before route handlers
- **Zero route duplication** — same code runs in standalone module and preview

### Backend: Core Services with DI

Core services (auth, user, notification, audit, etc.) are currently singletons using a global `db` import. To reuse them in preview:

1. **Refactor core services** to accept `PrismaClient` via constructor (same DI pattern as module services)
2. **Preview route handlers** instantiate services with `req.db` from tenant middleware
3. **Core backend** continues using the global `db` singleton via a compatibility factory

```typescript
// core/backend/src/services/auth.service.ts (refactored)
export class AuthService {
  constructor(private db: PrismaClient) {}
  async register(data: RegisterInput) {
    /* uses this.db */
  }
  async login(data: LoginInput) {
    /* uses this.db */
  }
}
export function createAuthService(db: PrismaClient): AuthService {
  return new AuthService(db);
}

// Backward-compatible singleton for core backend (keeps existing imports working)
import { db } from "../lib/db.js";
let instance: AuthService | null = null;
export function getAuthService(): AuthService {
  if (!instance) instance = new AuthService(db);
  return instance;
}
```

### Backend: Core Auth Middleware with DI

The core auth middleware (`core/backend/src/middleware/auth.middleware.ts`) verifies JWTs and looks up users. Preview needs the same logic against the per-schema `User` table:

```typescript
// core/backend/src/middleware/auth.middleware.ts (refactored)
// Accept optional db parameter — defaults to global db for backward compatibility
export function createAuthMiddleware(getDb?: (req: FastifyRequest) => PrismaClient) {
  return async function authenticate(req: FastifyRequest, _reply: FastifyReply) {
    const token = req.cookies?.accessToken || extractBearerToken(req.headers.authorization);
    if (!token) throw ApiError.unauthorized("No token provided");

    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] });
    const db = getDb ? getDb(req) : globalDb;
    const user = await db.user.findUnique({ where: { id: payload.userId } });
    if (!user) throw ApiError.unauthorized("User not found");

    req.user = payload;
    req.dbUser = user;
  };
}

// Backward-compatible exports for core backend
export const authenticate = createAuthMiddleware();
export const requireAdmin = /* unchanged */;
export const optionalAuth = /* unchanged */;

// Preview backend uses:
const previewAuth = createAuthMiddleware((req) => req.db!);
```

### Backend: Module Auth Middleware

Module auth middleware files (`modules/*/backend/src/middleware/auth.ts`) are currently placeholders. Refactor them to delegate to the core auth middleware factory:

```typescript
// modules/ecommerce/backend/src/middleware/auth.ts (refactored)
import { createAuthMiddleware } from "../../../../core/backend/src/middleware/auth.middleware.js";

// In standalone mode: uses global db
export const authMiddleware = createAuthMiddleware();

// For preview: the preview backend overrides this at registration time
// by using createAuthMiddleware((req) => req.db!) as a scope-level hook
```

### Frontend: Reuse Core Pages & Components

The preview frontend (`preview/web/`) should reuse as much as possible from `core/web/`:

**Directly reusable (import via path aliases)**:

- All UI components: `@/components/ui/*`, `@/components/feedback/*`, `@/components/layout/*`, `@/components/forms/*`, `@/components/shared/*`
- Auth context: `@/lib/auth-context.tsx` (with preview API client swap)
- Hooks: `@/lib/hooks/*` (`useDebounce`, `useAsync`, etc.)
- Utilities: `@/lib/utils.ts` (`cn()`, `formatDate()`, `formatPrice()`)
- Layout components: `DashboardLayout`, `DashboardSidebar`, `DashboardHeader`
- Auth pages: Login, Register, Forgot Password (same UI, different API base)
- Public pages: FAQ, Contact, About (if applicable to preview)

**Module pages**: Import module page components from `modules/*/web/src/` with preview API client:

```typescript
// preview/web/src/app/(dashboard)/products/page.tsx
// Re-exports the module page with preview context
export { default } from "../../../../../modules/ecommerce/web/src/app/(dashboard)/products/page";
```

Or use Next.js rewrites in `next.config.ts` to point to module page directories.

**Preview-specific (new)**:

- Preview banner component (timer, "back to configure" link)
- Preview navigation wrapper (feature-gated nav items)
- Preview API client (`X-Preview-Session` header injection)
- Preview context provider (session info, enabled features)

### Frontend: Module Components & Libraries

Module-specific libraries should be imported directly:

- `modules/*/web/src/lib/*/types.ts` — domain types
- `modules/*/web/src/lib/*/api.ts` — API client functions (need preview base URL override)
- `modules/*/web/src/lib/*/formatters.ts` — formatting helpers
- `modules/*/web/src/components/*` — domain components (they compose core UI)

### What's NOT Reused (and why)

| Item                     | Why new code is needed                                                |
| ------------------------ | --------------------------------------------------------------------- |
| Preview API client       | Must inject `X-Preview-Session` header on every request               |
| Preview context provider | Provides session info, enabled features, expiry timer — doesn't exist |
| Preview banner           | UI element unique to preview mode                                     |
| Preview navigation       | Feature-gated nav filtering — wraps but differs from core nav         |
| Sandbox middleware       | Unique to preview — stubs external services                           |
| Tenant middleware        | Unique to preview — schema-per-session routing                        |
| Schema manager service   | Unique to preview — CREATE/DROP SCHEMA lifecycle                      |
| Session cache            | Unique to preview — caches studio API responses                       |

### Reuse Summary

| Layer               | Reused from                 | New code                      | Reuse % |
| ------------------- | --------------------------- | ----------------------------- | ------- |
| Backend routes      | core + 7 modules (direct)   | 0 route files                 | ~100%   |
| Backend services    | core + 7 modules (DI)       | 0 service files               | ~100%   |
| Backend middleware  | core auth (DI factory)      | tenant, sandbox, feature-gate | ~60%    |
| Backend utilities   | shared package              | session cache, schema manager | ~70%    |
| Frontend components | core UI + module components | preview banner, nav           | ~95%    |
| Frontend pages      | core + module pages         | preview wrapper pages         | ~80%    |
| Frontend utilities  | core hooks + utils          | preview API client, context   | ~80%    |

---

## Phase 0: Shared Backend Utilities

**Goal**: Extract common backend utilities (ApiError, response helpers, error handler, validation middleware, HMAC signing) into a shared package used by studio, preview, and eventually core backends. Eliminates triple-copy of identical code.
**Dependencies**: None
**Complexity**: Low (1 day)

### Files to Create

| File                                        | Purpose                                                           |
| ------------------------------------------- | ----------------------------------------------------------------- |
| `shared/backend-utils/src/errors.ts`        | `ApiError` class (consolidated from studio + core)                |
| `shared/backend-utils/src/response.ts`      | `sendSuccess`, `sendPaginated`, `sendError` helpers               |
| `shared/backend-utils/src/error-handler.ts` | Fastify `setErrorHandler` (ApiError, Prisma, Zod)                 |
| `shared/backend-utils/src/validate.ts`      | `validateRequest(zodSchema)` preHandler factory                   |
| `shared/backend-utils/src/hmac.ts`          | `signRequest()` / `verifyInternalRequest()` for internal API auth |
| `shared/backend-utils/src/index.ts`         | Barrel export                                                     |
| `shared/backend-utils/package.json`         | `{ "name": "@shared/backend-utils", "main": "src/index.ts" }`     |
| `shared/backend-utils/tsconfig.json`        | TypeScript config                                                 |

### Files to Modify

| File                                                   | Change                                              |
| ------------------------------------------------------ | --------------------------------------------------- |
| `studio/backend/src/utils/errors.ts`                   | Replace with re-export from `@shared/backend-utils` |
| `studio/backend/src/utils/response.ts`                 | Replace with re-export from `@shared/backend-utils` |
| `studio/backend/src/middleware/error.middleware.ts`    | Replace with re-export from `@shared/backend-utils` |
| `studio/backend/src/middleware/validate.middleware.ts` | Replace with re-export from `@shared/backend-utils` |
| `studio/backend/package.json`                          | Add workspace dependency on `@shared/backend-utils` |
| Root `package.json` or `pnpm-workspace.yaml`           | Add `shared/backend-utils` to workspace packages    |

### Key Details

**Consolidating the two ApiError implementations**:

- Core: `new ApiError(statusCode, message, code, isOperational)` — statusCode first
- Studio: `new ApiError(message, statusCode, code, details)` — message first
- Shared: Use studio's API (message first) as it's more ergonomic. Add `isOperational` as optional 5th param for core compatibility.
- Core backend can migrate to the shared version later (or re-export with adapter).

**Package resolution**: Use TypeScript path aliases in `tsconfig.json`:

```json
{ "paths": { "@shared/backend-utils": ["../../shared/backend-utils/src"] } }
```

Or use workspace protocol in `package.json`:

```json
{ "dependencies": { "@shared/backend-utils": "workspace:*" } }
```

---

## Phase 1: Preview Backend Setup

**Goal**: New Fastify app that loads ALL core + module backend routes behind a unified API.
**Dependencies**: None (foundational)
**Complexity**: Medium-High (3-4 days)

### Files to Create

| File                                                   | Purpose                                                                  |
| ------------------------------------------------------ | ------------------------------------------------------------------------ |
| `preview/backend/src/index.ts`                         | Fastify entry point, port 3003 (with graceful shutdown)                  |
| `preview/backend/src/config/env.ts`                    | Zod-validated env config (follow studio pattern)                         |
| `preview/backend/src/config/db.ts`                     | PrismaClient-per-schema factory with LRU cache                           |
| `preview/backend/src/config/session-cache.ts`          | In-memory session cache with 60s TTL                                     |
| `preview/backend/src/routes/index.ts`                  | Registers core + module route plugins directly (see Code Reuse Strategy) |
| `preview/backend/src/middleware/tenant.middleware.ts`  | Extracts session token, resolves schema, attaches `req.db`               |
| `preview/backend/src/middleware/sandbox.middleware.ts` | Stubs external services (email, payments, storage) from day one          |
| `preview/backend/package.json`                         | Superset of core + all module dependencies                               |
| `preview/backend/tsconfig.json`                        | TypeScript config with path aliases to core + modules                    |
| `preview/backend/prisma/schema.prisma`                 | Pre-merged schema (core + all modules combined)                          |
| `preview/backend/.env.example`                         | Template env file                                                        |

### Files to Modify (DI Refactoring — see Code Reuse Strategy)

| Category                    | Files (~count) | Change                                                                              |
| --------------------------- | -------------- | ----------------------------------------------------------------------------------- |
| Core services               | ~8 files       | Add `constructor(private db: PrismaClient)`, keep backward-compat singleton factory |
| Core auth middleware        | 1 file         | Extract `createAuthMiddleware(getDb?)` factory, keep existing `authenticate` export |
| Module services (7 modules) | ~48 files      | Replace `dbOperations` stubs with real Prisma calls, accept `db` via constructor DI |
| Module auth middleware      | 7 files        | Delegate to core's `createAuthMiddleware()` factory                                 |
| Module route files          | ~48 files      | Change `getXxxService()` to `createXxxService(req.db!)` per-request                 |

**Note**: The ~48 module service refactors replace non-functional stubs with real Prisma calls. This work is required regardless of the preview system — modules cannot function without it. The DI pattern simply ensures preview compatibility.

### Key Details

**Plugin registration chain** (modeled after `studio/backend/src/index.ts` simplicity, not core's full chain):

```typescript
// preview/backend/src/index.ts
import Fastify from "fastify";
import fastifyHelmet from "@fastify/helmet";
import fastifyCors from "@fastify/cors";
import fastifyCookie from "@fastify/cookie";
import fastifyFormbody from "@fastify/formbody";
import fastifyRateLimit from "@fastify/rate-limit";

// Structured logging via Pino (built into Fastify)
const app = Fastify({
  logger: {
    level: env.NODE_ENV === "production" ? "info" : "debug",
    ...(env.NODE_ENV === "development" && {
      transport: { target: "pino-pretty" },
    }),
  },
  trustProxy: true,
  requestId: true, // auto-generated request correlation IDs
  genReqId: () => crypto.randomUUID(),
});

// Security plugins
await app.register(fastifyHelmet, {
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
});
await app.register(fastifyCors, {
  origin: env.CORS_ORIGIN.split(",").map((s) => s.trim()),
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "X-Preview-Session"],
});
await app.register(fastifyCookie);
await app.register(fastifyFormbody);

// Rate limiting per session token (prevents abuse within a session)
await app.register(fastifyRateLimit, {
  max: 200,
  timeWindow: "1 minute",
  keyGenerator: (req) => (req.headers["x-preview-session"] as string) || req.ip,
});

// CSRF note: The required X-Preview-Session custom header on every request
// serves as CSRF protection — browsers won't send custom headers cross-origin
// without CORS preflight. This is explicitly our CSRF mitigation strategy.

// Sandbox hook — stubs external services (email, payments) from day one
// Registered BEFORE route handlers so all requests pass through it
app.addHook("onRequest", sandboxMiddleware);

// Tenant hook — extracts session token, resolves schema, attaches req.db
app.addHook("onRequest", tenantMiddleware);

// Feature gate hook — blocks routes for disabled features
app.addHook("onRequest", featureGateMiddleware);

app.setErrorHandler(errorHandler);

// Health check with DB connectivity verification
app.get("/health", async (_req, reply) => {
  try {
    await getAdminClient().$queryRaw`SELECT 1`;
    return reply.send({ status: "ok", timestamp: new Date().toISOString() });
  } catch {
    return reply
      .code(503)
      .send({ status: "unhealthy", timestamp: new Date().toISOString() });
  }
});

// Core + module routes (registered as Fastify plugins)
await app.register(routes, { prefix: "/api" });

// Internal routes (Phase 3) — secured by HMAC signature verification
await app.register(internalRoutes, { prefix: "/internal" });

app.setNotFoundHandler((_req, reply) => {
  reply
    .code(404)
    .send({
      success: false,
      error: { message: "Route not found", code: "NOT_FOUND" },
    });
});

await app.listen({ port: Number(env.PORT), host: "0.0.0.0" });

// Graceful shutdown — drain connections and clean up PrismaClient cache
const shutdown = async (signal: string) => {
  app.log.info(`Received ${signal}, shutting down gracefully...`);
  const forceExit = setTimeout(() => process.exit(1), 10_000);
  forceExit.unref();
  await app.close();
  await disconnectAllClients(); // drain PrismaClient cache
  clearTimeout(forceExit);
  process.exit(0);
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
```

**Env config** (follow `studio/backend/src/config/env.ts` Zod pattern):

```typescript
const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.string().default("3003"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  CORS_ORIGIN: z
    .string()
    .default("http://localhost:3002,http://localhost:3004"),
  JWT_SECRET: z
    .string()
    .min(32)
    .refine((val) => !val.includes("change-me") && !val.includes("min-32"), {
      message: "JWT_SECRET must be changed from default value",
    }),
  // Preview JWTs include a "preview" audience claim to prevent cross-service usage
  JWT_AUDIENCE: z.string().default("preview"),
  STUDIO_API_URL: z.string().default("http://localhost:3001/api"),
  MAX_PREVIEW_SCHEMAS: z.coerce.number().default(50),
  MAX_SESSIONS_PER_IP: z.coerce.number().default(5),
  PREVIEW_TTL_HOURS: z.coerce.number().default(4),
  PRISMA_CONNECTION_LIMIT: z.coerce.number().default(2),
  // HMAC secret for studio↔preview internal API signing
  // No default in production — fails loudly if unset
  INTERNAL_API_SECRET: z
    .string()
    .min(64)
    .default(
      process.env.NODE_ENV === "development" ? "dev-" + "x".repeat(61) : "",
    ),
});
```

**Route loading approach — Dependency Injection into module services (Option B)**:

Module services currently use placeholder `dbOperations` stubs with `console.log` and commented-out Prisma calls (Finding #5). These stubs must be replaced with real Prisma calls regardless — they are non-functional as shipped. Rather than duplicating all ~48 route files and ~48 service files in the preview backend, we refactor module services to accept a `PrismaClient` via constructor injection:

```typescript
// Before (current placeholder pattern in ALL module services):
const dbOperations = {
  async findProducts(filters) { console.log('[DB]...'); return { items: [], total: 0 }; }
};
export class ProductService {
  async listProducts(filters) { return dbOperations.findProducts(filters); }
}
let instance: ProductService | null = null;
export function getProductService() { if (!instance) instance = new ProductService(); return instance; }

// After (DI refactored — real Prisma calls):
export class ProductService {
  constructor(private db: PrismaClient) {}
  async listProducts(filters: ProductFilters) {
    const [items, total] = await Promise.all([
      this.db.product.findMany({ where: { ... }, skip, take }),
      this.db.product.count({ where: { ... } }),
    ]);
    return { items, pagination: { ... } };
  }
}
export function createProductService(db: PrismaClient): ProductService {
  return new ProductService(db);
}
```

Route files change minimally — just how the service is instantiated:

```typescript
// In route handler:
const service = createProductService(req.db!); // per-request with tenant's db
```

**Why Option B over Option A (rewrite all routes)**:

- **No duplication**: Same service code runs in standalone module and preview
- **~96 fewer files**: No preview-specific route/service copies to maintain
- **No drift risk**: Module changes automatically work in preview
- **Necessary anyway**: Module stubs must be replaced with real Prisma before they have any value to users
- **Cleaner module code**: DI is the correct pattern for testable services

**Auth middleware** follows the same DI approach — refactor `modules/*/backend/src/middleware/auth.ts` to accept an injected `db` and verify JWTs properly, replacing the current placeholder that only checks if a Bearer header exists.

**Merged Prisma schema**: Use `schema-merger.ts` at build time:

```typescript
import { mergeSchemas } from "../../studio/backend/src/utils/schema-merger.ts";

const schemaMappings = [
  { model: "Ecommerce", source: "modules/ecommerce/prisma/ecommerce.prisma" },
  { model: "LMS", source: "modules/lms/prisma/lms.prisma" },
  { model: "Booking", source: "modules/booking/prisma/booking.prisma" },
  { model: "Helpdesk", source: "modules/helpdesk/prisma/helpdesk.prisma" },
  { model: "Invoicing", source: "modules/invoicing/prisma/invoicing.prisma" },
  { model: "Events", source: "modules/events/prisma/events.prisma" },
  { model: "Tasks", source: "modules/tasks/prisma/tasks.prisma" },
];

const result = await mergeSchemas("core/", schemaMappings, projectRoot);
// result.schema → write to preview/backend/prisma/schema.prisma
// result.models → validate completeness
```

**Build script** (`preview/backend/package.json`):

```json
{
  "scripts": {
    "prebuild": "node scripts/merge-schema.ts && prisma generate",
    "build": "tsc",
    "dev": "tsx watch src/index.ts",
    "db:generate": "prisma generate",
    "migration:compile": "prisma migrate diff --from-empty --to-schema-datamodel ./prisma/schema.prisma --script > src/migration.sql"
  }
}
```

---

## Phase 2: Multi-Tenant Schema Isolation

**Goal**: Each preview session gets its own PostgreSQL schema. All queries are scoped to that schema.
**Dependencies**: Phase 1
**Complexity**: High (4-5 days) — highest risk phase

### Files to Create

| File                                                     | Purpose                                                  |
| -------------------------------------------------------- | -------------------------------------------------------- |
| `preview/backend/src/services/schema-manager.service.ts` | CREATE/DROP SCHEMA, run migration SQL, call seeders      |
| `preview/backend/src/middleware/tenant.middleware.ts`    | Extract session token → resolve schema → attach `req.db` |
| `preview/backend/src/utils/schema-name.ts`               | Validate/sanitize schema names (`preview_<cuid>`)        |

### Key Details

**Schema naming**: `preview_<sessionToken>` — sanitized to `[a-z0-9_]` only, max 63 chars (PostgreSQL identifier limit).

```typescript
// preview/backend/src/utils/schema-name.ts
const SCHEMA_PREFIX = "preview_";
const VALID_CHARS = /^[a-z0-9]+$/;

export function toSchemaName(sessionToken: string): string {
  const sanitized = sessionToken.toLowerCase().replace(/[^a-z0-9]/g, "");
  const name = `${SCHEMA_PREFIX}${sanitized}`;
  if (name.length > 63) throw new Error("Schema name too long");
  return name;
}

export function isValidSchemaName(name: string): boolean {
  return (
    name.startsWith(SCHEMA_PREFIX) &&
    VALID_CHARS.test(name.slice(SCHEMA_PREFIX.length))
  );
}
```

**Schema provisioning flow**:

```
Studio backend: POST /api/preview/sessions { provisionSchema: true }
  → Create PreviewSession record (schemaStatus = PROVISIONING)
  → Call preview backend: POST /internal/schemas/provision
    → CREATE SCHEMA IF NOT EXISTS preview_<token>
    → SET search_path TO preview_<token>
    → Execute pre-compiled migration SQL (all tables)
    → Run seed function for selected features
    → Return { status: 'ready' }
  → Update schemaStatus = READY, return previewUrl
```

**Migration strategy**: Pre-compile migration SQL once at build time:

```bash
prisma migrate diff --from-empty --to-schema-datamodel ./prisma/schema.prisma --script > src/migration.sql
```

Then execute via `$executeRawUnsafe(migrationSQL)` within the target schema. Creates all tables in <1 second.

**Per-request schema routing — PrismaClient-per-schema with LRU eviction**:

```typescript
// preview/backend/src/config/db.ts
import { PrismaClient } from "@prisma/client";
import { env } from "./env.js";

interface CachedClient {
  client: PrismaClient;
  lastAccessedAt: number;
}

const clientCache = new Map<string, CachedClient>();
const IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const MAX_CACHED_CLIENTS = env.MAX_PREVIEW_SCHEMAS; // hard cap

// Admin client for DDL operations (CREATE/DROP SCHEMA) — singleton
let adminClient: PrismaClient | null = null;
export function getAdminClient(): PrismaClient {
  if (!adminClient) {
    adminClient = new PrismaClient({
      datasources: { db: { url: env.DATABASE_URL } },
      log: ["error"],
    });
  }
  return adminClient;
}

export function getClientForSchema(schemaName: string): PrismaClient {
  const cached = clientCache.get(schemaName);
  if (cached) {
    cached.lastAccessedAt = Date.now();
    return cached.client;
  }

  // LRU eviction: if at capacity, evict the least recently accessed client
  if (clientCache.size >= MAX_CACHED_CLIENTS) {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    for (const [key, val] of clientCache) {
      if (val.lastAccessedAt < oldestTime) {
        oldestTime = val.lastAccessedAt;
        oldestKey = key;
      }
    }
    if (oldestKey) {
      const evicted = clientCache.get(oldestKey);
      clientCache.delete(oldestKey);
      evicted?.client.$disconnect().catch(() => {}); // fire-and-forget
    }
  }

  const baseUrl = env.DATABASE_URL.split("?")[0];
  const url = `${baseUrl}?schema=${schemaName}&connection_limit=${env.PRISMA_CONNECTION_LIMIT}`;

  const client = new PrismaClient({
    datasources: { db: { url } },
    log: env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  clientCache.set(schemaName, { client, lastAccessedAt: Date.now() });
  return client;
}

export async function evictClient(schemaName: string): Promise<void> {
  const cached = clientCache.get(schemaName);
  if (cached) {
    clientCache.delete(schemaName);
    await cached.client.$disconnect().catch(() => {});
  }
}

export function getActiveSchemaCount(): number {
  return clientCache.size;
}

// Graceful shutdown: disconnect ALL cached clients
export async function disconnectAllClients(): Promise<void> {
  const disconnects = [...clientCache.values()].map((c) =>
    c.client.$disconnect().catch(() => {}),
  );
  await Promise.allSettled(disconnects);
  clientCache.clear();
  if (adminClient) {
    await adminClient.$disconnect().catch(() => {});
    adminClient = null;
  }
}

// Periodic cleanup of idle clients (non-blocking, error-safe)
let cleanupTimer: NodeJS.Timeout | null = null;
export function startClientCleanup(): void {
  cleanupTimer = setInterval(async () => {
    const now = Date.now();
    const toEvict: string[] = [];
    for (const [name, cached] of clientCache) {
      if (now - cached.lastAccessedAt > IDLE_TIMEOUT_MS) {
        toEvict.push(name);
      }
    }
    // Disconnect in parallel, not sequentially
    await Promise.allSettled(
      toEvict.map(async (name) => {
        const cached = clientCache.get(name);
        if (cached) {
          clientCache.delete(name);
          await cached.client.$disconnect();
        }
      }),
    );
  }, 60_000);
  cleanupTimer.unref(); // don't prevent process exit
}

export function stopClientCleanup(): void {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}
```

**Session cache** — avoid calling studio backend on every request:

```typescript
// preview/backend/src/config/session-cache.ts
interface CachedSession {
  token: string;
  schemaName: string;
  features: string[];
  tier: string;
  schemaStatus: string;
  expiresAt: Date;
  cachedAt: number;
}

const sessionCache = new Map<string, CachedSession>();
const SESSION_CACHE_TTL_MS = 60_000; // 60 seconds

export function getCachedSession(token: string): CachedSession | null {
  const cached = sessionCache.get(token);
  if (!cached) return null;
  if (Date.now() - cached.cachedAt > SESSION_CACHE_TTL_MS) {
    sessionCache.delete(token);
    return null; // expired cache entry
  }
  return cached;
}

export function cacheSession(session: CachedSession): void {
  sessionCache.set(session.token, { ...session, cachedAt: Date.now() });
}

export function invalidateSession(token: string): void {
  sessionCache.delete(token);
}

export function clearSessionCache(): void {
  sessionCache.clear();
}
```

The tenant middleware uses this cache: on cache hit, skip the studio API call. On cache miss, fetch from studio and cache the result. Studio backend can also push invalidations via the internal API (e.g., on session deletion).

**Tenant middleware** (Fastify `onRequest` hook with session caching and circuit breaker):

```typescript
// preview/backend/src/middleware/tenant.middleware.ts
import { FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient } from "@prisma/client";
import { getClientForSchema } from "../config/db.js";
import { toSchemaName } from "../utils/schema-name.js";
import { getCachedSession, cacheSession } from "../config/session-cache.js";
import { ApiError } from "@shared/backend-utils";
import { env } from "../config/env.js";

// Augment Fastify request type
declare module "fastify" {
  interface FastifyRequest {
    db?: PrismaClient;
    previewSession?: {
      token: string;
      schemaName: string;
      features: string[];
      tier: string;
    };
    // Sandbox service mocks (injected by sandbox middleware)
    emailService?: typeof import("../middleware/sandbox.middleware.js").mockEmailService;
    paymentService?: typeof import("../middleware/sandbox.middleware.js").mockPaymentService;
    storageService?: typeof import("../middleware/sandbox.middleware.js").mockStorageService;
  }
}

// Simple circuit breaker for studio API calls
let consecutiveFailures = 0;
let circuitOpenUntil = 0;
const CIRCUIT_THRESHOLD = 5; // failures before opening
const CIRCUIT_RESET_MS = 30_000; // 30 seconds in open state

async function fetchSessionFromStudio(token: string): Promise<CachedSession> {
  if (Date.now() < circuitOpenUntil) {
    throw ApiError.internal("Studio backend temporarily unavailable");
  }

  try {
    const res = await fetch(`${env.STUDIO_API_URL}/preview/sessions/${token}`);
    if (!res.ok) {
      if (res.status === 404 || res.status === 410) {
        throw ApiError.unauthorized("Preview session not found or expired");
      }
      throw new Error(`Studio returned ${res.status}`);
    }
    consecutiveFailures = 0; // reset on success
    const { data } = await res.json();
    return {
      token,
      schemaName: data.schemaName,
      features: data.selectedFeatures,
      tier: data.tier,
      schemaStatus: data.schemaStatus,
      expiresAt: new Date(data.expiresAt),
    };
  } catch (error) {
    if (error instanceof ApiError) throw error; // don't count app errors
    consecutiveFailures++;
    if (consecutiveFailures >= CIRCUIT_THRESHOLD) {
      circuitOpenUntil = Date.now() + CIRCUIT_RESET_MS;
    }
    throw error;
  }
}

export async function tenantMiddleware(
  req: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  // Skip for health check and internal routes
  if (req.url === "/health" || req.url.startsWith("/internal")) {
    return;
  }

  const sessionToken = req.headers["x-preview-session"] as string;
  if (!sessionToken) {
    throw ApiError.unauthorized("X-Preview-Session header required");
  }

  // Session cache: avoid studio API call on every request (60s TTL)
  let session = getCachedSession(sessionToken);
  if (!session) {
    session = await fetchSessionFromStudio(sessionToken);
    cacheSession(session);
  }

  if (session.schemaStatus !== "READY") {
    throw ApiError.badRequest("Preview schema is not ready yet");
  }

  req.db = getClientForSchema(session.schemaName);
  req.previewSession = {
    token: sessionToken,
    schemaName: session.schemaName,
    features: session.features,
    tier: session.tier,
  };
}
```

**Module services use `req.db` via DI**: With Option B (see Phase 1), module services accept a `PrismaClient` via constructor. Route handlers create service instances per-request: `const service = createProductService(req.db!)`. This uses the tenant's per-schema database automatically — no preview-specific route files needed.

**Connection management**:

- `connection_limit=2` per PrismaClient in URL
- Max 50 concurrent schemas = 100 PostgreSQL connections
- Typical PostgreSQL `max_connections` = 100-200
- Idle clients evicted after 10 minutes
- Monitor via `/internal/metrics`

**Schema cleanup**:

```sql
DROP SCHEMA IF EXISTS preview_<token> CASCADE;
```

Called on session expiry or manual deletion. Also disconnects and removes the cached PrismaClient via `evictClient()`.

---

## Phase 3: Session Lifecycle Management

**Goal**: End-to-end session creation, provisioning, heartbeat, and cleanup.
**Dependencies**: Phase 1, Phase 2
**Complexity**: Medium (2-3 days)

### Files to Modify

| File                                                 | Current State                                                                      | Change                                                                                     |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `studio/backend/prisma/schema.prisma`                | PreviewSession has 7 fields, no schema tracking                                    | Add `schemaName`, `schemaStatus`, `lastAccessedAt` fields + enum                           |
| `studio/backend/src/routes/public/preview.routes.ts` | POST creates session, GET reads, DELETE removes. No PATCH. Rate limited 100/hr/IP. | Add `provisionSchema` flag to POST, add PATCH for heartbeat, add polling for schema status |
| `studio/backend/src/jobs/cleanup.job.ts`             | Hourly cron deletes expired sessions from DB only                                  | Extend to call preview backend to DROP SCHEMA before deleting record                       |

### Files to Create

| File                                                          | Purpose                                        |
| ------------------------------------------------------------- | ---------------------------------------------- |
| `preview/backend/src/routes/internal.routes.ts`               | Internal API: provision, drop, health, metrics |
| `studio/backend/src/services/preview-orchestrator.service.ts` | Orchestrate lifecycle from studio side         |

### Key Details

**PreviewSession model changes** (in `studio/backend/prisma/schema.prisma`):

```prisma
model PreviewSession {
  id                String               @id @default(cuid())
  sessionToken      String               @unique @default(cuid())
  selectedFeatures  String[]
  tier              String
  templateSlug      String?

  // New fields for live preview
  schemaName        String?              // e.g., "preview_clx123abc"
  schemaStatus      PreviewSchemaStatus  @default(PENDING)
  lastAccessedAt    DateTime             @default(now())

  createdAt         DateTime             @default(now())
  expiresAt         DateTime

  @@index([sessionToken])
  @@index([expiresAt])
  @@index([schemaStatus])
  @@map("preview_sessions")
}

enum PreviewSchemaStatus {
  PENDING
  PROVISIONING
  READY
  FAILED
  DROPPED
}
```

**Extended preview routes** (modify `studio/backend/src/routes/public/preview.routes.ts`):

```typescript
// Existing POST /sessions gets new optional field:
const createPreviewSessionSchema = z.object({
  body: z.object({
    selectedFeatures: z.array(z.string()),
    tier: z.string(),
    templateSlug: z.string().optional(),
    provisionSchema: z.boolean().optional(), // NEW
  }),
});

// If provisionSchema: true → call preview backend to provision
// Update schemaStatus through lifecycle

// NEW: PATCH /sessions/:token — heartbeat
fastify.patch(
  "/sessions/:token",
  { preHandler: [validateTokenFormat] },
  async (req, reply) => {
    // Update lastAccessedAt
    // Return current schemaStatus for polling
  },
);

// NEW: GET /sessions/:token/status — lightweight status check for polling
fastify.get(
  "/sessions/:token/status",
  { preHandler: [validateTokenFormat] },
  async (req, reply) => {
    // Return { schemaStatus, previewUrl } only
  },
);
```

**Heartbeat**: Preview frontend sends `PATCH /api/preview/sessions/:token` every 5 minutes to update `lastAccessedAt`. Sessions idle for 30+ minutes are cleaned up even before TTL.

**Cleanup job extension** (in `studio/backend/src/jobs/cleanup.job.ts`):

```typescript
// Current: just deletes expired sessions
// Extended:
async function cleanupExpiredSessions(): Promise<number> {
  // 1. Find sessions where expiresAt < now() AND schemaStatus IN ('READY', 'PROVISIONING')
  const expiredWithSchemas = await prisma.previewSession.findMany({
    where: {
      expiresAt: { lt: new Date() },
      schemaStatus: { in: ["READY", "PROVISIONING"] },
    },
  });

  // 2. For each: call preview backend DELETE /internal/schemas/:name
  for (const session of expiredWithSchemas) {
    if (session.schemaName) {
      await fetch(
        `${env.PREVIEW_BACKEND_URL}/internal/schemas/${session.schemaName}`,
        {
          method: "DELETE",
          headers: { "X-Internal-Secret": env.INTERNAL_API_SECRET },
        },
      ).catch(() => {}); // Best effort
    }
  }

  // 3. Delete all expired sessions
  const result = await prisma.previewSession.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

  // 4. Also clean idle sessions (lastAccessedAt > 30 min ago, not yet expired)
  const idleCutoff = new Date(Date.now() - 30 * 60 * 1000);
  // ... similar pattern

  return result.count;
}
```

**New env vars for studio backend**:

```
PREVIEW_BACKEND_URL=http://localhost:3003
INTERNAL_API_SECRET=dev-internal-secret
```

**Internal API** (preview backend, secured by HMAC request signing):

```
POST   /internal/schemas/provision   { sessionToken, features, tier }
DELETE /internal/schemas/:name
POST   /internal/sessions/invalidate { sessionToken }
GET    /internal/health
GET    /internal/metrics             { activeSchemas, connectionPool, memory, uptime }
```

**HMAC request signing** (replaces static shared secret):

```typescript
// shared/backend-utils/src/hmac.ts
import crypto from "node:crypto";

// Sign: studio backend signs outgoing requests
export function signRequest(
  secret: string,
  method: string,
  path: string,
  body: string,
  timestamp: number,
): string {
  const payload = `${method}:${path}:${body}:${timestamp}`;
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

// Verify: preview backend verifies incoming requests
export function verifyInternalRequest(
  req: FastifyRequest,
  _reply: FastifyReply,
): void {
  const signature = req.headers["x-internal-signature"] as string;
  const timestamp = Number(req.headers["x-internal-timestamp"]);

  if (!signature || !timestamp)
    throw ApiError.unauthorized("Missing internal auth headers");

  // Reject requests older than 5 minutes (replay protection)
  if (Math.abs(Date.now() - timestamp) > 5 * 60 * 1000) {
    throw ApiError.unauthorized("Request expired");
  }

  const body = JSON.stringify(req.body || {});
  const expected = signRequest(
    env.INTERNAL_API_SECRET,
    req.method,
    req.url,
    body,
    timestamp,
  );

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    throw ApiError.unauthorized("Invalid signature");
  }
}
```

**Schema provisioning with rollback on failure**:

```typescript
// preview/backend/src/services/schema-manager.service.ts
async function provisionSchema(
  sessionToken: string,
  features: string[],
  tier: string,
): Promise<void> {
  const schemaName = toSchemaName(sessionToken);

  // Double-validate schema name at point of SQL execution
  if (!/^preview_[a-z0-9]{20,50}$/.test(schemaName)) {
    throw ApiError.badRequest("Invalid schema name");
  }

  const admin = getAdminClient();
  try {
    // Use Prisma.$queryRawUnsafe with validated, sanitized schema name
    await admin.$executeRawUnsafe(
      `CREATE SCHEMA IF NOT EXISTS "${schemaName}"`,
    );
    await admin.$executeRawUnsafe(`SET search_path TO "${schemaName}"`);
    await admin.$executeRawUnsafe(migrationSQL); // pre-compiled at build time
    await admin.$executeRawUnsafe(`SET search_path TO "public"`); // reset

    // Seed with per-schema client
    const db = getClientForSchema(schemaName);
    await seedPreviewSchema(db, features);
  } catch (error) {
    // Rollback: drop the partially-created schema
    await admin
      .$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`)
      .catch(() => {});
    await evictClient(schemaName);
    throw error; // re-throw so caller can set schemaStatus = FAILED
  }
}
```

**Stuck provisioning cleanup**: The cleanup job also handles `PROVISIONING` schemas older than 5 minutes (stuck due to crashes).

---

## Phase 4: Feature Gate Middleware

**Goal**: Routes are conditionally accessible based on session's selected features.
**Dependencies**: Phase 1
**Complexity**: Medium (1-2 days)

### Files to Create

| File                                                        | Purpose                             |
| ----------------------------------------------------------- | ----------------------------------- |
| `preview/backend/src/middleware/feature-gate.middleware.ts` | Per-request route checking          |
| `preview/backend/src/config/feature-route-map.ts`           | Feature slug → route prefix mapping |

### Key Details

**Feature-to-route mapping** (derived from each `module.json`'s `routes.backend.prefix`):

```typescript
// preview/backend/src/config/feature-route-map.ts
export const FEATURE_ROUTE_MAP: Record<string, string[]> = {
  // Core — always enabled (from core/backend/src/routes/index.ts)
  core: [
    "/api/v1/auth",
    "/api/v1/users",
    "/api/v1/admin",
    "/api/v1/search",
    "/api/v1/contact",
    "/api/v1/notifications",
    "/api/v1/faqs",
    "/api/v1/announcements",
    "/api/v1/settings",
    "/api/v1/content",
    "/api/v1/coupons",
    "/api/v1/orders",
    "/api/v1/config",
  ],

  // Ecommerce (prefix: /api/v1/ecommerce)
  "ecommerce.products": [
    "/api/v1/ecommerce/products",
    "/api/v1/ecommerce/categories",
  ],
  "ecommerce.cart": ["/api/v1/ecommerce/cart"],
  "ecommerce.orders": ["/api/v1/ecommerce/orders"],
  "ecommerce.reviews": ["/api/v1/ecommerce/reviews"],
  "ecommerce.customers": ["/api/v1/ecommerce/customers"],
  "ecommerce.sellers": ["/api/v1/ecommerce/sellers"],

  // LMS (prefix: /api/v1/lms)
  "lms.courses": ["/api/v1/lms/courses"],
  "lms.lessons": ["/api/v1/lms/lessons"],
  "lms.enrollment": ["/api/v1/lms/enrollments"],
  "lms.quizzes": ["/api/v1/lms/quizzes"],
  "lms.certificates": ["/api/v1/lms/certificates"],
  "lms.instructors": ["/api/v1/lms/instructors"],

  // Booking (prefix: /api/v1/booking)
  "booking.services": ["/api/v1/booking/services"],
  "booking.providers": ["/api/v1/booking/providers"],
  "booking.bookings": ["/api/v1/booking/bookings"],
  "booking.schedules": ["/api/v1/booking/schedules"],
  "booking.reviews": ["/api/v1/booking/reviews"],
  "booking.admin": ["/api/v1/booking/admin"],

  // Helpdesk (prefix: /api/v1/helpdesk)
  "helpdesk.tickets": ["/api/v1/helpdesk/tickets"],
  "helpdesk.categories": ["/api/v1/helpdesk/categories"],
  "helpdesk.agents": ["/api/v1/helpdesk/agents"],
  "helpdesk.articles": ["/api/v1/helpdesk/articles"],
  "helpdesk.canned": ["/api/v1/helpdesk/canned-responses"],
  "helpdesk.sla": ["/api/v1/helpdesk/sla"],

  // Invoicing (prefix: /api/v1/invoicing)
  "invoicing.clients": ["/api/v1/invoicing/clients"],
  "invoicing.invoices": ["/api/v1/invoicing/invoices"],
  "invoicing.items": ["/api/v1/invoicing/invoice-items"],
  "invoicing.payments": ["/api/v1/invoicing/payments"],
  "invoicing.tax": ["/api/v1/invoicing/tax-rates"],
  "invoicing.recurring": ["/api/v1/invoicing/recurring"],

  // Events (prefix: /api/v1/events)
  "events.management": ["/api/v1/events/events", "/api/v1/events/venues"],
  "events.registration": ["/api/v1/events/registrations"],
  "events.speakers": ["/api/v1/events/speakers"],
  "events.settings": ["/api/v1/events/settings"],

  // Tasks (prefix: /api/v1/tasks)
  "tasks.management": ["/api/v1/tasks/projects", "/api/v1/tasks/tasks"],
  "tasks.comments": ["/api/v1/tasks/comments"],
  "tasks.labels": ["/api/v1/tasks/labels"],
  "tasks.settings": ["/api/v1/tasks/settings"],
};

// Reverse lookup: route prefix → required feature
export function getRequiredFeature(path: string): string | null {
  for (const [feature, prefixes] of Object.entries(FEATURE_ROUTE_MAP)) {
    if (feature === "core") continue; // Always allowed
    for (const prefix of prefixes) {
      if (path.startsWith(prefix)) return feature;
    }
  }
  return null; // No feature required (core or unknown)
}
```

**Middleware** (`preview/backend/src/middleware/feature-gate.middleware.ts`) — Fastify `onRequest` hook:

```typescript
import { FastifyRequest, FastifyReply } from "fastify";
import { getRequiredFeature } from "../config/feature-route-map.js";
import { ApiError } from "../utils/errors.js";

export async function featureGateMiddleware(
  req: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  // Skip for health, internal routes
  if (req.url === "/health" || req.url.startsWith("/internal")) {
    return;
  }

  const session = req.previewSession;
  if (!session) return; // Tenant middleware hasn't run yet

  const requiredFeature = getRequiredFeature(req.url);
  if (!requiredFeature) return; // Core route, always allowed

  // Check if ANY of the session's features matches or starts with the required feature's module
  const hasFeature = session.features.some(
    (f) =>
      f === requiredFeature ||
      requiredFeature.startsWith(f + ".") ||
      f.startsWith(requiredFeature.split(".")[0]),
  );

  if (!hasFeature) {
    throw ApiError.notFound("Feature");
  }
}
```

---

## Phase 5: Preview Frontend

**Goal**: Real Next.js app with all module pages, feature-gated navigation, embedded in studio via iframe.
**Dependencies**: Phase 1, Phase 3
**Complexity**: Medium-High (4-5 days)

### Files to Create

| File                                            | Purpose                                                |
| ----------------------------------------------- | ------------------------------------------------------ |
| `preview/web/src/app/layout.tsx`                | Root layout with PreviewProvider                       |
| `preview/web/src/app/page.tsx`                  | Dashboard landing                                      |
| `preview/web/src/app/(auth)/login/page.tsx`     | Preview auth pages                                     |
| `preview/web/src/app/(auth)/register/page.tsx`  | Preview registration                                   |
| `preview/web/src/middleware.ts`                 | Next.js middleware — extracts session token, validates |
| `preview/web/src/lib/api.ts`                    | API client that includes `X-Preview-Session` header    |
| `preview/web/src/lib/preview-context.tsx`       | Context providing session info + enabled features      |
| `preview/web/src/components/preview-banner.tsx` | "Preview Mode" banner with timer + back link           |
| `preview/web/src/components/preview-nav.tsx`    | Dynamic navigation based on enabled features           |
| `preview/web/package.json`                      | Dependencies (same as core/web + modules)              |
| `preview/web/next.config.ts`                    | Config with API rewrites to preview backend            |
| `preview/web/tailwind.config.ts`                | Tailwind config (reuse core's)                         |
| `preview/web/tsconfig.json`                     | TypeScript config with path aliases                    |

### Files to Modify

| File                                                   | Current State                                                                | Change                                                                      |
| ------------------------------------------------------ | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `studio/web/src/components/preview/preview-canvas.tsx` | Renders static `PreviewContent` inside `FeatureFlagProvider`                 | Add conditional: if `livePreview.status === 'ready'`, render iframe instead |
| `studio/web/src/lib/preview/hooks.ts`                  | `usePreviewSession` has `startSession`, `endSession`, `loadSessionFromToken` | Add `livePreviewUrl` to return, integrate with schema provisioning status   |

### Key Details

**Two interaction modes**:

- **Embedded (iframe)**: `PreviewCanvas` renders `<iframe src="http://localhost:3004?session=<token>&theme=light">` inside the existing `DeviceFrame` wrapper
- **Standalone**: "Open in new tab" button for full experience

**PreviewCanvas change** (in `studio/web/src/components/preview/preview-canvas.tsx`):

```tsx
// Current component signature:
interface PreviewCanvasProps {
  device: DeviceType;
  size: DeviceSize;
  theme: ThemeMode;
  tier: string;
  features: string[];
  className?: string;
  // NEW:
  livePreview?: {
    status: "idle" | "provisioning" | "ready" | "error";
    previewUrl: string | null;
    sessionToken: string | null;
  };
}

export function PreviewCanvas({
  device,
  size,
  theme,
  tier,
  features,
  className,
  livePreview,
}: PreviewCanvasProps) {
  return (
    <div className={cn("flex-1 overflow-auto bg-muted p-8", className)}>
      <div className="flex items-center justify-center min-h-full">
        <DeviceFrame device={device} size={size}>
          {/* NEW: Show iframe when live preview is ready */}
          {livePreview?.status === "ready" && livePreview.previewUrl ? (
            <iframe
              src={`${livePreview.previewUrl}?session=${livePreview.sessionToken}&theme=${theme}`}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
              title="Live Preview"
            />
          ) : (
            /* Existing static preview */
            <FeatureFlagProvider features={features} tier={tier}>
              <PreviewContent theme={theme} />
            </FeatureFlagProvider>
          )}
        </DeviceFrame>
      </div>
    </div>
  );
}
```

**Preview frontend API client** — all requests include session header:

```typescript
// preview/web/src/lib/api.ts
const SESSION_KEY = "preview_session_token";

export function getSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    new URLSearchParams(window.location.search).get("session") ||
    sessionStorage.getItem(SESSION_KEY)
  );
}

export async function previewFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = getSessionToken();
  return fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token && { "X-Preview-Session": token }),
      ...options.headers,
    },
  });
}
```

**Dynamic navigation** (feature-gated, in `preview/web/src/components/preview-nav.tsx`):

```tsx
const MODULE_NAV_ITEMS = [
  {
    feature: "ecommerce",
    label: "Products",
    href: "/products",
    icon: ShoppingCart,
  },
  { feature: "lms", label: "Courses", href: "/courses", icon: BookOpen },
  { feature: "helpdesk", label: "Support", href: "/helpdesk", icon: LifeBuoy },
  { feature: "booking", label: "Booking", href: "/booking", icon: Calendar },
  { feature: "invoicing", label: "Invoices", href: "/invoices", icon: Receipt },
  { feature: "events", label: "Events", href: "/events", icon: CalendarDays },
  { feature: "tasks", label: "Tasks", href: "/tasks", icon: CheckSquare },
];

function PreviewNav() {
  const { features } = usePreviewContext();
  const enabledModules = MODULE_NAV_ITEMS.filter((item) =>
    features.some((f) => f.startsWith(item.feature)),
  );
  // Render nav links for enabled modules only
}
```

**Preview banner** (persistent at top):

```
[Preview Mode] Exploring 12 features | Pro tier | Expires in 3h 45m | [Back to Configure] [End Preview]
```

**Module page approach** (see Code Reuse Strategy for full details):

Rather than rewriting module pages from scratch, the preview frontend **re-exports existing module pages** with preview context. Each module page file is a thin re-export:

```typescript
// preview/web/src/app/(dashboard)/products/page.tsx
export { default } from "../../../../../modules/ecommerce/web/src/app/(dashboard)/products/page";
```

Module pages already import core UI components (`Table`, `Button`, `Badge`, etc.) and call their module API client. The only change needed is swapping the API base URL to the preview backend — achieved via:

1. **Environment variable**: `NEXT_PUBLIC_API_URL=http://localhost:3003/api` (points to preview backend)
2. **Preview API wrapper**: Injects `X-Preview-Session` header on every fetch (see `preview/web/src/lib/api.ts`)
3. **Module API clients**: Must be refactored to accept a configurable `fetch` function or base URL, so preview can override them without modifying module code

If module API clients use a shared `api` helper from `@/lib/api.ts`, overriding that single file in the preview web project is sufficient to route all module API calls through the preview backend with session headers.

**Core pages reused directly**: Auth pages (login, register, forgot password), dashboard layout, user profile, settings — all imported from `core/web/src/` via path aliases. Only the preview banner and feature-gated navigation are new.

---

## Phase 6: Demo Data Seeding

**Goal**: Each schema gets realistic demo data based on selected features.
**Dependencies**: Phase 2
**Complexity**: Medium (2-3 days)

### Files to Create

| File                                         | Purpose                                                        |
| -------------------------------------------- | -------------------------------------------------------------- |
| `preview/backend/src/seed/index.ts`          | Seed orchestrator — calls per-module seeders based on features |
| `preview/backend/src/seed/core.seed.ts`      | Admin user, sample users, settings, FAQs, announcements        |
| `preview/backend/src/seed/ecommerce.seed.ts` | 10 products, 3 categories, 2 orders, 5 reviews                 |
| `preview/backend/src/seed/lms.seed.ts`       | 3 courses, 15 lessons, 2 enrollments                           |
| `preview/backend/src/seed/booking.seed.ts`   | Services, time slots, sample bookings                          |
| `preview/backend/src/seed/helpdesk.seed.ts`  | 5 tickets, 2 agents, 3 KB articles                             |
| `preview/backend/src/seed/invoicing.seed.ts` | Invoices, clients, line items                                  |
| `preview/backend/src/seed/events.seed.ts`    | 3 upcoming events, ticket types, attendees                     |
| `preview/backend/src/seed/tasks.seed.ts`     | 2 projects, 10 tasks, labels                                   |

### Key Details

**Seed orchestrator**:

```typescript
// preview/backend/src/seed/index.ts
import { PrismaClient } from "@prisma/client";

export async function seedPreviewSchema(
  db: PrismaClient,
  enabledFeatures: string[],
) {
  await seedCore(db); // Always

  const features = new Set(enabledFeatures);
  const moduleSeeds = [];

  // Check for any feature starting with the module prefix
  if ([...features].some((f) => f.startsWith("ecommerce")))
    moduleSeeds.push(seedEcommerce(db));
  if ([...features].some((f) => f.startsWith("lms")))
    moduleSeeds.push(seedLms(db));
  if ([...features].some((f) => f.startsWith("booking")))
    moduleSeeds.push(seedBooking(db));
  if ([...features].some((f) => f.startsWith("helpdesk")))
    moduleSeeds.push(seedHelpdesk(db));
  if ([...features].some((f) => f.startsWith("invoicing")))
    moduleSeeds.push(seedInvoicing(db));
  if ([...features].some((f) => f.startsWith("events")))
    moduleSeeds.push(seedEvents(db));
  if ([...features].some((f) => f.startsWith("tasks")))
    moduleSeeds.push(seedTasks(db));

  await Promise.all(moduleSeeds);
}
```

**Core seed data** (always included):

- 1 admin user: `admin@preview.local` / `Preview123!`
- 5 sample users with varied names/roles
- App settings (name, theme, colors)
- 3 FAQs with categories, 2 announcements
- **Pre-hashed bcrypt constants** to avoid ~500ms bcrypt computation per seed:
  ```typescript
  // bcrypt hash of "Preview123!" with salt rounds 12
  const ADMIN_PASSWORD_HASH = "$2a$12$...precomputed...";
  const USER_PASSWORD_HASH = "$2a$12$...precomputed...";
  ```

**Performance target**: <5 seconds total. Strategies:

- `createMany` for bulk inserts
- `Promise.all` for independent module seeds
- Pre-computed bcrypt hashes
- Skip optional relations (no file uploads)

**Existing seed reference**: `studio/backend/prisma/seed.ts` has seed data patterns for features/modules/tiers that can be adapted.

---

## Phase 7: Resource Management & Monitoring

**Goal**: Production-grade resource monitoring, orphan cleanup, and operational tooling.
**Dependencies**: Phases 1-6
**Complexity**: Medium (2-3 days)

**Note**: Core security (sandbox middleware, rate limiting, HMAC auth, CSRF) is now built into Phases 1-3. This phase focuses on operational concerns.

### Files to Create

| File                                                       | Purpose                                                 |
| ---------------------------------------------------------- | ------------------------------------------------------- |
| `preview/backend/src/services/resource-monitor.service.ts` | Track schemas, connections, memory, alert on thresholds |
| `preview/backend/src/config/limits.ts`                     | Configurable limit constants                            |
| `preview/backend/src/jobs/orphan-cleanup.job.ts`           | Detect and clean orphaned PostgreSQL schemas            |

### Key Details

**Sandbox middleware** (registered in Phase 1 `index.ts` as `onRequest` hook):

```typescript
// preview/backend/src/middleware/sandbox.middleware.ts
// Intercepts and stubs external services to prevent real side effects

export async function sandboxMiddleware(
  req: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  // Inject mock service providers into request context
  req.emailService = mockEmailService; // stores "sent" emails in memory
  req.paymentService = mockPaymentService; // always returns success
  req.storageService = mockStorageService; // temp dir, 1MB limit, cleaned with schema
}

// Mock email: viewable at GET /internal/emails/:sessionToken
const mockEmailStore = new Map<
  string,
  Array<{ to: string; subject: string; body: string; sentAt: Date }>
>();

// Mock payments: Stripe-compatible interface, always succeeds
const mockPaymentService = {
  async createCheckoutSession() {
    return { id: "mock_cs_" + crypto.randomUUID(), url: "#" };
  },
  async confirmPayment() {
    return { status: "succeeded" };
  },
};
```

**Resource limits** (from env, with defaults):

```typescript
// preview/backend/src/config/limits.ts
import { env } from "./env.js";

export const LIMITS = {
  MAX_CONCURRENT_SCHEMAS: env.MAX_PREVIEW_SCHEMAS, // default 50
  MAX_SESSIONS_PER_IP: env.MAX_SESSIONS_PER_IP, // default 5
  SESSION_TTL_HOURS: env.PREVIEW_TTL_HOURS, // default 4
  SCHEMA_IDLE_TIMEOUT_MIN: 30,
  MAX_ROWS_PER_TABLE: 1000,
  MAX_FILE_SIZE_BYTES: 1 * 1024 * 1024, // 1MB
  PRISMA_CONNECTION_LIMIT: env.PRISMA_CONNECTION_LIMIT, // default 2
} as const;
```

**Rate limiting** for session creation (`studio/backend/src/routes/public/preview.routes.ts`):

- Existing: 100 requests/hour/IP
- Add: max active sessions per IP check (query DB before creating)
- Add: global schema cap check (query DB for total READY schemas)
- Return 429 with `Retry-After` header when limits hit

**Connection pool math** (revised):

- `connection_limit=2` per PrismaClient × 50 max schemas = 100 connections
- +1 admin client with default pool (~5 connections) = 105 total
- PostgreSQL default `max_connections` = 100 → **must increase to 150+**
- Alternative: Use PgBouncer in transaction mode as connection pooler
- Monitor via `/internal/metrics` with alerting at 80% capacity

**Orphan schema detection** (runs every 6 hours):

```typescript
// preview/backend/src/jobs/orphan-cleanup.job.ts
// Scans PostgreSQL for preview_* schemas that don't match any active PreviewSession
async function cleanupOrphanSchemas(): Promise<number> {
  const admin = getAdminClient();
  const schemas = await admin.$queryRaw<Array<{ schema_name: string }>>`
    SELECT schema_name FROM information_schema.schemata
    WHERE schema_name LIKE 'preview_%'
  `;

  // Compare against active sessions (fetched from studio backend)
  // Drop any schema not matching an active session
}
```

**`/internal/metrics` endpoint response**:

```json
{
  "activeSchemas": 12,
  "cachedClients": 8,
  "sessionCacheSize": 15,
  "memoryUsageMB": 245,
  "uptimeSeconds": 3600,
  "provisioningQueue": 0,
  "failedProvisions24h": 2,
  "connectionPoolUsage": "42/100"
}
```

---

## Phase 8: Studio Integration

**Goal**: Connect the configurator UI to the live preview system.
**Dependencies**: Phases 1-7
**Complexity**: Medium (2-3 days)

### Files to Modify

| File                                                   | Current State                                                                        | Change                                                                                        |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `studio/web/src/components/configurator/context.tsx`   | `useReducer` with 12 action types, no live preview state                             | Add `livePreview` to state, add `SET_LIVE_PREVIEW` action, add `launchLivePreview()` callback |
| `studio/web/src/components/preview/preview-canvas.tsx` | Renders static `PreviewContent` only                                                 | Accept `livePreview` prop, render iframe when ready (see Phase 5 details)                     |
| `studio/web/src/components/preview/device-toolbar.tsx` | Has device/theme toggles, reset, external-link. Props: `onReset?`, `onOpenExternal?` | Add `onLaunchPreview?` prop, render "Launch Live Preview" button                              |
| `studio/web/src/app/(public)/preview/page.tsx`         | Reads URL params, renders DeviceToolbar + PreviewCanvas + FeaturePanel               | Pass `livePreview` prop through to PreviewCanvas                                              |
| `studio/web/src/lib/preview/hooks.ts`                  | `usePreviewSession` creates local+backend sessions                                   | Add `launchLivePreview()` that triggers schema provisioning and polls for readiness           |
| `studio/web/src/lib/constants.ts`                      | Has `API_CONFIG` only                                                                | Add `PREVIEW_FRONTEND_URL`, `PREVIEW_BACKEND_URL` constants                                   |

### Files to Create

| File                                                        | Purpose                                                          |
| ----------------------------------------------------------- | ---------------------------------------------------------------- |
| `studio/web/src/components/preview/live-preview-status.tsx` | Status indicator: provisioning spinner, ready badge, error alert |
| `studio/web/src/components/preview/preview-actions.tsx`     | Launch, stop, restart, open-in-new-tab action buttons            |

### Key Details

**ConfiguratorProvider changes** (`context.tsx`):

Add to `ConfiguratorState`:

```typescript
livePreview: {
  status: "idle" | "provisioning" | "ready" | "error";
  sessionToken: string | null;
  previewUrl: string | null;
  error: string | null;
  expiresAt: Date | null;
}
```

Add new action type:

```typescript
| { type: "SET_LIVE_PREVIEW"; payload: Partial<ConfiguratorState['livePreview']> }
```

Add to reducer:

```typescript
case "SET_LIVE_PREVIEW":
  return {
    ...state,
    livePreview: { ...state.livePreview, ...action.payload },
  };
```

New `launchLivePreview()` callback:

1. Dispatch `SET_LIVE_PREVIEW` with `status: 'provisioning'`
2. POST to `${API_CONFIG.BASE_URL}/preview/sessions` with `{ selectedFeatures, tier, provisionSchema: true }`
3. Get back `sessionToken`
4. Poll `GET /api/preview/sessions/:token/status` every 1s until `schemaStatus === 'READY'` (max 30s timeout)
5. On success: dispatch `SET_LIVE_PREVIEW` with `status: 'ready', previewUrl: PREVIEW_FRONTEND_URL, sessionToken, expiresAt`
6. On failure/timeout: dispatch `SET_LIVE_PREVIEW` with `status: 'error', error: message`

**DeviceToolbar change** — add "Launch Live Preview" button:

```tsx
// New prop:
onLaunchPreview?: () => void;
livePreviewStatus?: 'idle' | 'provisioning' | 'ready' | 'error';

// In the Right: Actions section, add before existing buttons:
{onLaunchPreview && (
  <Button
    variant={livePreviewStatus === 'ready' ? 'default' : 'outline'}
    size="sm"
    onClick={onLaunchPreview}
    isLoading={livePreviewStatus === 'provisioning'}
    disabled={livePreviewStatus === 'provisioning'}
  >
    {livePreviewStatus === 'ready' ? 'Live' : 'Launch Live Preview'}
  </Button>
)}
```

**Feature change while preview active**: When `selectedFeatures` or `selectedTier` changes while `livePreview.status === 'ready'`, show a prompt: "Configuration changed — Restart Preview?". Restarting drops old schema and provisions a new one.

**New constants** (add to `studio/web/src/lib/constants.ts`):

```typescript
export const PREVIEW_CONFIG = {
  FRONTEND_URL:
    process.env.NEXT_PUBLIC_PREVIEW_FRONTEND_URL || "http://localhost:3004",
  BACKEND_URL:
    process.env.NEXT_PUBLIC_PREVIEW_BACKEND_URL || "http://localhost:3003",
  POLL_INTERVAL_MS: 1000,
  POLL_TIMEOUT_MS: 30000,
  HEARTBEAT_INTERVAL_MS: 5 * 60 * 1000, // 5 minutes
} as const;
```

**New env vars** (`studio/web/.env.local`):

```
NEXT_PUBLIC_PREVIEW_FRONTEND_URL=http://localhost:3004
NEXT_PUBLIC_PREVIEW_BACKEND_URL=http://localhost:3003
```

---

## Dependency Graph

```
Phase 0 (Shared Utils) ─── Phase 1 (Preview Backend + Module DI) ─────┐
                                                                        │
                           Phase 2 (Schema Isolation) ─────────────────┼── Phase 3 (Session Lifecycle) ── Phase 8 (Studio Integration)
                                                                        │
                           Phase 4 (Feature Gate) ─────────────────────┤
                                                                        │
                           Phase 5 (Preview Frontend) ─────────────────┤
                                                                        │
                           Phase 6 (Demo Data Seeding) ────────────────┤
                                                                        │
                           Phase 7 (Resources & Monitoring) ───────────┘
```

- **Phase 0** is a prerequisite — extract shared utils before anything else.
- **Phase 1** includes module service DI refactoring (largest effort, but eliminates duplication).
- **Security is built-in** from Phase 1: sandbox middleware, rate limiting, HMAC auth, CSRF via custom headers, JWT audience scoping. No separate security phase.
- Phases 4, 5, 6 can be developed in parallel once Phase 1 skeleton exists.
- Phase 2 is the highest-risk item.
- Phase 3 depends on 1 + 2.
- Phase 8 comes last (integration).

---

## Estimated Effort

| Phase     | Description            | New Files | Modified Files                   | Days      |
| --------- | ---------------------- | --------- | -------------------------------- | --------- |
| 0 (new)   | Shared Backend Utils   | 6         | 2 (studio + core imports)        | 1         |
| 1         | Preview Backend Setup  | 8         | ~48 (module service DI refactor) | 4-5       |
| 2         | Schema Isolation       | 4         | 0                                | 4-5       |
| 3         | Session Lifecycle      | 3         | 3                                | 2-3       |
| 4         | Feature Gate           | 2         | 0                                | 1-2       |
| 5         | Preview Frontend       | 13        | 2                                | 4-5       |
| 6         | Demo Data Seeding      | 9         | 0                                | 2-3       |
| 7         | Resources & Monitoring | 3         | 0                                | 2-3       |
| 8         | Studio Integration     | 2         | 6                                | 2-3       |
| **Total** |                        | **~50**   | **~61**                          | **22-30** |

**Note on Phase 1 modified files**: The ~48 module service files must be refactored from placeholder stubs to real Prisma calls with DI. This work is **necessary regardless** of the preview system — the modules are non-functional without it. The preview system simply ensures it happens with the correct DI pattern.

---

## Risk Areas & Mitigations

| Risk                                                                             | Impact | Mitigation                                                                                                                                 |
| -------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Module services are placeholders** — use `dbOperations` stubs, not real Prisma | High   | Option B: Refactor services to accept `PrismaClient` via DI, replace stubs with real Prisma calls (needed anyway for module functionality) |
| **Prisma doesn't natively support schema switching**                             | High   | Per-schema PrismaClient instances with `?schema=` URL param, LRU-cached with hard cap and graceful eviction                                |
| **Module auth middleware is a placeholder** — just checks Bearer header exists   | High   | Refactor module auth to accept injected `db`, verify JWT with `preview` audience claim, resolve against per-schema User table              |
| Schema provisioning latency (>10s)                                               | Medium | Pre-compile migration SQL at build time; bulk seed with `createMany`; rollback on failure; stuck-provision cleanup after 5min              |
| Memory pressure from many PrismaClient instances                                 | Medium | LRU eviction at hard cap; `connection_limit=2` per client; `disconnectAllClients()` on shutdown                                            |
| Cross-origin iframe restrictions                                                 | Low    | Configure CSP on preview frontend to allow studio origin; CORS allows `X-Preview-Session` header                                           |
| Database connection exhaustion (105 connections at 50 schemas + admin)           | Medium | Increase PostgreSQL `max_connections` to 150+; or use PgBouncer; monitor at `/internal/metrics` with alerting at 80%                       |
| Abuse (spam session creation)                                                    | Low    | Rate limiting per IP (100/hr) + per session token (200/min) + global schema cap + session-per-IP limit                                     |
| Studio backend downtime blocks preview                                           | Medium | Circuit breaker pattern (open after 5 failures, reset after 30s); session cache survives 60s without studio                                |
| Schema provisioning fails midway (partial state)                                 | Medium | Wrap in try/catch → DROP SCHEMA CASCADE on failure; set `schemaStatus = FAILED`; auto-retry endpoint available                             |
| Orphaned schemas (studio crash during cleanup)                                   | Low    | Orphan detection job every 6 hours scans `information_schema.schemata` for `preview_*` without matching session                            |
| Real emails/payments sent from preview                                           | High   | Sandbox middleware (Phase 1) stubs all external services from day one; no real Stripe/Resend calls ever reach external APIs                |

---

## Verification Plan

### Per-Phase Testing

1. **Phase 1**: Preview backend starts, loads all routes, responds to `GET /health`
2. **Phase 2**: Can create schema, run migration SQL, query tables, drop schema — no cross-contamination between two concurrent sessions
3. **Phase 3**: Full lifecycle: create session → provision schema → heartbeat → expire → cleanup drops schema
4. **Phase 4**: Enabled feature routes return data; disabled feature routes return 404 with `FEATURE_NOT_AVAILABLE`
5. **Phase 5**: Preview frontend loads, shows feature-gated nav, can register/login, CRUD works against per-schema DB
6. **Phase 6**: Each module's seed data appears correctly; seeding completes in <5s
7. **Phase 7**: Email/payment calls are stubbed; resource limits enforced; cannot exceed schema cap
8. **Phase 8**: Studio configurator "Launch Live Preview" button works end-to-end; iframe shows real app

### End-to-End Test

1. Open studio configurator at `:3002/configure`
2. Select features: auth.basic, ecommerce.products, ecommerce.cart, payments.oneTime
3. Click "Launch Live Preview"
4. Wait for provisioning (~3-5 seconds)
5. Iframe loads preview app with dashboard, Products nav item, Cart nav item
6. Register a new user in preview
7. Browse seeded products, add to cart
8. Verify LMS/helpdesk/booking nav items are NOT visible (not selected)
9. Open in new tab — full app works standalone
10. Wait for session expiry or click "End Preview"
11. Verify schema is dropped from PostgreSQL
12. Verify PrismaClient is disconnected and removed from cache

---

## Production Deployment Considerations

### Containerization

Both preview backend and frontend should have Dockerfiles:

```dockerfile
# preview/backend/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY shared/backend-utils ./shared/backend-utils
COPY preview/backend ./preview/backend
RUN cd preview/backend && npm ci --production
EXPOSE 3003
HEALTHCHECK CMD curl -f http://localhost:3003/health || exit 1
CMD ["node", "preview/backend/dist/index.js"]
```

### Zero-Downtime Deploys

Active preview sessions must survive deploys:

- Use rolling deployments (not recreate)
- Preview schemas persist in PostgreSQL regardless of backend restarts
- Session data lives in studio backend's DB (separate service)
- PrismaClient cache rebuilds on first request per schema (minor cold start)

### Error Tracking

Integrate Sentry or similar from Phase 1:

```typescript
import * as Sentry from "@sentry/node";
Sentry.init({ dsn: env.SENTRY_DSN, environment: env.NODE_ENV });
```

### Database Recommendations

- Increase PostgreSQL `max_connections` to 150+ (or use PgBouncer)
- Monitor preview schema count: `SELECT count(*) FROM information_schema.schemata WHERE schema_name LIKE 'preview_%'`
- Set `statement_timeout = '30s'` for preview schemas to prevent long-running queries
- Consider read replicas if preview load is high

### Request Tracing

Every request gets a correlation ID via Fastify's `genReqId`. Pass this through:

- Preview backend → Studio backend API calls (as `X-Request-Id` header)
- Logged in structured JSON (Pino) for cross-service debugging

---

## Environment Variables (New)

```bash
# preview/backend/.env
DATABASE_URL=postgresql://postgres:localpass@localhost:5433/studio_dev
STUDIO_API_URL=http://localhost:3001/api
PORT=3003
NODE_ENV=development
CORS_ORIGIN=http://localhost:3002,http://localhost:3004
JWT_SECRET=preview-jwt-secret-min-32-characters-long
MAX_PREVIEW_SCHEMAS=50
MAX_SESSIONS_PER_IP=5
PREVIEW_TTL_HOURS=4
PRISMA_CONNECTION_LIMIT=2
INTERNAL_API_SECRET=dev-internal-secret

# preview/web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3003/api
NEXT_PUBLIC_STUDIO_URL=http://localhost:3002

# studio/backend/.env (add)
PREVIEW_BACKEND_URL=http://localhost:3003
INTERNAL_API_SECRET=dev-internal-secret

# studio/web/.env.local (add)
NEXT_PUBLIC_PREVIEW_FRONTEND_URL=http://localhost:3004
NEXT_PUBLIC_PREVIEW_BACKEND_URL=http://localhost:3003
```

---

## Critical Existing Files Referenced

| File                                                   | Relevance                                                                                                                                                                                                                                      |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `core/backend/src/app.ts`                              | Middleware chain pattern — helmet → cors → body → cookie → routes → error. CORS already allows `X-Preview-Session` header (line 58)                                                                                                            |
| `core/backend/src/middleware/auth.middleware.ts`       | Real auth: extracts token from cookie `accessToken` or `Authorization: Bearer`, verifies JWT via `verifyToken()`, looks up `db.user`, attaches `req.user` + `req.dbUser`. Preview needs similar but against per-schema User table              |
| `core/backend/src/middleware/error.middleware.ts`      | Handles `ZodError`, `ApiError`, `PrismaClientKnownRequestError`, unknown errors. Has `ApiError` class with static factories                                                                                                                    |
| `core/backend/src/lib/db.ts`                           | Prisma singleton with global caching for dev. Preview adapts this to per-schema client cache                                                                                                                                                   |
| `core/backend/src/config/index.ts`                     | Uses `requireEnv()`/`optionalEnv()` pattern. Preview should follow studio's Zod pattern instead                                                                                                                                                |
| `core/backend/src/routes/index.ts`                     | Core routes: auth, users, admin, search, contact, notifications, faqs, announcements, settings, content, coupons, orders, config — all under `/api/v1`                                                                                         |
| `core/backend/prisma/schema.prisma`                    | 23 core models including User, Session, AuditLog, Notification, etc.                                                                                                                                                                           |
| `modules/*/prisma/*.prisma`                            | Module schemas to merge into preview's unified schema                                                                                                                                                                                          |
| `modules/*/backend/src/routes/*.routes.ts`             | Module route files that export FastifyPluginAsync. Import from local `../middleware/auth` (placeholder) and `../services/*.service` (placeholder stubs)                                                                                        |
| `modules/*/module.json`                                | Module metadata with `routes.backend.prefix` and `routes.backend.files[]`                                                                                                                                                                      |
| `modules/*/backend/src/services/*.service.ts`          | **PLACEHOLDER services** with `dbOperations` stubs. Phase 1 refactors these to accept `PrismaClient` via DI and replaces stubs with real Prisma calls                                                                                          |
| `modules/*/backend/src/middleware/auth.ts`             | **PLACEHOLDER auth** that only checks Bearer header. Phase 1 refactors to accept injected `db`, verify JWT with audience claim, resolve against per-schema User table                                                                          |
| `studio/backend/src/config/env.ts`                     | Zod-validated env pattern to follow                                                                                                                                                                                                            |
| `studio/backend/src/config/db.ts`                      | Prisma singleton pattern (studio version)                                                                                                                                                                                                      |
| `studio/backend/src/utils/schema-merger.ts`            | `mergeSchemas(coreBasePath, schemaMappings[], projectRootPath?)` — reuse for building merged preview schema                                                                                                                                    |
| `shared/backend-utils/src/errors.ts`                   | **Shared** `ApiError` class (extracted from studio, used by studio + preview + core). Static factories: `.badRequest()`, `.unauthorized()`, `.forbidden()`, `.notFound()`, `.conflict()`, `.tooManyRequests()`, `.internal()`, `.validation()` |
| `shared/backend-utils/src/response.ts`                 | **Shared** response helpers: `sendSuccess()`, `sendPaginated()`, `sendError()`, `createPaginationInfo()`, `parsePaginationParams()`                                                                                                            |
| `shared/backend-utils/src/error-handler.ts`            | **Shared** `errorHandler` + `notFoundHandler` — handles ApiError, Prisma errors, Zod errors                                                                                                                                                    |
| `studio/backend/src/middleware/auth.middleware.ts`     | Real auth: checks cookie `auth_token` or Bearer header, verifies JWT, looks up `prisma.studioUser`, attaches `req.user: { id, email, name, role }`                                                                                             |
| `studio/backend/src/middleware/validate.middleware.ts` | `validateRequest(zodSchema)` factory                                                                                                                                                                                                           |
| `studio/backend/src/routes/public/preview.routes.ts`   | Existing preview session CRUD. Rate limited 100/hr/IP. Token validation regex: `/^[a-zA-Z0-9-]{20,}$/`. No PATCH endpoint                                                                                                                      |
| `studio/backend/src/routes/public/index.ts`            | Public route aggregator: features, templates, pricing, preview, checkout, orders, auth                                                                                                                                                         |
| `studio/backend/src/jobs/cleanup.job.ts`               | Hourly cron that deletes expired preview sessions. Needs extension to DROP schemas                                                                                                                                                             |
| `studio/backend/prisma/schema.prisma`                  | PreviewSession model (7 fields, no schema tracking yet)                                                                                                                                                                                        |
| `studio/web/src/components/preview/preview-canvas.tsx` | Static mockup with `FeatureFlagProvider` → `PreviewContent`. Uses `hasFeature()` for conditional cards                                                                                                                                         |
| `studio/web/src/components/preview/device-toolbar.tsx` | Device/theme toggles + reset/external buttons. Props: `onReset?`, `onOpenExternal?`. No live preview button                                                                                                                                    |
| `studio/web/src/components/configurator/context.tsx`   | `useReducer` with 12 action types. Fetches features/tiers/templates from API. No `livePreview` state                                                                                                                                           |
| `studio/web/src/lib/preview/hooks.ts`                  | `usePreviewSession` with local+backend session creation. Returns `{ session, isLoading, error, startSession, endSession, loadSessionFromToken }`                                                                                               |
| `studio/web/src/app/(public)/preview/page.tsx`         | Full preview page with URL param parsing, device toolbar, canvas, feature panel                                                                                                                                                                |
| `studio/web/src/lib/constants.ts`                      | `API_CONFIG.BASE_URL`, no preview URLs                                                                                                                                                                                                         |
