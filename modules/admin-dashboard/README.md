# Admin Dashboard Module

Full-featured admin dashboard with user management, statistics, and settings.

## Features

- **Dashboard Overview**: Key metrics and statistics
- **User Management**: List, search, edit, and delete users
- **Role Management**: Change user roles (User/Admin)
- **Activity Feed**: Recent user activity
- **Settings**: System configuration
- **Access Control**: Admin-only routes

## Installation

### Backend

1. Copy the admin files:

```bash
cp modules/admin-dashboard/backend/src/controllers/admin.controller.ts core/backend/src/controllers/
cp modules/admin-dashboard/backend/src/routes/admin.routes.ts core/backend/src/routes/
```

2. Register routes in your app:

```typescript
import { createAdminRoutes } from './routes/admin.routes';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Apply authentication middleware first
app.use('/api/admin', authMiddleware, createAdminRoutes(prisma));
```

3. Ensure your Prisma schema has a `role` field:

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  password  String
  role      String   @default("USER")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Web (Next.js)

1. Copy the admin pages:

```bash
cp -r modules/admin-dashboard/web/src/app/admin core/web/src/app/
```

2. Add admin protection to your middleware or layout:

```typescript
// app/admin/layout.tsx
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user || user.role !== 'ADMIN') {
    redirect('/login');
  }

  return <>{children}</>;
}
```

## API Endpoints

### Dashboard

```http
# Get statistics
GET /api/admin/stats

# Get recent activity
GET /api/admin/activity?limit=10
```

### User Management

```http
# List users with pagination
GET /api/admin/users?page=1&limit=20&search=john&sortBy=createdAt&sortOrder=desc

# Get single user
GET /api/admin/users/:id

# Update user
PATCH /api/admin/users/:id
{ "name": "New Name", "role": "ADMIN" }

# Delete user
DELETE /api/admin/users/:id
```

### Settings

```http
# Get settings
GET /api/admin/settings

# Update settings
PUT /api/admin/settings
{ "settings": { "appName": "My App", "maintenanceMode": false } }
```

## Usage Examples

### Protecting Admin Routes

The module includes middleware that checks for admin role:

```typescript
import { requireAdmin } from './routes/admin.routes';

// Apply to individual routes
router.get('/sensitive-data', requireAdmin, (req, res) => {
  // Only admins can access
});
```

### Custom Admin Checks

```typescript
// In your auth context or middleware
export function isAdmin(user: User | null): boolean {
  return user?.role === 'ADMIN';
}
```

### Frontend Admin Check

```tsx
'use client';

import { useAuth } from '@/lib/auth-context';

function AdminLink() {
  const { user } = useAuth();

  if (user?.role !== 'ADMIN') return null;

  return <Link href="/admin">Admin Dashboard</Link>;
}
```

## Customization

### Add More Stats

Edit `admin.controller.ts` to add custom statistics:

```typescript
async getStats(req: Request, res: Response) {
  const [totalUsers, totalOrders, revenue] = await Promise.all([
    this.prisma.user.count(),
    this.prisma.order.count(),
    this.prisma.order.aggregate({ _sum: { amount: true } }),
  ]);

  res.json({
    success: true,
    stats: { totalUsers, totalOrders, revenue: revenue._sum.amount },
  });
}
```

### Add Audit Logging

Create an audit log for admin actions:

```prisma
model AuditLog {
  id        String   @id @default(cuid())
  action    String
  userId    String
  targetId  String?
  details   Json?
  createdAt DateTime @default(now())
}
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ADMIN_EMAIL` | Default admin email (for initial setup) |

## Security Considerations

1. **Always verify role server-side** - Never trust client-side role checks alone
2. **Audit sensitive actions** - Log user deletions, role changes
3. **Prevent self-demotion** - Admins shouldn't be able to remove their own admin access
4. **Rate limit admin APIs** - Prevent abuse of admin endpoints

## Pricing Suggestion

$600-1000 for full integration including:
- Admin dashboard setup
- User management features
- Custom metrics and analytics
- Audit logging
- Admin notifications
