# Backend Cheatsheet

> Clean, Maintainable, Robust, Production-Grade & Performant Server-Side (2025–2026 Edition)

---

## 1. Foundations & Architecture

### Technology Selection
| Stack | Best For | ORM/Query Builder |
|-------|----------|-------------------|
| **Node.js** (Express/Fastify/NestJS) | APIs, real-time, startups | Prisma, Drizzle, TypeORM |
| **Python** (FastAPI/Django) | ML/AI, data, rapid prototyping | SQLAlchemy, Django ORM |
| **Go** (Gin/Echo/Fiber) | High performance, microservices | GORM, sqlc |
| **Java/Kotlin** (Spring Boot) | Enterprise, complex domains | JPA/Hibernate |
| **Rust** (Axum/Actix) | Maximum performance, systems | SQLx, Diesel |

### Type Safety
- [ ] TypeScript with strict mode (Node.js)
- [ ] Python type hints + mypy
- [ ] Go's static typing
- [ ] Avoid `any` types - they defeat the purpose

### Clean Architecture
```
src/
├── config/           # Configuration, env loading
├── controllers/      # HTTP handlers (thin - validate, call service, respond)
├── services/         # Business logic (core - testable, no HTTP knowledge)
├── repositories/     # Data access (DB queries, external APIs)
├── middleware/       # Auth, logging, rate limiting, error handling
├── routes/           # Route definitions
├── types/            # Shared types/interfaces
├── utils/            # Pure utility functions
└── lib/              # External service clients (DB, Redis, S3)
```

### Principles
- [ ] Single responsibility - one module, one job
- [ ] Dependency injection for testability
- [ ] Controllers are thin - validate, delegate, respond
- [ ] Services contain business logic - no HTTP/DB details
- [ ] Repositories abstract data access - swappable
- [ ] Keep files < 200-300 lines

---

## 2. API Design

### RESTful Conventions
| Action | HTTP Method | URL Pattern | Response |
|--------|-------------|-------------|----------|
| List | GET | `/users` | 200 + array |
| Create | POST | `/users` | 201 + object |
| Read | GET | `/users/:id` | 200 + object |
| Update | PUT/PATCH | `/users/:id` | 200 + object |
| Delete | DELETE | `/users/:id` | 204 (no content) |

### HTTP Status Codes (Use Correctly!)
```
2xx Success
├── 200 OK              - General success
├── 201 Created         - Resource created (POST)
├── 204 No Content      - Success, nothing to return (DELETE)

4xx Client Errors
├── 400 Bad Request     - Validation failed, malformed request
├── 401 Unauthorized    - Not authenticated
├── 403 Forbidden       - Authenticated but not allowed
├── 404 Not Found       - Resource doesn't exist
├── 409 Conflict        - Duplicate, state conflict
├── 422 Unprocessable   - Semantic errors (optional, use 400)
├── 429 Too Many Requests - Rate limited

5xx Server Errors
├── 500 Internal Error  - Unexpected server error (log it!)
├── 502 Bad Gateway     - Upstream service failed
├── 503 Service Unavailable - Overloaded, maintenance
```

### Response Format (Consistent!)
```typescript
// Success
{
  "success": true,
  "data": { /* resource or array */ },
  "meta": { "page": 1, "total": 100 } // optional
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": [{ "field": "email", "message": "Required" }]
  }
}
```

### Versioning
- [ ] URL versioning: `/api/v1/users` (recommended - explicit)
- [ ] Header versioning: `Accept: application/vnd.api.v1+json`
- [ ] Plan for backwards compatibility
- [ ] Deprecation policy (warn in headers, sunset date)

### Checklist
- [ ] Nouns for resources, not verbs (`/users`, not `/getUsers`)
- [ ] Plural nouns (`/users`, not `/user`)
- [ ] Nested resources for relationships (`/users/:id/orders`)
- [ ] Query params for filtering/sorting (`?status=active&sort=-created`)
- [ ] Consistent error format across all endpoints
- [ ] OpenAPI/Swagger documentation auto-generated

