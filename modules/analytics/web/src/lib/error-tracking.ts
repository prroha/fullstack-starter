/**
 * Error Tracking Service for Next.js (Sentry Integration)
 *
 * Premium tier feature for comprehensive error tracking and performance monitoring.
 *
 * Usage:
 *   import { initSentry, captureException, setUser } from '@/lib/error-tracking';
 *
 *   // Initialize in _app.tsx or layout.tsx
 *   initSentry({ dsn: 'your-sentry-dsn' });
 *
 *   // Capture errors
 *   captureException(error, { userId: 'user_123' });
 */

// =============================================================================
// Types
// =============================================================================

export type SeverityLevel = 'fatal' | 'error' | 'warning' | 'info' | 'debug' | 'log';

export interface SentryConfig {
  /** Sentry DSN (Data Source Name) */
  dsn: string;
  /** Environment name (production, staging, development) */
  environment?: string;
  /** Release/version identifier */
  release?: string;
  /** Sample rate for transactions (0.0 to 1.0) */
  tracesSampleRate?: number;
  /** Enable replay (session recordings) */
  replaysSessionSampleRate?: number;
  /** Replay sample rate on error */
  replaysOnErrorSampleRate?: number;
  /** Enable debug mode */
  debug?: boolean;
  /** Tags to add to all events */
  tags?: Record<string, string>;
  /** Enable performance monitoring */
  enableTracing?: boolean;
  /** Allowed URLs for tracing */
  tracePropagationTargets?: string[];
}

export interface ErrorContext {
  /** User information */
  user?: {
    id?: string;
    email?: string;
    username?: string;
    [key: string]: string | undefined;
  };
  /** Additional tags */
  tags?: Record<string, string>;
  /** Extra context data */
  extra?: Record<string, unknown>;
  /** Fingerprint for grouping */
  fingerprint?: string[];
  /** Error level override */
  level?: SeverityLevel;
}

export interface Breadcrumb {
  /** Category (e.g., 'http', 'navigation', 'user') */
  category?: string;
  /** Breadcrumb message */
  message?: string;
  /** Breadcrumb level */
  level?: SeverityLevel;
  /** Type (e.g., 'http', 'navigation', 'default') */
  type?: string;
  /** Additional data */
  data?: Record<string, unknown>;
}

export interface UserContext {
  id?: string;
  email?: string;
  username?: string;
  ip_address?: string;
  [key: string]: string | undefined;
}

// =============================================================================
// Module State
// =============================================================================

let sentryModule: typeof import('@sentry/nextjs') | null = null;
let isInitialized = false;
let isClient = typeof window !== 'undefined';

// =============================================================================
// Initialization
// =============================================================================

/**
 * Initialize Sentry for Next.js
 *
 * Note: For full Next.js integration, you should also create:
 * - sentry.client.config.ts
 * - sentry.server.config.ts
 * - sentry.edge.config.ts
 *
 * This function provides a programmatic way to initialize for simpler setups.
 */
export async function initSentry(config: SentryConfig): Promise<void> {
  if (isInitialized) {
    console.warn('[ErrorTracking] Sentry already initialized');
    return;
  }

  if (!config.dsn) {
    console.warn('[ErrorTracking] Sentry DSN not provided, error tracking disabled');
    isInitialized = true;
    return;
  }

  try {
    // Dynamic import for @sentry/nextjs
    const Sentry = await import('@sentry/nextjs');
    sentryModule = Sentry;

    // Initialize based on environment
    const commonOptions = {
      dsn: config.dsn,
      environment: config.environment || process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV,
      release: config.release || process.env.NEXT_PUBLIC_SENTRY_RELEASE,
      debug: config.debug || process.env.NODE_ENV === 'development',
      tracesSampleRate: config.tracesSampleRate ?? 0.1,
      tracePropagationTargets: config.tracePropagationTargets || [
        'localhost',
        /^\//,
        new RegExp(`^${process.env.NEXT_PUBLIC_API_URL}`),
      ],
    };

    if (isClient) {
      // Client-side initialization
      Sentry.init({
        ...commonOptions,
        replaysSessionSampleRate: config.replaysSessionSampleRate ?? 0.1,
        replaysOnErrorSampleRate: config.replaysOnErrorSampleRate ?? 1.0,
        integrations: [
          Sentry.replayIntegration({
            maskAllText: true,
            blockAllMedia: true,
          }),
        ],
      });
    } else {
      // Server-side initialization
      Sentry.init({
        ...commonOptions,
      });
    }

    // Set initial tags
    if (config.tags) {
      Object.entries(config.tags).forEach(([key, value]) => {
        Sentry.setTag(key, value);
      });
    }

    isInitialized = true;
    console.log('[ErrorTracking] Sentry initialized successfully');
  } catch (error) {
    console.warn('[ErrorTracking] Failed to initialize Sentry:', error);
    console.warn('[ErrorTracking] Install @sentry/nextjs for error tracking');
    isInitialized = true;
  }
}

