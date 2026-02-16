# Live Preview System - Implementation Plan

> **Created**: 2026-02-15
> **Status**: Planning (not yet started)
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

1. **Preview Backend** (`preview/backend/`) — Express app loading core + all module routes, with multi-tenant schema isolation
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
    - Rate limited: 100 requests/hour/IP via `express-rate-limit`
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

## Phase 1: Preview Backend Setup

**Goal**: New Express app that loads ALL core + module backend routes behind a unified API.
**Dependencies**: None (foundational)
**Complexity**: Medium-High (3-4 days)

### Files to Create

| File                                                 | Purpose                                                  |
| ---------------------------------------------------- | -------------------------------------------------------- |
| `preview/backend/src/index.ts`                       | Express entry point, port 3003                           |
| `preview/backend/src/config/env.ts`                  | Zod-validated env config (follow studio pattern)         |
| `preview/backend/src/config/db.ts`                   | Prisma client factory — creates per-schema clients       |
| `preview/backend/src/routes/index.ts`                | Aggregates all core + module routes under unified router |
| `preview/backend/src/utils/errors.ts`                | Copy of studio's ApiError class                          |
| `preview/backend/src/utils/response.ts`              | Copy of studio's response helpers                        |
| `preview/backend/src/middleware/error.middleware.ts` | Copy of studio's error handler                           |
| `preview/backend/package.json`                       | Superset of core + all module dependencies               |
| `preview/backend/tsconfig.json`                      | TypeScript config with path aliases to core + modules    |
| `preview/backend/prisma/schema.prisma`               | Pre-merged schema (core + all modules combined)          |
| `preview/backend/.env.example`                       | Template env file                                        |

### Key Details

**Middleware chain** (modeled after `studio/backend/src/index.ts` simplicity, not core's full chain):

```typescript
// preview/backend/src/index.ts
const app = express();

app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGIN.split(",").map(s => s.trim()),
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "X-Preview-Session"],
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Phase 2: tenant middleware (extracts session token, sets req.db)
// Phase 4: feature gate middleware (blocks disabled routes)
// Phase 7: sandbox middleware (stubs external services)

app.get("/health", ...);

// Core routes
app.use("/api/v1", coreRoutes);

// Module routes
app.use("/api/v1/ecommerce", ecommerceRoutes);
app.use("/api/v1/lms", lmsRoutes);
app.use("/api/v1/booking", bookingRoutes);
app.use("/api/v1/helpdesk", helpdeskRoutes);
app.use("/api/v1/invoicing", invoicingRoutes);
app.use("/api/v1/events", eventsRoutes);
app.use("/api/v1/tasks", tasksRoutes);

// Internal routes (Phase 3) — not publicly accessible
app.use("/internal", internalRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
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
  JWT_SECRET: z.string().min(32),
  STUDIO_API_URL: z.string().default("http://localhost:3001/api"),
  MAX_PREVIEW_SCHEMAS: z.coerce.number().default(50),
  MAX_SESSIONS_PER_IP: z.coerce.number().default(5),
  PREVIEW_TTL_HOURS: z.coerce.number().default(4),
  PRISMA_CONNECTION_LIMIT: z.coerce.number().default(2),
  // Internal API secret for studio→preview communication
  INTERNAL_API_SECRET: z.string().default("dev-internal-secret"),
});
```

**Route loading challenge**: Module routes import from their local `../middleware/auth.ts` and `../services/*.service.ts`. Since module services are placeholders (see Finding #5), we have two options:

- **Option A (preferred)**: Write preview-specific route handlers that use real Prisma against `req.db`. This means the preview backend has its own route files that wrap the same business logic but connect to the per-schema database.
- **Option B**: Make module services accept a `db` parameter via dependency injection, modifying existing module code.

**Recommendation**: Option A — keep module code untouched, write thin preview route adapters. This avoids modifying the downloadable module code just for preview functionality.

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

**Per-request schema routing — PrismaClient-per-schema approach**:

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

export function getClientForSchema(schemaName: string): PrismaClient {
  const cached = clientCache.get(schemaName);
  if (cached) {
    cached.lastAccessedAt = Date.now();
    return cached.client;
  }

  // Strip ?schema= from base URL if present, then add new schema
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
    await cached.client.$disconnect();
    clientCache.delete(schemaName);
  }
}

export function getActiveSchemaCount(): number {
  return clientCache.size;
}

// Periodic cleanup of idle clients
setInterval(async () => {
  const now = Date.now();
  for (const [name, cached] of clientCache) {
    if (now - cached.lastAccessedAt > IDLE_TIMEOUT_MS) {
      await cached.client.$disconnect();
      clientCache.delete(name);
    }
  }
}, 60_000); // Check every minute
```

**Tenant middleware**:

```typescript
// preview/backend/src/middleware/tenant.middleware.ts
import { Request, Response, NextFunction } from "express";
import { getClientForSchema } from "../config/db.js";
import { toSchemaName } from "../utils/schema-name.js";
import { sendError } from "../utils/response.js";

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      db?: PrismaClient;
      previewSession?: {
        token: string;
        schemaName: string;
        features: string[];
        tier: string;
      };
    }
  }
}

