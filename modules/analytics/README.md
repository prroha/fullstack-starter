# Analytics Module

Unified analytics tracking for web and mobile with support for multiple providers.

## Features

- **Multi-Provider Support**: Mixpanel, PostHog, or custom API
- **Unified API**: Same interface across all platforms
- **Event Queueing**: Events queued until initialization
- **TypeScript/Dart**: Full type definitions
- **React Hooks**: Convenient React integration
- **Auto-Initialize**: Automatic setup from environment variables
- **Backend Service**: Full analytics collection and aggregation
- **Export Support**: JSON and CSV export functionality
- **Error Tracking (Premium)**: Sentry integration for comprehensive error monitoring
- **Performance Monitoring (Premium)**: Transaction tracing and performance insights

## Supported Providers

| Provider | Web | Mobile | Backend | Notes |
|----------|-----|--------|---------|-------|
| Mixpanel | Yes | Yes | - | Recommended for product analytics |
| PostHog | Yes | Coming | - | Open-source alternative |
| Custom API | Yes | Yes | Yes | Send to your own backend |

## Database Schema

Add the following Prisma schema to your `prisma/schema.prisma`:

```prisma
// =============================================================================
// Analytics Event Model
// =============================================================================

model AnalyticsEvent {
  id             String   @id @default(cuid())
  userId         String?  @map("user_id")
  sessionId      String?  @map("session_id")
  event          String
  properties     Json?

  // Device Information (parsed from User-Agent)
  deviceType     String?  @map("device_type")
  browser        String?
  browserVersion String?  @map("browser_version")
  os             String?
  osVersion      String?  @map("os_version")

  // Location (optional, from IP geolocation)
  country        String?
  city           String?

  // Privacy-compliant IP (anonymized)
  ip             String?

  createdAt      DateTime @default(now()) @map("created_at")

  // Relations
  user           User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  // Indexes for efficient querying
  @@index([userId])
  @@index([sessionId])
  @@index([event])
  @@index([createdAt])
  @@index([userId, event])
  @@index([event, createdAt])
  @@index([userId, createdAt])

  // Composite index for common admin queries
  @@index([event, createdAt, userId])

  @@map("analytics_events")
}

// =============================================================================
// Analytics Aggregation Model (for pre-computed stats)
// =============================================================================

model AnalyticsAggregate {
  id            String   @id @default(cuid())
  period        String   // 'hour', 'day', 'week', 'month'
  periodStart   DateTime @map("period_start")
  event         String
  count         Int      @default(0)
  uniqueUsers   Int      @default(0) @map("unique_users")
  uniqueSessions Int     @default(0) @map("unique_sessions")

  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  // Unique constraint for upsert operations
  @@unique([period, periodStart, event])

  // Indexes
  @@index([period, periodStart])
  @@index([event])

  @@map("analytics_aggregates")
}
```

After adding the schema, run migrations:

```bash
npx prisma migrate dev --name add_analytics
```

## Installation

### Backend (Express)

1. Install dependencies:

```bash
cd core/backend
npm install ua-parser-js
npm install -D @types/ua-parser-js
```

2. Copy the analytics service and routes:

```bash
mkdir -p src/services src/routes
cp modules/analytics/backend/src/services/analytics.service.ts src/services/
cp modules/analytics/backend/src/routes/analytics.routes.ts src/routes/
```

3. Register the routes in your Express app:

```typescript
import analyticsRoutes from './routes/analytics.routes';

// In your app.ts or index.ts
app.use('/api/analytics', analyticsRoutes);
```

4. Add environment variables to `.env`:

```env
ANALYTICS_ENABLED=true
ANALYTICS_RETENTION_DAYS=90
```

### Web (Next.js)

1. Install Mixpanel (or your preferred provider):

```bash
cd core/web
npm install mixpanel-browser
# OR for PostHog:
npm install posthog-js
```

2. Copy the analytics lib:

```bash
cp modules/analytics/web/src/lib/analytics.ts core/web/src/lib/
```

3. Add environment variables to `web/.env.local`:

