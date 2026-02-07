# Database & ORM Cheatsheet

> PostgreSQL, Prisma, Query Optimization & Schema Design (2025–2026 Edition)

---

## 1. Database Selection

### When to Use What
| Database | Best For | Avoid When |
|----------|----------|------------|
| **PostgreSQL** | Default choice, complex queries, JSONB, full-text search, geospatial | Extreme horizontal scale without expertise |
| **MySQL/MariaDB** | Read-heavy web apps, simpler use cases | Complex queries, JSON-heavy, need advanced features |
| **SQLite** | Embedded, local-first, edge computing, testing | Concurrent writes, large scale |
| **MongoDB** | Flexible schemas, document storage, rapid prototyping | Complex relationships, transactions critical |
| **Redis** | Caching, sessions, queues, real-time leaderboards | Primary data store, complex queries |
| **DynamoDB** | Massive scale, predictable latency, serverless | Ad-hoc queries, complex relationships |
| **ClickHouse** | Analytics, time-series, aggregations | OLTP, frequent updates |

### PostgreSQL: The Default Choice
```
✓ ACID compliant
✓ Rich data types (JSONB, arrays, hstore, UUID, inet)
✓ Full-text search built-in
✓ Window functions, CTEs, lateral joins
✓ Extensions (PostGIS, pg_trgm, pgvector)
✓ Excellent query planner
✓ Strong community & tooling
```

---

## 2. Schema Design Principles

### Normalization Levels
| Normal Form | Rule | Example |
|-------------|------|---------|
| **1NF** | Atomic values, no repeating groups | No `tags: "a,b,c"` → use array or junction table |
| **2NF** | 1NF + no partial dependencies | All non-key columns depend on full primary key |
| **3NF** | 2NF + no transitive dependencies | No `order.customer_name` → use `customer_id` |
| **BCNF** | 3NF + every determinant is a candidate key | Rarely needed in practice |

### When to Denormalize
```
✓ Read-heavy workloads (95%+ reads)
✓ Expensive joins on hot paths
✓ Caching computed values
✓ Reporting/analytics tables
✓ Audit logs (snapshot at time of event)

✗ Don't denormalize prematurely
✗ Don't denormalize write-heavy data
✗ Don't forget update complexity
```

### Essential Table Patterns

#### Standard Columns
```sql
CREATE TABLE users (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- OR: id SERIAL PRIMARY KEY (auto-increment)

  -- Business columns
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(100),

  -- Timestamps (always include)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Soft delete (optional)
  deleted_at TIMESTAMPTZ
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

#### Audit Columns
```sql
-- For tables needing audit trail
created_by UUID REFERENCES users(id),
updated_by UUID REFERENCES users(id),
```

#### Soft Deletes vs Hard Deletes
| Approach | Pros | Cons |
|----------|------|------|
| **Soft Delete** (`deleted_at`) | Recovery, audit trail, referential integrity | Query complexity, storage |
| **Hard Delete** | Clean, simple queries | No recovery, cascade issues |
| **Archive Table** | Clean main table, full history | Complex, sync issues |

```sql
-- Soft delete queries always filter
SELECT * FROM users WHERE deleted_at IS NULL;

-- Create a view for convenience
CREATE VIEW active_users AS
SELECT * FROM users WHERE deleted_at IS NULL;
```

### Primary Key Strategies
| Type | Pros | Cons | Use When |
|------|------|------|----------|
| **Serial/Identity** | Simple, compact, sortable | Predictable, not distributed-safe | Single database, internal IDs |
| **UUID v4** | Globally unique, no coordination | Larger, random (index fragmentation) | Distributed, exposed in URLs |
| **UUID v7** | Globally unique, time-sortable | Larger, newer standard | Distributed, need ordering |
| **ULID** | Sortable, URL-safe | Less tooling | API-facing IDs |
| **Nanoid** | Short, URL-safe, customizable | No time component | Short public IDs |

```sql
-- UUID v4 (random)
id UUID PRIMARY KEY DEFAULT gen_random_uuid()

-- UUID v7 (time-sortable) - requires extension or application generation
-- SERIAL (auto-increment)
id SERIAL PRIMARY KEY