export async function tenantMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  // Skip for health check and internal routes
  if (req.path === "/health" || req.path.startsWith("/internal")) {
    return next();
  }

  const sessionToken = req.headers["x-preview-session"] as string;
  if (!sessionToken) {
    return sendError(
      res,
      "X-Preview-Session header required",
      401,
      "SESSION_REQUIRED",
    );
  }

  // Fetch session info from studio backend (cached)
  // ... validate session, get features/tier/schemaName

  const schemaName = toSchemaName(sessionToken);
  req.db = getClientForSchema(schemaName);
  req.previewSession = { token: sessionToken, schemaName, features, tier };
  next();
}
```

**Critical challenge — module services don't use `req.db`**: Module services are singletons that use local `dbOperations` stubs (see Finding #5). For the preview backend, route handlers need to use `req.db` directly instead of calling module services. This means writing preview-specific route files that contain the actual Prisma queries (using the commented-out code in module services as reference).

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
router.patch(
  "/sessions/:token",
  validateTokenFormat,
  async (req, res, next) => {
    // Update lastAccessedAt
    // Return current schemaStatus for polling
  },
);

// NEW: GET /sessions/:token/status — lightweight status check for polling
router.get(
  "/sessions/:token/status",
  validateTokenFormat,
  async (req, res, next) => {
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

**Internal API** (preview backend, secured by `X-Internal-Secret` header):

```
POST   /internal/schemas/provision   { sessionToken, features, tier }
DELETE /internal/schemas/:name
GET    /internal/health
GET    /internal/metrics             { activeSchemas, connectionPool, memory }
```

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

**Middleware** (`preview/backend/src/middleware/feature-gate.middleware.ts`):

```typescript
export function featureGateMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  // Skip for health, internal routes
  if (req.path === "/health" || req.path.startsWith("/internal")) {
    return next();
  }

  const session = req.previewSession;
  if (!session) return next(); // Tenant middleware hasn't run yet

  const requiredFeature = getRequiredFeature(req.path);
  if (!requiredFeature) return next(); // Core route, always allowed

  // Check if ANY of the session's features matches or starts with the required feature's module
  const hasFeature = session.features.some(
    (f) =>
      f === requiredFeature ||
      requiredFeature.startsWith(f + ".") ||
      f.startsWith(requiredFeature.split(".")[0]),
  );

  if (!hasFeature) {
    return sendError(
      res,
      "This feature is not enabled in your preview",
      404,
      "FEATURE_NOT_AVAILABLE",
    );
  }

  next();
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

**Module page approach**: Rather than symlinking module pages (fragile), the preview frontend should have its own pages that import core UI components directly. These pages serve as thin wrappers — showing listing/detail views for each module using `previewFetch()` and core UI components (`Table`, `Button`, `Badge`, `SearchInput`, `Pagination`, etc.).

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

## Phase 7: Security & Resource Management

**Goal**: Prevent abuse, cross-session data leaks, and resource exhaustion.
**Dependencies**: Phases 1-6
**Complexity**: Medium (2-3 days)

### Files to Create

| File                                                       | Purpose                          |
| ---------------------------------------------------------- | -------------------------------- |
| `preview/backend/src/middleware/sandbox.middleware.ts`     | Stub external services           |
| `preview/backend/src/services/resource-monitor.service.ts` | Track schemas, connections, disk |
| `preview/backend/src/config/limits.ts`                     | Configurable limit constants     |

### Key Details

**Sandbox middleware** — intercepts and stubs external services:

- **Email**: Mock that stores "sent" emails in memory, viewable at `/internal/emails/:session`
- **Payments**: Mock Stripe that always succeeds
- **File uploads**: Allowed to session-specific temp dir, limited to 1MB, cleaned up with schema
- **External HTTP**: Block outbound requests to non-localhost destinations

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

