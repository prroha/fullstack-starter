# Analytics Module

Unified analytics tracking for web and mobile with support for multiple providers.

## Features

- **Multi-Provider Support**: Mixpanel, PostHog, or custom API
- **Unified API**: Same interface across all platforms
- **Event Queueing**: Events queued until initialization
- **TypeScript/Dart**: Full type definitions
- **React Hooks**: Convenient React integration
- **Auto-Initialize**: Automatic setup from environment variables

## Supported Providers

| Provider | Web | Mobile | Notes |
|----------|-----|--------|-------|
| Mixpanel | Yes | Yes | Recommended for product analytics |
| PostHog | Yes | Coming | Open-source alternative |
| Custom API | Yes | Yes | Send to your own backend |

## Installation

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

### Mobile (Flutter)

1. Add Mixpanel to pubspec.yaml:

```yaml
dependencies:
  mixpanel_flutter: ^2.3.0
```

2. Copy the analytics service:

```bash
cp modules/analytics/mobile/lib/core/services/analytics_service.dart core/mobile/lib/core/services/
```

3. Initialize in your app:

```dart
void main() async {
  await analytics.init(AnalyticsConfig(
    provider: AnalyticsProvider.mixpanel,
    token: 'your_mixpanel_token',
    debug: kDebugMode,
  ));
  runApp(MyApp());
}
```

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
  apiUrl: 'https://your-api.com/analytics',
  debug: true,
});
```

### Mobile

```dart
await analytics.init(AnalyticsConfig(
  provider: AnalyticsProvider.custom,
  apiUrl: 'https://your-api.com/analytics',
  debug: true,
));
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

| Variable | Platform | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_ANALYTICS_PROVIDER` | Web | Provider: mixpanel, posthog, custom |
| `NEXT_PUBLIC_MIXPANEL_TOKEN` | Web | Mixpanel project token |
| `NEXT_PUBLIC_POSTHOG_KEY` | Web | PostHog project key |
| `NEXT_PUBLIC_ANALYTICS_ENABLED` | Web | Enable/disable analytics |

## Best Practices

1. **Initialize early**: Call `init()` before any tracking
2. **Identify users**: Call `identify()` after login
3. **Reset on logout**: Call `reset()` to clear user data
4. **Use consistent naming**: Prefer snake_case for events
5. **Track meaningful events**: Focus on user actions, not page loads
6. **Add context**: Include relevant properties with events

## Pricing Suggestion

$400-600 for integration including:
- Analytics setup and configuration
- Custom event planning
- Dashboard configuration
- Documentation and training