-- BIGSERIAL for large tables
id BIGSERIAL PRIMARY KEY
```

---

## 3. Relationships & Constraints

### Relationship Types
```sql
-- One-to-Many (most common)
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT
);

-- Many-to-Many (junction table)
CREATE TABLE post_tags (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- One-to-One (rare - usually merge tables)
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  avatar_url VARCHAR(500)
);
```

### Foreign Key Actions
| Action | ON DELETE | ON UPDATE | Use When |
|--------|-----------|-----------|----------|
| **CASCADE** | Delete children | Update children | Owned relationships (user→posts) |
| **SET NULL** | Set FK to NULL | Set FK to NULL | Optional relationships |
| **SET DEFAULT** | Set FK to default | Set FK to default | Fallback value exists |
| **RESTRICT** | Prevent delete | Prevent update | Protect critical data |
| **NO ACTION** | Check at end of transaction | Check at end | Deferrable constraints |

### Constraints
```sql
-- Check constraints
CREATE TABLE products (
  id UUID PRIMARY KEY,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  quantity INTEGER NOT NULL CHECK (quantity >= 0),
  status VARCHAR(20) CHECK (status IN ('draft', 'active', 'archived'))
);

-- Unique constraints (multi-column)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  plan_id UUID REFERENCES plans(id),
  UNIQUE (user_id, plan_id)  -- One subscription per plan per user
);

-- Partial unique (unique where condition)
CREATE UNIQUE INDEX unique_active_subscription
ON subscriptions (user_id)
WHERE status = 'active';  -- Only one active subscription per user
```

---

## 4. Indexing Strategy

### Index Types in PostgreSQL
| Type | Use Case | Example |
|------|----------|---------|
| **B-tree** (default) | Equality, range, sorting | `WHERE id = ?`, `ORDER BY created_at` |
| **Hash** | Equality only (rarely used) | `WHERE id = ?` (B-tree usually better) |
| **GIN** | Arrays, JSONB, full-text | `WHERE tags @> ARRAY['tag']` |
| **GiST** | Geometry, range types, full-text | PostGIS, overlapping ranges |
| **BRIN** | Large sequential data | Time-series, logs (very compact) |

### What to Index
```sql
-- ✓ Always index
-- 1. Foreign keys (not auto-indexed in PostgreSQL!)
CREATE INDEX idx_posts_user_id ON posts(user_id);

-- 2. Columns in WHERE clauses
CREATE INDEX idx_users_email ON users(email);

-- 3. Columns in ORDER BY
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

-- 4. Columns in JOIN conditions
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
```

### Composite Indexes
```sql
-- Order matters! Left-to-right
CREATE INDEX idx_orders_user_status_date
ON orders(user_id, status, created_at DESC);

