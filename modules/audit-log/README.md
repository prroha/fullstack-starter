# Audit Log Module

Comprehensive audit logging for compliance, security monitoring, and debugging.

## Features

- Automatic request/response logging
- User action tracking
- IP address and geolocation
- Device and browser information
- Configurable log levels
- Log retention policies
- Admin viewer with search and filtering
- Export to CSV/JSON

## Installation

No additional dependencies required (uses built-in Node.js and Prisma).

## Environment Variables

### Backend (`backend/.env`)

```bash
# Enable/disable audit logging
AUDIT_LOG_ENABLED=true

# Log retention in days (older logs are auto-deleted)
AUDIT_LOG_RETENTION_DAYS=365

# Log levels to capture (comma-separated)
# Options: info, warning, error, security
AUDIT_LOG_LEVELS=info,warning,error,security

# Exclude paths from logging (comma-separated regex patterns)
AUDIT_LOG_EXCLUDE_PATHS=/health,/metrics,/api/v1/auth/me

# Include request body in logs (caution: may contain sensitive data)
AUDIT_LOG_INCLUDE_BODY=false

# Mask sensitive fields in logs
AUDIT_LOG_MASK_FIELDS=password,token,secret,apiKey,creditCard
```

## Setup Instructions

### 1. Database Schema

Add to `prisma/schema.prisma`:

```prisma
model AuditLog {
  id          String   @id @default(uuid())
  timestamp   DateTime @default(now())
  level       String   @default("info") // info, warning, error, security
  action      String   // e.g., "user.login", "user.update", "payment.create"
  category    String   // e.g., "auth", "user", "payment", "admin"
  userId      String?
  userEmail   String?
  targetId    String?  // ID of affected resource
  targetType  String?  // Type of affected resource
  method      String?  // HTTP method
  path        String?  // Request path
  statusCode  Int?
  ipAddress   String?
  userAgent   String?
  duration    Int?     // Request duration in ms
  metadata    Json?    // Additional context
  error       String?  // Error message if applicable

  @@index([timestamp])
  @@index([userId])
  @@index([action])
  @@index([level])
  @@index([category])
}
```

Run migration:

```bash
cd backend
npm run db:migrate:dev -- --name add_audit_log
```

### 2. Backend Integration

Add middleware to `backend/src/app.ts`:

```typescript
import { auditMiddleware } from "@modules/audit-log/backend/src/middleware/audit.middleware";

// After authentication middleware
app.use(auditMiddleware());
```

Register routes in `backend/src/routes/index.ts`:

```typescript
import auditRoutes from "@modules/audit-log/backend/src/routes/audit.routes";

v1Router.use("/admin/audit-logs", auditRoutes);
```

### 3. Web Integration

Add audit log viewer to admin dashboard.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/audit-logs` | List audit logs with filtering |
| GET | `/admin/audit-logs/:id` | Get single audit log |
| GET | `/admin/audit-logs/stats` | Get audit log statistics |
| POST | `/admin/audit-logs/export` | Export logs to CSV/JSON |
| DELETE | `/admin/audit-logs/cleanup` | Manually trigger cleanup |

## Usage Examples

### Manual Logging

```typescript
import { getAuditService } from "./services/audit.service";

const audit = getAuditService();

// Log a user action
await audit.log({
  action: "user.profile.update",
  category: "user",
  userId: user.id,
  userEmail: user.email,
  targetId: user.id,
  targetType: "user",
  metadata: {
    changedFields: ["name", "avatar"],
  },
});

// Log a security event
await audit.security({
  action: "auth.login.failed",
  userId: attemptedUserId,
  ipAddress: req.ip,
  metadata: {
    reason: "invalid_password",
    attemptCount: 3,
  },
});

// Log an error
await audit.error({
  action: "payment.process",
  userId: user.id,
  error: error.message,
  metadata: {
    paymentId,
    amount,
  },
});
```

### Query Logs

```typescript
// Get recent logs for a user
const logs = await audit.query({
  userId: user.id,
  startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  limit: 50,
});

// Get security events
const securityLogs = await audit.query({
  level: "security",
  category: "auth",
  startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
});
```

### Middleware Auto-Logging

The audit middleware automatically logs:

```typescript
// Automatically logged on each request:
{
  action: "api.request",
  method: "POST",
  path: "/api/v1/users/123",
  statusCode: 200,
  duration: 45,
  userId: "user-id-from-auth",
  ipAddress: "192.168.1.1",
  userAgent: "Mozilla/5.0...",
}
```

## Log Actions Reference

### Authentication

| Action | Level | Description |
|--------|-------|-------------|
| auth.login.success | info | Successful login |
| auth.login.failed | security | Failed login attempt |
| auth.logout | info | User logged out |
| auth.token.refresh | info | Token refreshed |
| auth.password.reset.request | info | Password reset requested |
| auth.password.reset.complete | info | Password reset completed |
| auth.mfa.enabled | security | MFA enabled |
| auth.mfa.disabled | security | MFA disabled |

### User Management

| Action | Level | Description |
|--------|-------|-------------|
| user.create | info | User created |
| user.update | info | User updated |
| user.delete | warning | User deleted |
| user.role.change | security | User role changed |
| user.suspend | security | User suspended |
| user.activate | info | User activated |

### Admin Actions

| Action | Level | Description |
|--------|-------|-------------|
| admin.user.view | info | Admin viewed user |
| admin.user.update | warning | Admin updated user |
| admin.user.delete | warning | Admin deleted user |
| admin.settings.update | warning | System settings changed |
| admin.audit.export | info | Audit logs exported |

### Payment

| Action | Level | Description |
|--------|-------|-------------|
| payment.create | info | Payment initiated |
| payment.success | info | Payment successful |
| payment.failed | error | Payment failed |
| subscription.create | info | Subscription created |
| subscription.cancel | info | Subscription cancelled |

## Admin Viewer Features

The web admin viewer provides:

- **Real-time Updates**: Auto-refresh of recent logs
- **Advanced Filtering**: By date range, user, action, level, category
- **Search**: Full-text search in actions and metadata
- **Details View**: Expand logs to see full metadata
- **Export**: Download filtered logs as CSV or JSON
- **Statistics**: Charts showing log volume over time

## Security Considerations

1. **Sensitive Data**: Never log passwords, tokens, or full credit card numbers
2. **PII Compliance**: Consider GDPR/CCPA requirements for personal data
3. **Access Control**: Restrict audit log access to admins only
4. **Log Integrity**: Consider using append-only storage
5. **Retention**: Implement automatic cleanup per compliance requirements

## Performance Tips

1. **Async Logging**: Logs are written asynchronously to avoid blocking requests
2. **Batch Writes**: Consider batching logs for high-traffic applications
3. **Index Strategy**: Add database indexes for common query patterns
4. **Archival**: Archive old logs to cold storage for long-term retention
5. **Sampling**: For very high traffic, consider sampling non-critical logs

## Troubleshooting

### Logs not appearing

1. Check `AUDIT_LOG_ENABLED` is `true`
2. Verify middleware is registered after auth middleware
3. Check path isn't in `AUDIT_LOG_EXCLUDE_PATHS`
4. Verify database connection

### High database usage

1. Reduce retention period
2. Add appropriate indexes
3. Consider log sampling
4. Archive to external storage

### Missing user info

1. Ensure auth middleware runs before audit middleware
2. Check `req.user` is properly set
3. Verify user ID extraction in middleware config