**Rate limiting extension** for `studio/backend/src/routes/public/preview.routes.ts`:

- Currently: 100 requests/hour/IP (from Finding #13)
- Add: max active sessions per IP check (query DB before creating)
- Add: global schema cap check (query DB for total READY schemas)
- Return 429 with `Retry-After` header when limits hit

**Connection pool math**:

- `connection_limit=2` per PrismaClient × 50 max schemas = 100 PostgreSQL connections
- PostgreSQL default `max_connections` = 100
- Need to either increase PostgreSQL max_connections or lower schema cap
- Monitor via `/internal/metrics` endpoint

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
Phase 1 (Preview Backend) ─────┐
                                │
Phase 2 (Schema Isolation) ─────┼── Phase 3 (Session Lifecycle) ── Phase 8 (Studio Integration)
                                │
Phase 4 (Feature Gate) ─────────┤
                                │
Phase 5 (Preview Frontend) ─────┤
                                │
Phase 6 (Demo Data Seeding) ────┤
                                │
Phase 7 (Security) ─────────────┘
```

- Phases 4, 5, 6 can be developed in parallel once Phase 1 skeleton exists.
- Phase 2 is the highest-risk item.
- Phase 3 depends on 1 + 2.
- Phase 8 comes last (integration).

---

## Estimated Effort

| Phase     | Description           | New Files | Modified Files | Days      |
| --------- | --------------------- | --------- | -------------- | --------- |
| 1         | Preview Backend Setup | 11        | 0              | 3-4       |
| 2         | Schema Isolation      | 3         | 0              | 4-5       |
| 3         | Session Lifecycle     | 2         | 3              | 2-3       |
| 4         | Feature Gate          | 2         | 0              | 1-2       |
| 5         | Preview Frontend      | 13        | 2              | 4-5       |
| 6         | Demo Data Seeding     | 9         | 0              | 2-3       |
| 7         | Security & Resources  | 3         | 0              | 2-3       |
| 8         | Studio Integration    | 2         | 6              | 2-3       |
| **Total** |                       | **~45**   | **~11**        | **20-28** |

---

## Risk Areas & Mitigations

| Risk                                                                             | Impact | Mitigation                                                                                                         |
| -------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------ |
| **Module services are placeholders** — use `dbOperations` stubs, not real Prisma | High   | Write preview-specific route handlers with real Prisma queries (using commented-out code as reference)             |
| **Prisma doesn't natively support schema switching**                             | High   | Use per-schema PrismaClient instances with `?schema=` in URL, cached and pooled                                    |
| **Module auth middleware is a placeholder** — just checks Bearer header exists   | High   | Preview backend uses its own auth that resolves against per-schema User table                                      |
| Schema provisioning latency (>10s)                                               | Medium | Pre-compile migration SQL at build time; bulk seed with `createMany`; consider schema pre-pooling                  |
| Memory pressure from many PrismaClient instances                                 | Medium | `connection_limit=2` per client; LRU eviction for idle clients; max 50 concurrent                                  |
| Cross-origin iframe restrictions                                                 | Low    | Set `X-Frame-Options` and CSP on preview frontend to allow studio origin                                           |
| Database connection exhaustion (100 connections at 50 schemas)                   | Medium | Monitor via `/internal/metrics`; aggressive idle client cleanup; may need to increase PostgreSQL `max_connections` |
| Abuse (spam session creation)                                                    | Low    | Rate limiting per IP (already 100/hr) + global schema cap + session-per-IP limit                                   |

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

| File                                                   | Relevance                                                                                                                                                                                                                         |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `core/backend/src/app.ts`                              | Middleware chain pattern — helmet → cors → body → cookie → routes → error. CORS already allows `X-Preview-Session` header (line 58)                                                                                               |
| `core/backend/src/middleware/auth.middleware.ts`       | Real auth: extracts token from cookie `accessToken` or `Authorization: Bearer`, verifies JWT via `verifyToken()`, looks up `db.user`, attaches `req.user` + `req.dbUser`. Preview needs similar but against per-schema User table |
| `core/backend/src/middleware/error.middleware.ts`      | Handles `ZodError`, `ApiError`, `PrismaClientKnownRequestError`, unknown errors. Has `ApiError` class with static factories                                                                                                       |
| `core/backend/src/lib/db.ts`                           | Prisma singleton with global caching for dev. Preview adapts this to per-schema client cache                                                                                                                                      |
| `core/backend/src/config/index.ts`                     | Uses `requireEnv()`/`optionalEnv()` pattern. Preview should follow studio's Zod pattern instead                                                                                                                                   |
| `core/backend/src/routes/index.ts`                     | Core routes: auth, users, admin, search, contact, notifications, faqs, announcements, settings, content, coupons, orders, config — all under `/api/v1`                                                                            |
| `core/backend/prisma/schema.prisma`                    | 23 core models including User, Session, AuditLog, Notification, etc.                                                                                                                                                              |
| `modules/*/prisma/*.prisma`                            | Module schemas to merge into preview's unified schema                                                                                                                                                                             |
| `modules/*/backend/src/routes/*.routes.ts`             | Module route files that export Express Routers. Import from local `../middleware/auth` (placeholder) and `../services/*.service` (placeholder stubs)                                                                              |
| `modules/*/module.json`                                | Module metadata with `routes.backend.prefix` and `routes.backend.files[]`                                                                                                                                                         |
| `modules/*/backend/src/services/*.service.ts`          | **PLACEHOLDER services** with `dbOperations` stubs and commented-out real Prisma calls. Preview needs its own route handlers with real Prisma                                                                                     |
| `modules/*/backend/src/middleware/auth.ts`             | **PLACEHOLDER auth** that only checks Bearer header exists. Preview needs real auth                                                                                                                                               |
| `studio/backend/src/config/env.ts`                     | Zod-validated env pattern to follow                                                                                                                                                                                               |
| `studio/backend/src/config/db.ts`                      | Prisma singleton pattern (studio version)                                                                                                                                                                                         |
| `studio/backend/src/utils/schema-merger.ts`            | `mergeSchemas(coreBasePath, schemaMappings[], projectRootPath?)` — reuse for building merged preview schema                                                                                                                       |
| `studio/backend/src/utils/errors.ts`                   | `ApiError` class with `.badRequest()`, `.unauthorized()`, `.forbidden()`, `.notFound()`, `.conflict()`, `.tooManyRequests()`, `.internal()`, `.validation()`                                                                      |
| `studio/backend/src/utils/response.ts`                 | `sendSuccess()`, `sendPaginated()`, `sendError()`, `createPaginationInfo()`, `parsePaginationParams()`                                                                                                                            |
| `studio/backend/src/middleware/error.middleware.ts`    | `errorHandler` + `notFoundHandler` — handles ApiError, Prisma errors, Zod errors                                                                                                                                                  |
| `studio/backend/src/middleware/auth.middleware.ts`     | Real auth: checks cookie `auth_token` or Bearer header, verifies JWT, looks up `prisma.studioUser`, attaches `req.user: { id, email, name, role }`                                                                                |
| `studio/backend/src/middleware/validate.middleware.ts` | `validateRequest(zodSchema)` factory                                                                                                                                                                                              |
| `studio/backend/src/routes/public/preview.routes.ts`   | Existing preview session CRUD. Rate limited 100/hr/IP. Token validation regex: `/^[a-zA-Z0-9-]{20,}$/`. No PATCH endpoint                                                                                                         |
| `studio/backend/src/routes/public/index.ts`            | Public route aggregator: features, templates, pricing, preview, checkout, orders, auth                                                                                                                                            |
| `studio/backend/src/jobs/cleanup.job.ts`               | Hourly cron that deletes expired preview sessions. Needs extension to DROP schemas                                                                                                                                                |
| `studio/backend/prisma/schema.prisma`                  | PreviewSession model (7 fields, no schema tracking yet)                                                                                                                                                                           |
| `studio/web/src/components/preview/preview-canvas.tsx` | Static mockup with `FeatureFlagProvider` → `PreviewContent`. Uses `hasFeature()` for conditional cards                                                                                                                            |
| `studio/web/src/components/preview/device-toolbar.tsx` | Device/theme toggles + reset/external buttons. Props: `onReset?`, `onOpenExternal?`. No live preview button                                                                                                                       |
| `studio/web/src/components/configurator/context.tsx`   | `useReducer` with 12 action types. Fetches features/tiers/templates from API. No `livePreview` state                                                                                                                              |
| `studio/web/src/lib/preview/hooks.ts`                  | `usePreviewSession` with local+backend session creation. Returns `{ session, isLoading, error, startSession, endSession, loadSessionFromToken }`                                                                                  |
| `studio/web/src/app/(public)/preview/page.tsx`         | Full preview page with URL param parsing, device toolbar, canvas, feature panel                                                                                                                                                   |
| `studio/web/src/lib/constants.ts`                      | `API_CONFIG.BASE_URL`, no preview URLs                                                                                                                                                                                            |