---

## 3. Pagination, Filtering & Sorting

### Pagination Strategies
| Strategy | Pros | Cons | Use When |
|----------|------|------|----------|
| **Offset** (`?page=2&limit=20`) | Simple, random access | Slow on large datasets, inconsistent with inserts | Small datasets, admin panels |
| **Cursor** (`?cursor=abc123&limit=20`) | Consistent, performant | No random access | Feeds, infinite scroll |
| **Keyset** (`?after_id=123&limit=20`) | Very fast with index | Limited to sorted results | High-volume APIs |

### Implementation
```typescript
// Cursor-based pagination response
{
  "data": [...],
  "pagination": {
    "hasMore": true,
    "nextCursor": "eyJpZCI6MTIzfQ==",
    "total": 1000 // optional, expensive to compute
  }
}

// Offset-based pagination response
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 1000,
    "totalPages": 50
  }
}
```

### Filtering & Sorting
```
GET /users?status=active&role=admin          # Filtering
GET /users?sort=-createdAt,name              # Sorting (- = desc)
GET /users?fields=id,name,email              # Field selection
GET /users?search=john                       # Full-text search
```

- [ ] Validate filter parameters (whitelist allowed fields)
- [ ] Limit maximum page size (e.g., max 100)
- [ ] Default limit if not provided
- [ ] Index columns used in filters

---

## 4. Authentication & Authorization

### Authentication Patterns
| Pattern | Best For | Storage |
|---------|----------|---------|
| **JWT (stateless)** | APIs, mobile apps | Client-side |
| **Session (stateful)** | Traditional web apps | Server-side (Redis) |
| **OAuth 2.0** | Third-party login | Varies |
| **API Keys** | Service-to-service, public APIs | Database |

### JWT Best Practices
```typescript
// Token structure
{
  access_token: "eyJ...",      // Short-lived (15min - 1hr)
  refresh_token: "dGhpcy...",  // Long-lived (7-30 days)
  expires_in: 900,             // Seconds until access expires
  token_type: "Bearer"
}

// Access token payload (keep small!)
{
  "sub": "user-id-123",
  "email": "user@example.com",
  "role": "admin",
  "iat": 1234567890,
  "exp": 1234568790
}
```

### Token Flow
```
1. Login → Issue access + refresh tokens
2. Access token in Authorization header: Bearer <token>
3. On 401 → Use refresh token to get new access token
4. Refresh token rotation (issue new refresh on use)
5. Logout → Invalidate refresh token (blacklist or delete)
```

### Authorization Patterns
| Pattern | Description | Use When |
|---------|-------------|----------|
| **RBAC** | Role-based (admin, user, moderator) | Most applications |
| **ABAC** | Attribute-based (policies on attributes) | Complex, dynamic rules |
| **ACL** | Access control lists per resource | Document/file sharing |
| **ReBAC** | Relationship-based (Zanzibar model) | Social, collaborative apps |

### Checklist
- [ ] Hash passwords with Argon2id or bcrypt (cost ≥ 12)
- [ ] Short-lived access tokens (15min - 1hr)
- [ ] Refresh tokens stored securely (httpOnly cookie or encrypted storage)
- [ ] Refresh token rotation on use
- [ ] Rate limit auth endpoints heavily
- [ ] Account lockout after N failed attempts
- [ ] Secure password reset flow (time-limited tokens)
- [ ] MFA support for sensitive applications

---

## 5. Data Layer & Databases

### Database Selection
| Database | Best For | Avoid When |
|----------|----------|------------|
| **PostgreSQL** | Default choice, JSONB, full-text search | Extreme scale without sharding expertise |
| **MySQL** | Web apps, read-heavy workloads | Complex queries, JSON heavy |
| **MongoDB** | Flexible schemas, document storage | Complex relationships, transactions critical |
| **Redis** | Caching, sessions, queues, pub/sub | Primary data store |
| **DynamoDB** | Massive scale, predictable performance | Complex queries, ad-hoc analytics |