```env
NEXT_PUBLIC_ANALYTICS_PROVIDER=mixpanel
NEXT_PUBLIC_MIXPANEL_TOKEN=your_token_here
NEXT_PUBLIC_ANALYTICS_ENABLED=true
```

For custom API provider:

```env
NEXT_PUBLIC_ANALYTICS_PROVIDER=custom
NEXT_PUBLIC_ANALYTICS_API_URL=https://your-api.com/api/analytics
NEXT_PUBLIC_ANALYTICS_ENABLED=true
```

### Mobile (Flutter)

1. Add dependencies to `pubspec.yaml`:

```yaml
dependencies:
  dio: ^5.4.0
  mixpanel_flutter: ^2.3.0  # Optional, for Mixpanel provider
```

2. Copy the analytics service:

```bash
cp modules/analytics/mobile/lib/core/services/analytics_service.dart core/mobile/lib/core/services/
```

3. Initialize in your app:

```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // For custom API provider
  await analytics.init(AnalyticsConfig(
    provider: AnalyticsProvider.custom,
    apiUrl: 'https://your-api.com/api/analytics',
    debug: kDebugMode,
  ));

  // OR for Mixpanel
  await analytics.init(AnalyticsConfig(
    provider: AnalyticsProvider.mixpanel,
    token: 'your_mixpanel_token',
    debug: kDebugMode,
  ));

  runApp(MyApp());
}
```

## API Endpoints

### Public Endpoints

#### POST /api/analytics/track
Track a single event. Authentication optional (authenticated users get their userId attached).

```json
{
  "event": "button_clicked",
  "properties": { "buttonId": "signup" },
  "sessionId": "sess_abc123",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### POST /api/analytics/track/batch
Track multiple events in a single request (max 100 events).

```json
{
  "events": [
    { "event": "page_view", "properties": { "page": "/home" } },
    { "event": "button_clicked", "properties": { "buttonId": "signup" } }
  ]
}
```

### Admin Endpoints (Requires Authentication + Admin Role)

#### GET /api/analytics/events
Query analytics events with filtering and pagination.

Query parameters:
- `userId` - Filter by user ID
- `sessionId` - Filter by session ID
- `event` - Filter by event name
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50, max: 1000)

#### GET /api/analytics/stats
Get aggregated statistics.

Query parameters:
- `period` - Aggregation period ('hour', 'day', 'week', 'month')
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)
- `event` - Filter by event name
- `userId` - Filter by user ID

#### GET /api/analytics/overview
Get overview statistics for a date range.

Query parameters:
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)

#### GET /api/analytics/events/names
Get list of all distinct event names.

#### GET /api/analytics/export
Export analytics events.

Query parameters:
- `format` - Export format ('json' or 'csv')
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)
- `events` - Filter by event names (comma-separated)
- `userId` - Filter by user ID

#### POST /api/analytics/cleanup
Clean up old events based on retention policy.

### User Endpoints (Requires Authentication)

#### GET /api/analytics/me/events
Get current user's analytics events.

## Usage

### Web

```typescript
import { analytics, useAnalytics, usePageTracking } from '@/lib/analytics';

// Track events
analytics.track('button_clicked', { buttonId: 'signup' });

// Identify users
analytics.identify('user_123', {
  email: 'user@example.com',
  plan: 'premium'
});

// Track page views
analytics.page('Home');

// Reset on logout
analytics.reset();
```

### React Hooks

```tsx
function MyComponent() {
  const { track, identify } = useAnalytics();

  // Auto-track page views
  usePageTracking();

  const handleClick = () => {
    track('feature_used', { feature: 'export' });
  };

  return <button onClick={handleClick}>Export</button>;
}
```

### Mobile (Dart)

```dart
import 'package:your_app/core/services/analytics_service.dart';

// Track events
await analytics.track('button_clicked', properties: {
  'button_id': 'signup',
});

// Identify users
await analytics.identify('user_123', properties: UserProperties(
  email: 'user@example.com',
  plan: 'premium',
));

// Track screen views
await analytics.screen('HomeScreen');

// Reset on logout
await analytics.reset();