/**
 * Auto-initialize from environment variables
 */
export function autoInitSentry(): void {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (dsn && !isInitialized) {
    initSentry({
      dsn,
      environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
      release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
      debug: process.env.NODE_ENV === 'development',
    });
  }
}

// =============================================================================
// Error Capturing
// =============================================================================

/**
 * Capture an exception and send to Sentry
 */
export function captureException(error: Error | unknown, context?: ErrorContext): string | undefined {
  if (!sentryModule) {
    console.error('[ErrorTracking] Exception (Sentry not initialized):', error);
    return undefined;
  }

  return sentryModule.withScope((scope) => {
    if (context) {
      applyContext(scope, context);
    }
    return sentryModule!.captureException(error);
  });
}

/**
 * Capture a message and send to Sentry
 */
export function captureMessage(
  message: string,
  level: SeverityLevel = 'info',
  context?: ErrorContext
): string | undefined {
  if (!sentryModule) {
    console.log(`[ErrorTracking:${level}]`, message);
    return undefined;
  }

  return sentryModule.withScope((scope) => {
    if (context) {
      applyContext(scope, context);
    }
    return sentryModule!.captureMessage(message, level);
  });
}

// =============================================================================
// Context Management
// =============================================================================

/**
 * Set user context for all future events
 */
export function setUser(user: UserContext | null): void {
  if (!sentryModule) return;
  sentryModule.setUser(user);
}

/**
 * Add a breadcrumb for debugging
 */
export function addBreadcrumb(breadcrumb: Breadcrumb): void {
  if (!sentryModule) return;
  sentryModule.addBreadcrumb(breadcrumb);
}

/**
 * Set a tag for all future events
 */
export function setTag(key: string, value: string): void {
  if (!sentryModule) return;
  sentryModule.setTag(key, value);
}

/**
 * Set multiple tags for all future events
 */
export function setTags(tags: Record<string, string>): void {
  if (!sentryModule) return;
  sentryModule.setTags(tags);
}

/**
 * Set extra data for all future events
 */
export function setExtra(key: string, value: unknown): void {
  if (!sentryModule) return;
  sentryModule.setExtra(key, value);
}

/**
 * Set multiple extra data for all future events
 */
export function setExtras(extras: Record<string, unknown>): void {
  if (!sentryModule) return;
  sentryModule.setExtras(extras);
}

/**
 * Set a named context for all future events
 */
export function setContext(name: string, context: Record<string, unknown>): void {
  if (!sentryModule) return;
  sentryModule.setContext(name, context);
}

// =============================================================================
// Performance Monitoring
// =============================================================================

/**
 * Start a new span for performance monitoring
 */
export function startSpan<T>(
  context: { name: string; op: string; description?: string },
  callback: () => T
): T {
  if (!sentryModule) {
    return callback();
  }

  return sentryModule.startSpan(
    {
      name: context.name,
      op: context.op,
    },
    callback
  );
}

// =============================================================================
// Helper Functions
// =============================================================================

function applyContext(scope: import('@sentry/nextjs').Scope, context: ErrorContext): void {
  if (context.user) {
    scope.setUser(context.user);
  }
  if (context.tags) {
    Object.entries(context.tags).forEach(([key, value]) => {
      scope.setTag(key, value);
    });
  }
  if (context.extra) {
    Object.entries(context.extra).forEach(([key, value]) => {
      scope.setExtra(key, value);
    });
  }
  if (context.fingerprint) {
    scope.setFingerprint(context.fingerprint);
  }
  if (context.level) {
    scope.setLevel(context.level);
  }
}