-- This index serves:
-- ✓ WHERE user_id = ?
-- ✓ WHERE user_id = ? AND status = ?
-- ✓ WHERE user_id = ? AND status = ? ORDER BY created_at DESC
-- ✗ WHERE status = ? (can't use index, user_id must come first)
```

### Partial Indexes
```sql
-- Index only active records (smaller, faster)
CREATE INDEX idx_orders_pending
ON orders(created_at)
WHERE status = 'pending';

-- Index only non-null values
CREATE INDEX idx_users_verified
ON users(verified_at)
WHERE verified_at IS NOT NULL;
```

### Expression Indexes
```sql
-- Index on computed value
CREATE INDEX idx_users_email_lower ON users(LOWER(email));

-- Query must match expression exactly
SELECT * FROM users WHERE LOWER(email) = 'test@example.com';

-- Index on JSONB field
CREATE INDEX idx_settings_theme ON user_settings((data->>'theme'));
```

### Covering Indexes (Index-Only Scans)
```sql
-- Include columns to avoid table lookup
CREATE INDEX idx_users_email_covering
ON users(email)
INCLUDE (name, created_at);

-- Query satisfied entirely from index
SELECT name, created_at FROM users WHERE email = 'test@example.com';
```

### Index Checklist
- [ ] Index all foreign keys
- [ ] Index columns in WHERE clauses (if selective)
- [ ] Index columns in ORDER BY
- [ ] Use composite indexes for common query patterns
- [ ] Consider partial indexes for filtered queries
- [ ] Don't over-index (slows writes, uses space)
- [ ] Remove unused indexes (`pg_stat_user_indexes`)
- [ ] Analyze index usage regularly

---

## 5. Query Optimization

### EXPLAIN ANALYZE
```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM orders
WHERE user_id = '123'
  AND status = 'pending'
ORDER BY created_at DESC
LIMIT 10;
```

### Reading Query Plans
```
Limit  (cost=0.43..12.34 rows=10) (actual time=0.045..0.089 rows=10 loops=1)
  ->  Index Scan using idx_orders_user_status on orders
        (cost=0.43..156.78 rows=100) (actual time=0.044..0.086 rows=10 loops=1)
        Index Cond: ((user_id = '123') AND (status = 'pending'))
        Buffers: shared hit=5
Planning Time: 0.123 ms
Execution Time: 0.112 ms
```

| Term | Meaning |
|------|---------|
| **Seq Scan** | Full table scan (usually bad for large tables) |
| **Index Scan** | Using index, fetches rows from table |
| **Index Only Scan** | Satisfied entirely from index (best) |
| **Bitmap Heap Scan** | Index identifies rows, then fetches in batch |
| **Nested Loop** | For each row in outer, scan inner |
| **Hash Join** | Build hash table, probe with other table |
| **Merge Join** | Both inputs sorted, merge together |
| **cost** | Estimated cost (arbitrary units) |
| **rows** | Estimated vs actual row count |
| **Buffers: shared hit** | Pages read from cache (good) |
| **Buffers: shared read** | Pages read from disk (slow) |

### Common Anti-Patterns

#### N+1 Query Problem
```typescript
// ❌ BAD: N+1 queries
const users = await prisma.user.findMany();
for (const user of users) {
  const posts = await prisma.post.findMany({ where: { userId: user.id } });
}

// ✓ GOOD: Eager loading
const users = await prisma.user.findMany({
  include: { posts: true }
});

// ✓ GOOD: Separate query with IN
const users = await prisma.user.findMany();
const posts = await prisma.post.findMany({
  where: { userId: { in: users.map(u => u.id) } }
});
```

#### SELECT *
```sql
-- ❌ BAD: Fetches all columns
SELECT * FROM users WHERE id = '123';

-- ✓ GOOD: Only needed columns
SELECT id, email, name FROM users WHERE id = '123';
```

#### Functions on Indexed Columns
```sql
-- ❌ BAD: Can't use index on created_at
SELECT * FROM orders WHERE YEAR(created_at) = 2024;

-- ✓ GOOD: Range query uses index
SELECT * FROM orders
WHERE created_at >= '2024-01-01'
  AND created_at < '2025-01-01';
```

#### OR Conditions
```sql
-- ❌ SLOW: May not use indexes efficiently
SELECT * FROM users WHERE email = 'a@x.com' OR phone = '123';

-- ✓ FASTER: UNION (if both columns indexed)
SELECT * FROM users WHERE email = 'a@x.com'
UNION
SELECT * FROM users WHERE phone = '123';
```

#### LIKE with Leading Wildcard
```sql
-- ❌ Can't use index
SELECT * FROM products WHERE name LIKE '%phone%';

-- ✓ Can use index (prefix match)
SELECT * FROM products WHERE name LIKE 'phone%';

-- ✓ For substring search, use full-text search or pg_trgm
CREATE INDEX idx_products_name_trgm ON products USING GIN (name gin_trgm_ops);
SELECT * FROM products WHERE name ILIKE '%phone%';
```

### Query Optimization Checklist
- [ ] Use EXPLAIN ANALYZE on slow queries
- [ ] Avoid Seq Scan on large tables
- [ ] Check estimated vs actual row counts (statistics outdated?)
- [ ] Look for high buffer reads (caching issue?)
- [ ] Avoid functions on indexed columns in WHERE
- [ ] Use appropriate LIMIT for paginated queries
- [ ] VACUUM ANALYZE regularly (or autovacuum)

---

## 6. PostgreSQL Advanced Features

### JSONB
```sql
-- Store flexible data
CREATE TABLE products (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  attributes JSONB DEFAULT '{}'
);

-- Insert
INSERT INTO products (id, name, attributes) VALUES (
  gen_random_uuid(),
  'Laptop',
  '{"brand": "Apple", "specs": {"ram": 16, "storage": 512}}'
);

-- Query JSONB
SELECT * FROM products WHERE attributes->>'brand' = 'Apple';
SELECT * FROM products WHERE attributes @> '{"brand": "Apple"}';
SELECT * FROM products WHERE (attributes->'specs'->>'ram')::int >= 16;

-- Index JSONB
CREATE INDEX idx_products_attributes ON products USING GIN (attributes);
CREATE INDEX idx_products_brand ON products ((attributes->>'brand'));

-- Update JSONB
UPDATE products
SET attributes = jsonb_set(attributes, '{specs,ram}', '32')
WHERE id = '...';
```

### Arrays
```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY,
  title VARCHAR(255),
  tags TEXT[] DEFAULT '{}'
);