// Flush pending events
await analytics.flush();
```

### Automatic Screen Tracking (Flutter)

```dart
MaterialApp(
  navigatorObservers: [AnalyticsRouteObserver()],
  // ...
)
```

### Common Events

Use standard event names for consistency:

```typescript
// Web
analytics.track('sign_up', { method: 'email' });
analytics.track('login', { method: 'google' });
analytics.track('purchase', { amount: 99, currency: 'USD' });
analytics.track('feature_used', { feature: 'export' });
```

```dart
// Mobile
await analytics.track(AnalyticsEvents.signUp, properties: {'method': 'email'});
await analytics.track(AnalyticsEvents.login, properties: {'method': 'google'});
await analytics.track(AnalyticsEvents.purchase, properties: {'amount': 99});
```

## Custom API Provider

Send analytics to your own backend:

### Web

```typescript
analytics.init({
  provider: 'custom',
  apiUrl: 'https://your-api.com/api/analytics',
  debug: true,
});
```

### Mobile

```dart
await analytics.init(AnalyticsConfig(
  provider: AnalyticsProvider.custom,
  apiUrl: 'https://your-api.com/api/analytics',
  debug: true,
  batchSize: 20,           // Events before auto-flush
  flushInterval: Duration(seconds: 30),
  maxRetries: 3,           // Retry attempts for failed requests
  timeout: Duration(seconds: 10),
));

// Update auth token after login
analytics.setAuthToken(accessToken);

// Clear auth token after logout
analytics.clearAuthToken();
```

Your API should accept POST requests with this format:

```json
{
  "type": "track",
  "event": "button_clicked",
  "userId": "user_123",
  "properties": { "buttonId": "signup" },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Environment Variables

### Backend

| Variable | Default | Description |
|----------|---------|-------------|
| `ANALYTICS_ENABLED` | `true` | Enable/disable analytics collection |
| `ANALYTICS_RETENTION_DAYS` | `90` | Days to retain analytics data |

### Web

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_ANALYTICS_PROVIDER` | Provider: mixpanel, posthog, custom |
| `NEXT_PUBLIC_MIXPANEL_TOKEN` | Mixpanel project token |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog project key |
| `NEXT_PUBLIC_ANALYTICS_API_URL` | Custom API URL |
| `NEXT_PUBLIC_ANALYTICS_ENABLED` | Enable/disable analytics |

## Privacy Compliance

The analytics module includes several privacy-focused features:

1. **IP Anonymization**: IP addresses are automatically anonymized (last octet zeroed for IPv4, last 80 bits for IPv6)
2. **Data Retention**: Automatic cleanup of old events based on configurable retention period
3. **Optional User ID**: Events can be tracked anonymously without user identification
4. **No PII in Properties**: Avoid storing personally identifiable information in event properties

## Best Practices

1. **Initialize early**: Call `init()` before any tracking
2. **Identify users**: Call `identify()` after login
3. **Reset on logout**: Call `reset()` to clear user data
4. **Use consistent naming**: Prefer snake_case for events
5. **Track meaningful events**: Focus on user actions, not page loads
6. **Add context**: Include relevant properties with events
7. **Batch events**: Use batch tracking for high-frequency events
8. **Handle errors gracefully**: Analytics failures shouldn't break your app

---

## Error Tracking with Sentry (Premium Feature)

Comprehensive error tracking and performance monitoring using Sentry.

### Getting Your Sentry DSN

1. Create an account at [sentry.io](https://sentry.io)
2. Create a new project (select your platform: Node.js, Next.js, or Flutter)
3. Copy the DSN from Project Settings > Client Keys (DSN)
4. The DSN looks like: `https://xxx@xxx.ingest.sentry.io/xxx`

### Backend Setup

#### 1. Install Dependencies

```bash
cd core/backend
npm install @sentry/node @sentry/profiling-node
```

#### 2. Copy Error Tracking Files

```bash
mkdir -p src/services src/middleware
cp modules/analytics/backend/src/services/error-tracking.service.ts src/services/
cp modules/analytics/backend/src/middleware/sentry.middleware.ts src/middleware/
```

#### 3. Initialize in app.ts

```typescript
import { errorTracking } from './services/error-tracking.service';
import {
  sentryRequestHandler,
  sentryErrorHandler,
  sentryTracingMiddleware,
} from './middleware/sentry.middleware';

// Initialize Sentry FIRST (before any other code)
errorTracking.initErrorTracking({
  dsn: process.env.SENTRY_DSN!,
  environment: process.env.NODE_ENV,
  release: process.env.npm_package_version,
  tracesSampleRate: 0.1, // 10% of transactions
  enableTracing: true,
});

const app = express();

// Add Sentry request handler FIRST
app.use(sentryRequestHandler);
app.use(sentryTracingMiddleware);

// Your other middleware
app.use(express.json());
app.use(cors());

// Your routes
app.use('/api', routes);

// Add Sentry error handler BEFORE your error handler
app.use(sentryErrorHandler);

// Your error handler
app.use(errorHandler);
```

#### 4. Add Environment Variables

```env
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
ERROR_TRACKING_ENABLED=true
```

#### 5. Capture Errors in Your Code

```typescript
import { errorTracking } from './services/error-tracking.service';

// Capture exceptions
try {
  await riskyOperation();
} catch (error) {
  errorTracking.captureException(error, {
    user: { id: userId, email: userEmail },
    tags: { feature: 'payment' },
    extra: { orderId, amount },
  });
  throw error;
}

// Capture messages
errorTracking.captureMessage('User upgraded to premium', 'info', {
  user: { id: userId },
  tags: { action: 'upgrade' },
});

// Set user context (after login)
errorTracking.setUser({
  id: user.id,
  email: user.email,
  username: user.name,
});

// Add breadcrumbs for debugging
errorTracking.addBreadcrumb({
  category: 'payment',
  message: 'Payment initiated',
  level: 'info',
  data: { amount, currency },
});
```

### Web (Next.js) Setup

#### 1. Install Dependencies

```bash
cd core/web
npx @sentry/wizard@latest -i nextjs
# OR manually:
npm install @sentry/nextjs
```

#### 2. Copy Error Tracking Files

```bash
cp modules/analytics/web/src/lib/error-tracking.ts src/lib/
cp modules/analytics/web/src/components/error-boundary-sentry.tsx src/components/
```

#### 3. Create Sentry Config Files

Create `sentry.client.config.ts`:

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [Sentry.replayIntegration()],
});
```

Create `sentry.server.config.ts`:

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

Create `sentry.edge.config.ts`:

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
});
```