### Schema Design
- [ ] Normalize by default (3NF)
- [ ] Denormalize only when measured performance need
- [ ] Use appropriate data types (don't store dates as strings)
- [ ] NOT NULL constraints where applicable
- [ ] Foreign key constraints for referential integrity
- [ ] Check constraints for data validation
- [ ] UUIDs vs auto-increment (UUIDs for distributed, int for simplicity)

### Indexing Strategy
```sql
-- Always index:
-- 1. Primary keys (automatic)
-- 2. Foreign keys
-- 3. Columns used in WHERE clauses
-- 4. Columns used in ORDER BY
-- 5. Columns used in JOIN conditions

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_user_created ON orders(user_id, created_at DESC);

-- Partial indexes for filtered queries
CREATE INDEX idx_orders_pending ON orders(created_at) WHERE status = 'pending';

-- Analyze query plans
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';
```

### Query Optimization
- [ ] Avoid `SELECT *` - select only needed columns
- [ ] Use `EXPLAIN ANALYZE` to understand query plans
- [ ] Avoid N+1 queries - use eager loading or DataLoader
- [ ] Batch inserts/updates when possible
- [ ] Use connection pooling (never new connection per request)
- [ ] Consider read replicas for read-heavy workloads

### Migrations
- [ ] Version-controlled migrations (Prisma Migrate, Flyway, Alembic)
- [ ] Every migration has a rollback (down migration)
- [ ] Test migrations on copy of production data
- [ ] Zero-downtime migrations (add column → backfill → make required)
- [ ] Never delete columns immediately - deprecate first

### Transactions
```typescript
// Use transactions for multi-operation consistency
await prisma.$transaction(async (tx) => {
  const order = await tx.order.create({ data: orderData });
  await tx.inventory.update({
    where: { productId },
    data: { quantity: { decrement: 1 } },
  });
  await tx.payment.create({ data: { orderId: order.id, ...paymentData } });
});
```

---

## 6. Input Validation & Sanitization

### Validation Libraries
| Library | Language |
|---------|----------|
| **Zod** | TypeScript/JavaScript |
| **Joi** | JavaScript |
| **class-validator** | TypeScript (decorators) |
| **Pydantic** | Python |
| **go-playground/validator** | Go |

### Validation Patterns
```typescript
// Zod example - define once, use everywhere
const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(100),
  age: z.number().int().positive().optional(),
});

// In controller
const result = createUserSchema.safeParse(req.body);
if (!result.success) {
  return res.status(400).json({
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      details: result.error.issues,
    },
  });
}
```

### Sanitization
- [ ] Trim whitespace from strings
- [ ] Normalize emails (lowercase)
- [ ] Escape HTML in user-generated content
- [ ] Strip null bytes and control characters
- [ ] Validate file types by content, not extension
- [ ] Limit string lengths at database level too

### Checklist
- [ ] Validate ALL input (body, query, params, headers)
- [ ] Validate on backend even if frontend validates
- [ ] Use allowlists over blocklists
- [ ] Parameterized queries (prevent SQL injection)
- [ ] Validate file uploads (type, size, content)
- [ ] Rate limit by IP/user to prevent abuse

---

## 7. Error Handling

### Centralized Error Handler
```typescript
// Custom error classes
class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public isOperational = true
  ) {
    super(message);
  }
}

class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, 'NOT_FOUND', `${resource} not found`);
  }
}

class ValidationError extends AppError {
  constructor(message: string, public details?: unknown) {
    super(400, 'VALIDATION_ERROR', message);
  }
}

// Global error handler middleware
function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  // Log error
  logger.error({
    error: err.message,
    stack: err.stack,
    requestId: req.id,
    path: req.path,
    method: req.method,
  });

  // Send to error tracking
  if (!isOperationalError(err)) {
    Sentry.captureException(err);
  }

  // Respond
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const code = err instanceof AppError ? err.code : 'INTERNAL_ERROR';
  const message = err instanceof AppError ? err.message : 'Something went wrong';

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message: process.env.NODE_ENV === 'production' && statusCode === 500
        ? 'Internal server error'
        : message,
    },
  });
}
```

### Error Categories
| Category | Example | Action |
|----------|---------|--------|
| **Operational** | Validation failed, not found, rate limited | Return error to client |
| **Programming** | TypeError, null reference | Log, alert, return 500 |
| **External** | Database down, API timeout | Retry, circuit breaker, graceful degradation |

### Checklist
- [ ] Centralized error handler (don't catch everywhere)
- [ ] Custom error classes with codes
- [ ] Never expose stack traces in production
- [ ] Log errors with context (request ID, user, path)
- [ ] Send to error tracking (Sentry, Rollbar)
- [ ] Different handling for operational vs programming errors
- [ ] Graceful degradation for non-critical features

---

## 8. Logging & Observability

### Structured Logging
```typescript
// Use structured JSON logging
logger.info({
  event: 'user_created',
  userId: user.id,
  email: user.email,
  requestId: req.id,
  duration: 145,
});

// NOT this
logger.info(`User ${user.id} created with email ${user.email}`);
```

### Log Levels
| Level | When to Use |
|-------|-------------|
| **error** | Failures requiring immediate attention |
| **warn** | Unexpected but handled situations |
| **info** | Business events (user signup, payment) |
| **debug** | Development troubleshooting |

### Correlation IDs
```typescript
// Middleware to add request ID
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('x-request-id', req.id);
  next();
});

// Include in all logs
logger.info({ requestId: req.id, event: 'order_placed' });
```

### Logging Libraries
| Library | Language |
|---------|----------|
| **Pino** | Node.js (fastest) |
| **Winston** | Node.js (feature-rich) |
| **structlog** | Python |
| **Zap** | Go |
| **Logback** | Java |

### Checklist
- [ ] Structured JSON logging
- [ ] Correlation IDs across all logs
- [ ] Log levels used appropriately
- [ ] No sensitive data in logs (passwords, tokens, PII)
- [ ] Request/response logging (configurable verbosity)
- [ ] Centralized log aggregation (Loki, ELK, CloudWatch)
- [ ] Error tracking integration (Sentry)

---

## 9. Caching

### Caching Layers
```
Request → CDN (static assets, cached responses)
       → Application cache (Redis - sessions, computed data)
       → Database cache (query cache, connection pool)
       → Database
```

### Cache Strategies
| Strategy | Description | Use When |
|----------|-------------|----------|
| **Cache-Aside** | App checks cache, fetches from DB if miss | Most common, flexible |
| **Write-Through** | Write to cache and DB together | Consistency critical |
| **Write-Behind** | Write to cache, async write to DB | High write volume |
| **Refresh-Ahead** | Proactively refresh before expiry | Predictable access patterns |

### Cache-Aside Pattern
```typescript
async function getUser(id: string): Promise<User> {
  const cacheKey = `user:${id}`;

  // Check cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fetch from DB
  const user = await db.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError('User');

  // Store in cache
  await redis.set(cacheKey, JSON.stringify(user), 'EX', 3600); // 1 hour

  return user;
}

// Invalidation on update
async function updateUser(id: string, data: UpdateUserData): Promise<User> {
  const user = await db.user.update({ where: { id }, data });
  await redis.del(`user:${id}`); // Invalidate cache
  return user;
}
```

### HTTP Caching
```typescript
// Cache-Control headers
res.setHeader('Cache-Control', 'public, max-age=3600'); // CDN + browser
res.setHeader('Cache-Control', 'private, max-age=0');   // No caching
res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

// ETag for conditional requests
const etag = generateETag(data);
res.setHeader('ETag', etag);

if (req.headers['if-none-match'] === etag) {
  return res.status(304).end(); // Not Modified
}
```

### Checklist
- [ ] Identify cacheable data (read-heavy, slow to compute)
- [ ] Set appropriate TTLs (balance freshness vs performance)
- [ ] Cache invalidation strategy defined
- [ ] Handle cache stampede (locking, stale-while-revalidate)
- [ ] Monitor cache hit rates
- [ ] Graceful degradation when cache unavailable

---

## 10. Background Jobs & Queues

### Queue Selection
| Queue | Best For |
|-------|----------|
| **BullMQ** (Redis) | Node.js, full-featured |
| **Celery** (Redis/RabbitMQ) | Python |
| **Sidekiq** (Redis) | Ruby |
| **RabbitMQ** | Complex routing, multiple consumers |
| **Kafka** | High-volume event streaming |
| **AWS SQS** | Serverless, managed |

### Job Patterns
```typescript
// Producer - enqueue job
await emailQueue.add('send-welcome', {
  userId: user.id,
  email: user.email,
}, {
  attempts: 3,
  backoff: { type: 'exponential', delay: 1000 },
  removeOnComplete: true,
});

// Consumer - process job
emailQueue.process('send-welcome', async (job) => {
  const { userId, email } = job.data;
  await sendWelcomeEmail(email);
  await updateUser(userId, { welcomeEmailSent: true });
});
```

### Job Design Principles
- [ ] Jobs are idempotent (safe to retry)
- [ ] Jobs are small and focused
- [ ] Store job data, not references (data might change)
- [ ] Set reasonable timeouts
- [ ] Implement dead letter queues for failed jobs
- [ ] Monitor queue depth and processing time

### Common Use Cases
- Email/SMS sending
- Image/video processing
- Report generation
- Data imports/exports
- Scheduled tasks (cron)
- Webhook delivery

---

## 11. Rate Limiting

### Strategies
| Strategy | Description | Use Case |
|----------|-------------|----------|
| **Fixed Window** | N requests per time window | Simple, may burst at boundaries |
| **Sliding Window** | Smooth rate over rolling window | More accurate, slightly complex |
| **Token Bucket** | Tokens replenish over time | Allow bursts up to bucket size |
| **Leaky Bucket** | Process at fixed rate | Smooth output rate |

### Implementation
```typescript
// Rate limit configuration by plan
const RATE_LIMITS = {
  free: { requests: 100, window: '1m' },
  pro: { requests: 1000, window: '1m' },
  enterprise: { requests: 10000, window: '1m' },
};

// Cost-based rate limiting
const ENDPOINT_COSTS = {
  'GET /users': 1,
  'POST /search': 3,
  'POST /upload': 5,
};

// Response headers
res.setHeader('X-RateLimit-Limit', limit);
res.setHeader('X-RateLimit-Remaining', remaining);
res.setHeader('X-RateLimit-Reset', resetTime);
res.setHeader('Retry-After', retryAfter); // On 429
```

### Checklist
- [ ] Rate limit by IP for public endpoints
- [ ] Rate limit by user/API key for authenticated endpoints
- [ ] Different limits for different plans
- [ ] Higher limits for critical endpoints (login)
- [ ] Return proper 429 status with Retry-After header
- [ ] Log rate limit hits for abuse detection
- [ ] Consider geographic distribution (Redis cluster)

---

## 12. Security

### OWASP Top 10 Mitigations
| Risk | Mitigation |
|------|------------|
| **Injection** | Parameterized queries, input validation |
| **Broken Auth** | Strong passwords, MFA, rate limiting |
| **Sensitive Data** | Encryption at rest/transit, minimal data |
| **XXE** | Disable XML external entities |
| **Broken Access** | Authorization checks at every layer |
| **Misconfiguration** | Security headers, disable debug in prod |
| **XSS** | Output encoding, CSP headers |
| **Insecure Deserialization** | Validate before deserializing |
| **Known Vulnerabilities** | Dependency scanning, updates |
| **Insufficient Logging** | Comprehensive audit logging |

### Security Headers
```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
}));
```

### Secrets Management
- [ ] Never commit secrets to version control
- [ ] Use environment variables or secret managers
- [ ] Rotate secrets regularly
- [ ] Different secrets per environment
- [ ] Audit secret access

### Checklist
- [ ] HTTPS everywhere (HSTS enabled)
- [ ] Security headers configured (helmet or equivalent)
- [ ] CORS properly configured (not `*` in production)
- [ ] Input validation on all endpoints
- [ ] Parameterized queries (no SQL injection)
- [ ] Password hashing (Argon2id, bcrypt)
- [ ] Rate limiting active
- [ ] Dependency scanning in CI (npm audit, Snyk)
- [ ] Secrets in environment/secret manager

---

## 13. File Handling

### Upload Best Practices
```typescript
// Validate before processing
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

app.post('/upload', upload.single('file'), async (req, res) => {
  const file = req.file;

  // Validate type by content, not extension
  const fileType = await fileTypeFromBuffer(file.buffer);
  if (!fileType || !ALLOWED_TYPES.includes(fileType.mime)) {
    throw new ValidationError('Invalid file type');
  }

  // Validate size
  if (file.size > MAX_SIZE) {
    throw new ValidationError('File too large');
  }

  // Generate safe filename
  const filename = `${crypto.randomUUID()}.${fileType.ext}`;

  // Upload to storage
  await s3.upload({ Bucket: BUCKET, Key: filename, Body: file.buffer });

  res.json({ url: `${CDN_URL}/${filename}` });
});
```

### Storage Options
| Storage | Best For |
|---------|----------|
| **S3/MinIO** | Files, images, documents |
| **Cloudflare R2** | S3-compatible, no egress fees |
| **Local filesystem** | Development only |
| **Database (BLOB)** | Small files, transactional integrity |

### Checklist
- [ ] Validate file type by content (magic bytes)
- [ ] Enforce size limits
- [ ] Generate random filenames (prevent enumeration)
- [ ] Scan for malware (ClamAV, external service)
- [ ] Serve through CDN
- [ ] Set proper Content-Type and Content-Disposition
- [ ] Consider virus scanning for user uploads

---

## 14. Webhooks (Outgoing)

### Reliable Webhook Delivery
```typescript
// Webhook job with retry
await webhookQueue.add('deliver', {
  url: subscription.webhookUrl,
  event: 'order.created',
  payload: orderData,
  signature: generateSignature(orderData, subscription.secret),
}, {
  attempts: 5,
  backoff: { type: 'exponential', delay: 60000 }, // 1min, 2min, 4min...
});

// Webhook processor
webhookQueue.process('deliver', async (job) => {
  const { url, event, payload, signature } = job.data;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': signature,
      'X-Webhook-Event': event,
      'X-Webhook-Timestamp': Date.now().toString(),
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30000), // 30s timeout
  });

  if (!response.ok) {
    throw new Error(`Webhook failed: ${response.status}`);
  }
});
```

### Webhook Security
- [ ] HMAC signature for payload verification
- [ ] Include timestamp to prevent replay attacks
- [ ] Document signature verification for consumers
- [ ] Allow consumers to verify webhook source IPs

---

## 15. Graceful Shutdown

```typescript
// Handle shutdown signals
const shutdown = async (signal: string) => {
  logger.info({ event: 'shutdown_started', signal });

  // Stop accepting new requests
  server.close();

  // Wait for in-flight requests (with timeout)
  await Promise.race([
    new Promise((resolve) => server.on('close', resolve)),
    new Promise((resolve) => setTimeout(resolve, 30000)),
  ]);

  // Close connections
  await Promise.all([
    prisma.$disconnect(),
    redis.quit(),
    queue.close(),
  ]);

  logger.info({ event: 'shutdown_complete' });
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
```

### Health Checks
```typescript
// Liveness - is the process running?
app.get('/health/live', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Readiness - can it handle requests?
app.get('/health/ready', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await redis.ping();
    res.status(200).json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: error.message });
  }
});
```

---

## 16. Testing

### Testing Pyramid
```
         ╱╲
        ╱  ╲      E2E (few, critical paths)
       ╱────╲
      ╱      ╲    Integration (API + DB)
     ╱────────╲
    ╱          ╲  Unit (services, utils)
   ╱────────────╲
```

### Test Types
| Type | Scope | Tools |
|------|-------|-------|
| **Unit** | Functions, services | Jest, Vitest, pytest |
| **Integration** | API + DB | Supertest, Testcontainers |
| **Contract** | API contracts between services | Pact |
| **Load** | Performance under load | k6, Artillery |

### Integration Test Example
```typescript
describe('POST /users', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  it('creates a user with valid data', async () => {
    const response = await request(app)
      .post('/api/v1/users')
      .send({
        email: 'test@example.com',
        password: 'SecurePassword123!',
        name: 'Test User',
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.email).toBe('test@example.com');
    expect(response.body.data).not.toHaveProperty('password');
  });

  it('returns 400 for invalid email', async () => {
    const response = await request(app)
      .post('/api/v1/users')
      .send({ email: 'invalid', password: 'password123' })
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
```

### Checklist
- [ ] 80%+ coverage on business logic
- [ ] Test happy path + edge cases + error cases
- [ ] Use test database (not mocks for integration tests)
- [ ] Testcontainers for realistic DB/queue testing
- [ ] Load test before launch
- [ ] Tests run in CI - never merge without passing

---

## 17. Deployment & Operations

### Docker Best Practices
```dockerfile
# Multi-stage build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Non-root user
RUN addgroup -S app && adduser -S app -G app
USER app

COPY --from=builder --chown=app:app /app/dist ./dist
COPY --from=builder --chown=app:app /app/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/package.json ./

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### Environment Parity
- [ ] Dev ≈ Staging ≈ Production
- [ ] Same Docker images across environments
- [ ] Different config via environment variables
- [ ] Secrets injected at runtime, not in images

### Zero-Downtime Deploys
- [ ] Rolling updates (Kubernetes default)
- [ ] Blue-green deployments for instant rollback
- [ ] Database migrations backwards-compatible
- [ ] Feature flags for gradual rollout

---

## Pre-Launch Checklist

### Security
- [ ] HTTPS enforced (HSTS enabled)
- [ ] Security headers configured
- [ ] Input validation on all endpoints
- [ ] Authentication & authorization tested
- [ ] Rate limiting active
- [ ] Secrets not in code/repo
- [ ] Dependencies scanned for vulnerabilities

### Reliability
- [ ] Error handling centralized
- [ ] Errors logged & tracked (Sentry)
- [ ] Graceful shutdown implemented
- [ ] Health checks working
- [ ] Database indexes in place
- [ ] Connection pooling configured

### Performance
- [ ] Caching strategy implemented
- [ ] N+1 queries eliminated
- [ ] Load test passed
- [ ] Database queries analyzed

### Operations
- [ ] CI/CD pipeline green
- [ ] Monitoring & alerts configured
- [ ] Logging centralized
- [ ] Backup strategy tested
- [ ] Runbooks documented

---

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [12 Factor App](https://12factor.net/)
- [REST API Design](https://restfulapi.net/)
- [PostgreSQL Performance](https://www.postgresql.org/docs/current/performance-tips.html)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [System Design Primer](https://github.com/donnemartin/system-design-primer)

---

*Last updated: February 2026*