-- Insert
INSERT INTO posts (id, title, tags) VALUES
  (gen_random_uuid(), 'My Post', ARRAY['tech', 'coding']);

-- Query
SELECT * FROM posts WHERE 'tech' = ANY(tags);
SELECT * FROM posts WHERE tags @> ARRAY['tech', 'coding'];  -- Contains all

-- Index
CREATE INDEX idx_posts_tags ON posts USING GIN (tags);
```

### Common Table Expressions (CTEs)
```sql
-- Readable subqueries
WITH active_users AS (
  SELECT id, email, name
  FROM users
  WHERE last_login_at > NOW() - INTERVAL '30 days'
),
user_order_counts AS (
  SELECT user_id, COUNT(*) as order_count
  FROM orders
  WHERE created_at > NOW() - INTERVAL '30 days'
  GROUP BY user_id
)
SELECT
  u.email,
  u.name,
  COALESCE(o.order_count, 0) as recent_orders
FROM active_users u
LEFT JOIN user_order_counts o ON u.id = o.user_id
ORDER BY recent_orders DESC;

-- Recursive CTE (hierarchies, trees)
WITH RECURSIVE category_tree AS (
  -- Base case: root categories
  SELECT id, name, parent_id, 1 as depth, ARRAY[id] as path
  FROM categories
  WHERE parent_id IS NULL

  UNION ALL

  -- Recursive case: children
  SELECT c.id, c.name, c.parent_id, ct.depth + 1, ct.path || c.id
  FROM categories c
  JOIN category_tree ct ON c.parent_id = ct.id
  WHERE ct.depth < 10  -- Prevent infinite loops
)
SELECT * FROM category_tree ORDER BY path;
```

### Window Functions
```sql
-- Ranking
SELECT
  name,
  score,
  ROW_NUMBER() OVER (ORDER BY score DESC) as rank,
  DENSE_RANK() OVER (ORDER BY score DESC) as dense_rank,
  PERCENT_RANK() OVER (ORDER BY score DESC) as percentile
FROM players;

-- Running totals
SELECT
  date,
  revenue,
  SUM(revenue) OVER (ORDER BY date) as running_total,
  AVG(revenue) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as weekly_avg
FROM daily_sales;

-- Partition by group
SELECT
  department,
  employee,
  salary,
  AVG(salary) OVER (PARTITION BY department) as dept_avg,
  salary - AVG(salary) OVER (PARTITION BY department) as diff_from_avg
FROM employees;

-- Lead/Lag (previous/next row)
SELECT
  date,
  revenue,
  LAG(revenue) OVER (ORDER BY date) as prev_day,
  revenue - LAG(revenue) OVER (ORDER BY date) as daily_change
FROM daily_sales;
```

### Full-Text Search
```sql
-- Add search vector column
ALTER TABLE posts ADD COLUMN search_vector tsvector;

-- Populate and keep updated
UPDATE posts SET search_vector =
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(content, '')), 'B');

CREATE INDEX idx_posts_search ON posts USING GIN (search_vector);

-- Auto-update trigger
CREATE TRIGGER posts_search_update
  BEFORE INSERT OR UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION
  tsvector_update_trigger(search_vector, 'pg_catalog.english', title, content);