#### 4. Update next.config.js

```javascript
const { withSentryConfig } = require('@sentry/nextjs');

const nextConfig = {
  // Your existing config
};

module.exports = withSentryConfig(nextConfig, {
  org: 'your-org',
  project: 'your-project',
  silent: true,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
});
```

#### 5. Add Environment Variables

```env
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production
SENTRY_AUTH_TOKEN=your_auth_token  # For source maps
```

#### 6. Wrap Your App with Error Boundary

In `app/layout.tsx` or `pages/_app.tsx`:

```tsx
import { AppErrorBoundary } from '@/components/error-boundary-sentry';
import { ErrorTrackingProvider } from '@/lib/error-tracking';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ErrorTrackingProvider>
          <AppErrorBoundary>
            {children}
          </AppErrorBoundary>
        </ErrorTrackingProvider>
      </body>
    </html>
  );
}
```

#### 7. Use in Components

```tsx
import { useErrorTracking, useSetUserContext } from '@/lib/error-tracking';
import { SentryErrorBoundary } from '@/components/error-boundary-sentry';

function MyComponent() {
  const { captureException, captureMessage, setUser } = useErrorTracking();

  // Auto-set user context when user changes
  useSetUserContext(user);

  const handleAction = async () => {
    try {
      await riskyAction();
    } catch (error) {
      captureException(error, {
        tags: { action: 'my_action' },
      });
    }
  };

  return (
    <SentryErrorBoundary scopeName="my-component">
      <div>My Component</div>
    </SentryErrorBoundary>
  );
}
```

### Mobile (Flutter) Setup

#### 1. Add Dependencies

```yaml
# pubspec.yaml
dependencies:
  sentry_flutter: ^7.14.0
```

#### 2. Copy Error Tracking Service