/**
 * Flush pending events (call before page unload or shutdown)
 */
export async function flush(timeout = 2000): Promise<boolean> {
  if (!sentryModule) return true;
  return sentryModule.flush(timeout);
}

/**
 * Close the SDK
 */
export async function close(timeout = 2000): Promise<boolean> {
  if (!sentryModule) return true;
  return sentryModule.close(timeout);
}

// =============================================================================
// React Hook
// =============================================================================

import { useEffect, useCallback, useMemo } from 'react';

/**
 * React hook for error tracking
 */
export function useErrorTracking() {
  const trackError = useCallback((error: Error | unknown, context?: ErrorContext) => {
    captureException(error, context);
  }, []);

  const trackMessage = useCallback(
    (message: string, level?: SeverityLevel, context?: ErrorContext) => {
      captureMessage(message, level, context);
    },
    []
  );

  const identify = useCallback((user: UserContext | null) => {
    setUser(user);
  }, []);

  const track = useCallback((breadcrumb: Breadcrumb) => {
    addBreadcrumb(breadcrumb);
  }, []);

  return useMemo(
    () => ({
      captureException: trackError,
      captureMessage: trackMessage,
      setUser: identify,
      addBreadcrumb: track,
      setTag,
      setTags,
      setExtra,
      setExtras,
      setContext,
    }),
    [trackError, trackMessage, identify, track]
  );
}

/**
 * Hook to automatically set user context when user changes
 */
export function useSetUserContext(user: { id?: string; email?: string; username?: string } | null) {
  useEffect(() => {
    if (user) {
      setUser({
        id: user.id,
        email: user.email,
        username: user.username,
      });
    } else {
      setUser(null);
    }
  }, [user]);
}

// =============================================================================
// Error Tracking Context for React
// =============================================================================

import { createContext, useContext, ReactNode } from 'react';

interface ErrorTrackingContextValue {
  captureException: typeof captureException;
  captureMessage: typeof captureMessage;
  setUser: typeof setUser;
  addBreadcrumb: typeof addBreadcrumb;
  setTag: typeof setTag;
  setTags: typeof setTags;
  setExtra: typeof setExtra;
  setExtras: typeof setExtras;
  setContext: typeof setContext;
}

const ErrorTrackingContext = createContext<ErrorTrackingContextValue | null>(null);

interface ErrorTrackingProviderProps {
  children: ReactNode;
  config?: SentryConfig;
}

/**
 * Error Tracking Provider for React applications
 */
export function ErrorTrackingProvider({ children, config }: ErrorTrackingProviderProps) {
  useEffect(() => {
    if (config) {
      initSentry(config);
    } else {
      autoInitSentry();
    }
  }, [config]);

  const value = useMemo(
    () => ({
      captureException,
      captureMessage,
      setUser,
      addBreadcrumb,
      setTag,
      setTags,
      setExtra,
      setExtras,
      setContext,
    }),
    []
  );

  return <ErrorTrackingContext.Provider value={value}>{children}</ErrorTrackingContext.Provider>;
}

/**
 * Hook to access error tracking context
 */
export function useErrorTrackingContext(): ErrorTrackingContextValue {
  const context = useContext(ErrorTrackingContext);
  if (!context) {
    // Return default implementations if provider is not present
    return {
      captureException,
      captureMessage,
      setUser,
      addBreadcrumb,
      setTag,
      setTags,
      setExtra,
      setExtras,
      setContext,
    };
  }
  return context;
}

// =============================================================================
// Auto-initialize on import (client-side only)
// =============================================================================

if (isClient) {
  autoInitSentry();
}

// =============================================================================
// Exports
// =============================================================================

export default {
  initSentry,
  autoInitSentry,
  captureException,
  captureMessage,
  setUser,
  addBreadcrumb,
  setTag,
  setTags,
  setExtra,
  setExtras,
  setContext,
  startSpan,
  flush,
  close,
  useErrorTracking,
  useSetUserContext,
  ErrorTrackingProvider,
  useErrorTrackingContext,
};