-- Search
SELECT * FROM posts
WHERE search_vector @@ plainto_tsquery('english', 'database optimization')
ORDER BY ts_rank(search_vector, plainto_tsquery('english', 'database optimization')) DESC;
```

### Upsert (INSERT ... ON CONFLICT)
```sql
-- Insert or update
INSERT INTO user_settings (user_id, key, value)
VALUES ('user-123', 'theme', 'dark')
ON CONFLICT (user_id, key)
DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- Insert or ignore
INSERT INTO tags (name)
VALUES ('tech')
ON CONFLICT (name) DO NOTHING;
```

---

## 7. Prisma ORM

### Schema Design
```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  role      Role     @default(USER)

  posts     Post[]
  profile   Profile?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  @@index([email])
  @@map("users")  // Table name
}

model Post {
  id        String   @id @default(uuid())
  title     String
  content   String?
  published Boolean  @default(false)

  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  authorId  String

  tags      Tag[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([authorId])
  @@index([published, createdAt(sort: Desc)])
  @@map("posts")
}

model Tag {
  id    String @id @default(uuid())
  name  String @unique
  posts Post[]

  @@map("tags")
}

model Profile {
  id     String  @id @default(uuid())
  bio    String?
  avatar String?

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId String @unique

  @@map("profiles")
}

enum Role {
  USER
  ADMIN
}
```

### Basic CRUD
```typescript
// Create
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    name: 'John Doe',
    profile: {
      create: { bio: 'Hello world' }
    }
  },
  include: { profile: true }
});

// Read
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: { posts: true, profile: true }
});

const users = await prisma.user.findMany({
  where: {
    email: { contains: '@example.com' },
    deletedAt: null,
  },
  orderBy: { createdAt: 'desc' },
  take: 20,
  skip: 0,
});

// Update
const user = await prisma.user.update({
  where: { id: userId },
  data: { name: 'Jane Doe' },
});

// Upsert
const user = await prisma.user.upsert({
  where: { email: 'user@example.com' },
  update: { name: 'Updated Name' },
  create: { email: 'user@example.com', name: 'New User' },
});

// Delete
await prisma.user.delete({ where: { id: userId } });

// Soft delete
await prisma.user.update({
  where: { id: userId },
  data: { deletedAt: new Date() },
});
```

### Relations & Includes
```typescript
// Nested includes
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    posts: {
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        tags: true,
      },
    },
    profile: true,
  },
});

// Select specific fields (reduces data transfer)
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    email: true,
    name: true,
    posts: {
      select: { id: true, title: true },
      take: 5,
    },
  },
});
```

### Transactions
```typescript
// Sequential transaction
const [user, post] = await prisma.$transaction([
  prisma.user.create({ data: userData }),
  prisma.post.create({ data: postData }),
]);

// Interactive transaction (with logic)
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.findUnique({ where: { id: userId } });

  if (!user) throw new Error('User not found');

  const order = await tx.order.create({
    data: { userId: user.id, ...orderData },
  });

  await tx.inventory.update({
    where: { productId },
    data: { quantity: { decrement: 1 } },
  });

  return order;
}, {
  maxWait: 5000,  // Wait for transaction slot
  timeout: 10000, // Transaction timeout
});
```

### Raw Queries
```typescript
// Raw query (when ORM isn't enough)
const users = await prisma.$queryRaw<User[]>`
  SELECT * FROM users
  WHERE email ILIKE ${`%${search}%`}
  ORDER BY created_at DESC
  LIMIT ${limit}
`;

// Raw execute (for complex updates)
await prisma.$executeRaw`
  UPDATE products
  SET price = price * 1.1
  WHERE category_id = ${categoryId}
`;

// Type-safe raw with Prisma.sql
import { Prisma } from '@prisma/client';