```bash
cp modules/analytics/mobile/lib/core/services/error_tracking_service.dart lib/core/services/
```

#### 3. Initialize in main.dart

```dart
import 'package:flutter/foundation.dart';
import 'package:your_app/core/services/error_tracking_service.dart';

void main() async {
  // Option 1: Simple initialization
  WidgetsFlutterBinding.ensureInitialized();

  await errorTracking.init(ErrorTrackingConfig(
    dsn: 'https://xxx@xxx.ingest.sentry.io/xxx',
    environment: kReleaseMode ? 'production' : 'development',
    release: '1.0.0+1',
    tracesSampleRate: 0.1,
    debug: kDebugMode,
  ));

  runApp(MyApp());

  // Option 2: With zone error catching (recommended)
  await runAppWithErrorTracking(
    config: ErrorTrackingConfig(
      dsn: 'https://xxx@xxx.ingest.sentry.io/xxx',
      environment: kReleaseMode ? 'production' : 'development',
    ),
    appRunner: () => runApp(MyApp()),
  );
}
```

#### 4. Add Navigation Observer

```dart
MaterialApp(
  navigatorObservers: [
    AnalyticsRouteObserver(),          // For analytics
    ErrorTrackingNavigatorObserver(),  // For error tracking breadcrumbs
  ],
)
```

#### 5. Use in Your Code

```dart
import 'package:your_app/core/services/error_tracking_service.dart';

// Capture exceptions
try {
  await riskyOperation();
} catch (e, stack) {
  await errorTracking.captureException(
    e,
    stackTrace: stack,
    context: ErrorContext(
      user: UserContext(id: userId, email: userEmail),
      tags: {'feature': 'payment'},
      extra: {'orderId': orderId},
    ),
  );
  rethrow;
}

// Capture messages
await errorTracking.captureMessage(
  'User upgraded to premium',
  level: SeverityLevel.info,
  context: ErrorContext(
    user: UserContext(id: userId),
  ),
);

// Set user context (after login)
errorTracking.setUser(UserContext(
  id: user.id,
  email: user.email,
  username: user.name,
));

// Clear user context (after logout)
errorTracking.setUser(null);

// Add breadcrumbs
errorTracking.addBreadcrumb(Breadcrumb(
  category: 'payment',
  message: 'Payment initiated',
  level: SeverityLevel.info,
  data: {'amount': amount, 'currency': currency},
));

// Wrap async operations
final result = await errorTracking.wrap(() async {
  return await someAsyncOperation();
});
```

### Environment Variables Summary

#### Backend

| Variable | Default | Description |
|----------|---------|-------------|
| `SENTRY_DSN` | - | Sentry DSN for backend |
| `ERROR_TRACKING_ENABLED` | `true` | Enable/disable error tracking |

#### Web

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN for web |
| `NEXT_PUBLIC_SENTRY_ENVIRONMENT` | Environment name |
| `SENTRY_AUTH_TOKEN` | Auth token for source maps |

### Source Maps Configuration

For production debugging with readable stack traces:

1. Generate source maps during build
2. Upload to Sentry using the CLI or webpack plugin
3. Hide source maps from public access

```bash
# Install Sentry CLI
npm install -g @sentry/cli

# Upload source maps (after build)
sentry-cli releases files <release> upload-sourcemaps ./dist
```

### Best Practices

1. **Initialize early**: Set up error tracking before any other code
2. **Set user context**: Call `setUser()` after login for better debugging
3. **Add breadcrumbs**: Track user actions leading to errors
4. **Use fingerprints**: Group similar errors for better organization
5. **Set appropriate sample rates**: 10% is good for production
6. **Handle sensitive data**: Don't send PII in error reports
7. **Test in development**: Use debug mode to verify setup
8. **Monitor performance**: Use tracing to identify slow operations

---

## Pricing Suggestion

$400-600 for integration including:
- Analytics setup and configuration
- Custom event planning
- Dashboard configuration
- Backend integration
- Documentation and training

**Add-on: Error Tracking (+$200-300)**
- Sentry setup and configuration
- Error boundary implementation
- Source maps configuration
- Performance monitoring setup