const orderBy = Prisma.sql`ORDER BY ${Prisma.raw(sortColumn)} ${Prisma.raw(sortOrder)}`;
const users = await prisma.$queryRaw`
  SELECT * FROM users ${orderBy}
`;
```

### Filtering Patterns
```typescript
// Complex filters
const posts = await prisma.post.findMany({
  where: {
    AND: [
      { published: true },
      { authorId: userId },
    ],
    OR: [
      { title: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
    ],
    NOT: { deletedAt: { not: null } },
    tags: { some: { name: { in: ['tech', 'coding'] } } },
    createdAt: { gte: startDate, lte: endDate },
  },
});

// Dynamic filters
function buildFilters(params: FilterParams) {
  const where: Prisma.PostWhereInput = {};

  if (params.search) {
    where.OR = [
      { title: { contains: params.search, mode: 'insensitive' } },
      { content: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  if (params.published !== undefined) {
    where.published = params.published;
  }

  if (params.tags?.length) {
    where.tags = { some: { name: { in: params.tags } } };
  }

  return where;
}
```

### Pagination
```typescript
// Offset pagination
async function getUsers(page: number, limit: number) {
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count(),
  ]);

  return {
    data: users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// Cursor pagination (more efficient)
async function getUsers(cursor?: string, limit: number = 20) {
  const users = await prisma.user.findMany({
    take: limit + 1,  // Fetch one extra to check hasMore
    ...(cursor && {
      skip: 1,
      cursor: { id: cursor },
    }),
    orderBy: { createdAt: 'desc' },
  });

  const hasMore = users.length > limit;
  const data = hasMore ? users.slice(0, -1) : users;

  return {
    data,
    nextCursor: hasMore ? data[data.length - 1].id : null,
    hasMore,
  };
}
```

### Middleware
```typescript
// Soft delete middleware
prisma.$use(async (params, next) => {
  // Intercept delete → update with deletedAt
  if (params.action === 'delete') {
    params.action = 'update';
    params.args.data = { deletedAt: new Date() };
  }

  if (params.action === 'deleteMany') {
    params.action = 'updateMany';
    params.args.data = { deletedAt: new Date() };
  }

  // Filter out soft-deleted records
  if (params.action === 'findMany' || params.action === 'findFirst') {
    params.args.where = {
      ...params.args.where,
      deletedAt: null,
    };
  }

  return next(params);
});

// Logging middleware
prisma.$use(async (params, next) => {
  const start = Date.now();
  const result = await next(params);
  const duration = Date.now() - start;

  if (duration > 100) {
    console.warn(`Slow query: ${params.model}.${params.action} took ${duration}ms`);
  }

  return result;
});
```

---

## 8. Migrations

### Prisma Migrate Workflow
```bash
# Development: Create and apply migration
npx prisma migrate dev --name add_user_role

# Production: Apply pending migrations
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset

# Check migration status
npx prisma migrate status
```

### Zero-Downtime Migration Patterns

#### Adding a Column
```sql
-- Step 1: Add nullable column
ALTER TABLE users ADD COLUMN phone VARCHAR(20);

-- Step 2: Backfill data (if needed)
UPDATE users SET phone = '' WHERE phone IS NULL;

-- Step 3: Add NOT NULL constraint (after code handles it)
ALTER TABLE users ALTER COLUMN phone SET NOT NULL;
```

#### Renaming a Column
```sql
-- Step 1: Add new column
ALTER TABLE users ADD COLUMN full_name VARCHAR(100);

-- Step 2: Backfill
UPDATE users SET full_name = name;

-- Step 3: Update code to use new column

-- Step 4: Drop old column (after deploy)
ALTER TABLE users DROP COLUMN name;
```

#### Adding an Index (Large Tables)
```sql
-- Use CONCURRENTLY to avoid locking
CREATE INDEX CONCURRENTLY idx_orders_user_id ON orders(user_id);
```

### Migration Checklist
- [ ] Every migration has a rollback plan
- [ ] Test migrations on copy of production data
- [ ] Add columns as nullable first, then add constraint
- [ ] Use CONCURRENTLY for indexes on large tables
- [ ] Backfill data in batches for large updates
- [ ] Coordinate code deploy with migration

---

## 9. Connection Pooling

### Why Pool Connections?
```
Without pooling:
  Request → New connection → Query → Close connection
  (Expensive: ~50-100ms per connection)

With pooling:
  Request → Get connection from pool → Query → Return to pool
  (Fast: ~0.1-1ms)
```

### Prisma Connection Pool
```typescript
// Configure in DATABASE_URL or programmatically
// postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=10

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});
```

### Pool Sizing
```
Recommended: connections = (cores * 2) + effective_spindle_count

For most web apps: 10-20 connections per application instance

Total connections = instances × connections_per_instance
Ensure: Total < max_connections (PostgreSQL default: 100)
```

### PgBouncer (External Pooler)
```
App → PgBouncer → PostgreSQL

Benefits:
- Handle more connections than PostgreSQL allows
- Connection reuse across multiple app instances
- Transaction-level pooling for serverless
```

### Serverless Considerations
```typescript
// For serverless (Vercel, Lambda), use external pooler
// or Prisma Accelerate / Neon / Supabase pooler

// Disconnect after request in serverless
export async function handler() {
  try {
    // ... your logic
  } finally {
    await prisma.$disconnect();
  }
}
```

---

## 10. Backup & Recovery

### Backup Strategies
| Type | Command | Use Case |
|------|---------|----------|
| **pg_dump** | Logical backup | Small-medium DBs, schema + data |
| **pg_basebackup** | Physical backup | Large DBs, point-in-time recovery |
| **WAL archiving** | Continuous | Point-in-time recovery |
| **Managed backups** | Automated | Cloud databases (RDS, Cloud SQL) |

### pg_dump Examples
```bash
# Full backup
pg_dump -h localhost -U postgres -d mydb -F c -f backup.dump

# Schema only
pg_dump -h localhost -U postgres -d mydb --schema-only -f schema.sql

# Data only
pg_dump -h localhost -U postgres -d mydb --data-only -f data.sql

# Specific tables
pg_dump -h localhost -U postgres -d mydb -t users -t orders -f subset.dump

# Restore
pg_restore -h localhost -U postgres -d mydb backup.dump
```

### Backup Checklist
- [ ] Automated daily backups
- [ ] Retention policy defined (7 days, 4 weeks, 12 months)
- [ ] Backups stored offsite/different region
- [ ] Backup encryption enabled
- [ ] Regular restore tests (quarterly)
- [ ] Point-in-time recovery for critical systems
- [ ] Document recovery procedures

---

## 11. Performance Monitoring

### Key Metrics
| Metric | Healthy | Concerning |
|--------|---------|------------|
| **Connection count** | < 80% of max | > 90% of max |
| **Query time (p95)** | < 100ms | > 500ms |
| **Cache hit ratio** | > 99% | < 95% |
| **Dead tuples** | < 10% of table | > 20% |
| **Replication lag** | < 1s | > 10s |

### Useful Queries
```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

-- Slow queries (enable pg_stat_statements)
SELECT query, calls, mean_exec_time, total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Cache hit ratio
SELECT
  sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as ratio
FROM pg_statio_user_tables;

-- Table sizes
SELECT
  relname as table,
  pg_size_pretty(pg_total_relation_size(relid)) as total_size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;

-- Index usage
SELECT
  relname as table,
  indexrelname as index,
  idx_scan as scans,
  idx_tup_read as tuples_read
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Unused indexes (candidates for removal)
SELECT
  relname as table,
  indexrelname as index,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Maintenance
```sql
-- Update statistics (for query planner)
ANALYZE users;
ANALYZE;  -- All tables

-- Reclaim space (after deletes/updates)
VACUUM users;
VACUUM FULL users;  -- More aggressive, locks table

-- Reindex (fix bloated indexes)
REINDEX INDEX idx_users_email;
REINDEX TABLE users;
```

---

## Pre-Launch Database Checklist

### Schema
- [ ] Appropriate data types used
- [ ] NOT NULL constraints where applicable
- [ ] Foreign key constraints defined
- [ ] Check constraints for validation
- [ ] Timestamps (created_at, updated_at) on all tables

### Performance
- [ ] Foreign keys indexed
- [ ] Query columns indexed
- [ ] Composite indexes for common queries
- [ ] No N+1 queries in critical paths
- [ ] Connection pooling configured
- [ ] Query analysis done (EXPLAIN ANALYZE)

### Operations
- [ ] Migrations tested on production-like data
- [ ] Backup strategy implemented
- [ ] Restore procedure tested
- [ ] Monitoring configured
- [ ] Slow query logging enabled

### Security
- [ ] Strong database passwords
- [ ] Network access restricted
- [ ] SSL connections enabled
- [ ] Least-privilege user accounts
- [ ] No sensitive data in logs

---

## Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Use The Index, Luke](https://use-the-index-luke.com/) - SQL indexing
- [Prisma Documentation](https://www.prisma.io/docs)
- [pgMustard](https://www.pgmustard.com/) - EXPLAIN visualization
- [PgHero](https://github.com/ankane/pghero) - PostgreSQL insights
- [Awesome Postgres](https://github.com/dhamaniasad/awesome-postgres)

---

*Last updated: February 2026*
