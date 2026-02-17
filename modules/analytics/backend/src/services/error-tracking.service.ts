/**
 * Error Tracking Service (Sentry Integration)
 *
 * Premium tier feature for comprehensive error tracking and performance monitoring.
 *
 * Usage:
 *   import { errorTracking } from './services/error-tracking.service';
 *   errorTracking.initErrorTracking({ dsn: 'your-sentry-dsn' });
 *   errorTracking.captureException(error, { userId: 'user_123' });
 */

// =============================================================================
// Types
// =============================================================================

export type SeverityLevel = 'fatal' | 'error' | 'warning' | 'info' | 'debug' | 'log';

export interface ErrorTrackingConfig {
  /** Sentry DSN (Data Source Name) */
  dsn: string;
  /** Environment name (production, staging, development) */
  environment?: string;
  /** Release/version identifier */
  release?: string;
  /** Sample rate for transactions (0.0 to 1.0) */
  tracesSampleRate?: number;
  /** Sample rate for profiles (0.0 to 1.0) */
  profilesSampleRate?: number;
  /** Enable debug mode */
  debug?: boolean;
  /** Server name identifier */
  serverName?: string;
  /** Tags to add to all events */
  tags?: Record<string, string>;
  /** Enable performance monitoring */
  enableTracing?: boolean;
  /** Integrations to ignore (e.g., specific routes) */
  ignoreTransactions?: string[];
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
  /** Timestamp (defaults to now) */
  timestamp?: number;
}

export interface UserContext {
  id?: string;
  email?: string;
  username?: string;
  ip_address?: string;
  [key: string]: string | undefined;
}

export interface TransactionContext {
  /** Transaction name */
  name: string;
  /** Operation type (e.g., 'http.server', 'db.query') */
  op: string;
  /** Transaction description */
  description?: string;
  /** Transaction tags */
  tags?: Record<string, string>;
  /** Transaction data */
  data?: Record<string, unknown>;
}

// =============================================================================
// Error Tracking Provider Interface
// =============================================================================

interface ErrorTrackingProviderInterface {
  init(config: ErrorTrackingConfig): void;
  captureException(error: Error | unknown, context?: ErrorContext): string | undefined;
  captureMessage(message: string, level?: SeverityLevel, context?: ErrorContext): string | undefined;
  setUser(user: UserContext | null): void;
  addBreadcrumb(breadcrumb: Breadcrumb): void;
  setTag(key: string, value: string): void;
  setTags(tags: Record<string, string>): void;
  setExtra(key: string, value: unknown): void;
  setExtras(extras: Record<string, unknown>): void;
  setContext(name: string, context: Record<string, unknown>): void;
  startTransaction(context: TransactionContext): Transaction | null;
  flush(timeout?: number): Promise<boolean>;
  close(timeout?: number): Promise<boolean>;
}

// =============================================================================
// Transaction Interface
// =============================================================================

export interface Transaction {
  name: string;
  op: string;
  setTag(key: string, value: string): void;
  setData(key: string, value: unknown): void;
  startChild(context: { op: string; description?: string }): Span;
  finish(): void;
}

export interface Span {
  setTag(key: string, value: string): void;
  setData(key: string, value: unknown): void;
  finish(): void;
}

// =============================================================================
// Sentry Provider Implementation
// =============================================================================

class SentryProvider implements ErrorTrackingProviderInterface {
  private sentry: typeof import('@sentry/node') | null = null;
  private config: ErrorTrackingConfig | null = null;
  private initialized = false;
  private debug = false;

  init(config: ErrorTrackingConfig): void {
    this.config = config;
    this.debug = config.debug || false;

    if (!config.dsn) {
      this.log('Sentry DSN not provided, error tracking disabled');
      return;
    }

    try {
      // Dynamic import to allow graceful fallback if @sentry/node is not installed
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Sentry = require('@sentry/node');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { nodeProfilingIntegration } = require('@sentry/profiling-node');

      Sentry.init({
        dsn: config.dsn,
        environment: config.environment || process.env.NODE_ENV || 'development',
        release: config.release || process.env.npm_package_version,
        debug: config.debug,
        serverName: config.serverName,
        tracesSampleRate: config.tracesSampleRate ?? 0.1,
        profilesSampleRate: config.profilesSampleRate ?? 0.1,
        integrations: config.enableTracing !== false ? [nodeProfilingIntegration()] : [],
        beforeSend: (event) => {
          // Filter out certain errors if needed
          return event;
        },
        beforeSendTransaction: (event) => {
          // Filter out certain transactions if needed
          if (config.ignoreTransactions?.includes(event.transaction || '')) {
            return null;
          }
          return event;
        },
      });

      // Set initial tags
      if (config.tags) {
        Object.entries(config.tags).forEach(([key, value]) => {
          Sentry.setTag(key, value);
        });
      }

      this.sentry = Sentry;
      this.initialized = true;
      this.log('Sentry initialized successfully');
    } catch (error) {
      console.warn('[ErrorTracking] Failed to initialize Sentry:', error);
      console.warn('[ErrorTracking] Install @sentry/node and @sentry/profiling-node for error tracking');
    }
  }

  captureException(error: Error | unknown, context?: ErrorContext): string | undefined {
    if (!this.sentry || !this.initialized) {
      this.logError(error);
      return undefined;
    }

    return this.sentry.withScope((scope) => {
      if (context) {
        this.applyContext(scope, context);
      }

      const eventId = this.sentry!.captureException(error);
      this.log('Captured exception:', eventId);
      return eventId;
    });
  }

  captureMessage(message: string, level: SeverityLevel = 'info', context?: ErrorContext): string | undefined {
    if (!this.sentry || !this.initialized) {
      console.log(`[ErrorTracking:${level}]`, message);
      return undefined;
    }

    return this.sentry.withScope((scope) => {
      if (context) {
        this.applyContext(scope, context);
      }

      const eventId = this.sentry!.captureMessage(message, level);
      this.log('Captured message:', eventId);
      return eventId;
    });
  }

  setUser(user: UserContext | null): void {
    if (!this.sentry || !this.initialized) return;
    this.sentry.setUser(user);
    this.log('Set user:', user?.id);
  }

  addBreadcrumb(breadcrumb: Breadcrumb): void {
    if (!this.sentry || !this.initialized) return;
    this.sentry.addBreadcrumb({
      ...breadcrumb,
      timestamp: breadcrumb.timestamp || Date.now() / 1000,
    });
  }

  setTag(key: string, value: string): void {
    if (!this.sentry || !this.initialized) return;
    this.sentry.setTag(key, value);
  }

  setTags(tags: Record<string, string>): void {
    if (!this.sentry || !this.initialized) return;
    this.sentry.setTags(tags);
  }

  setExtra(key: string, value: unknown): void {
    if (!this.sentry || !this.initialized) return;
    this.sentry.setExtra(key, value);
  }

  setExtras(extras: Record<string, unknown>): void {
    if (!this.sentry || !this.initialized) return;
    this.sentry.setExtras(extras);
  }

  setContext(name: string, context: Record<string, unknown>): void {
    if (!this.sentry || !this.initialized) return;
    this.sentry.setContext(name, context);
  }

  startTransaction(context: TransactionContext): Transaction | null {
    if (!this.sentry || !this.initialized) return null;

    const transaction = this.sentry.startSpan({
      name: context.name,
      op: context.op,
    });

    if (!transaction) return null;

    // Wrap in our Transaction interface
    return {
      name: context.name,
      op: context.op,
      setTag: (key: string, value: string) => transaction.setAttribute(key, value),
      setData: (key: string, value: unknown) => transaction.setAttribute(key, String(value)),
      startChild: (childContext: { op: string; description?: string }) => {
        const span = this.sentry!.startSpan({
          name: childContext.description || childContext.op,
          op: childContext.op,
        });
        return {
          setTag: (key: string, value: string) => span?.setAttribute(key, value),
          setData: (key: string, value: unknown) => span?.setAttribute(key, String(value)),
          finish: () => span?.end(),
        };
      },
      finish: () => transaction.end(),
    };
  }

  async flush(timeout = 2000): Promise<boolean> {
    if (!this.sentry || !this.initialized) return true;
    return this.sentry.flush(timeout);
  }

  async close(timeout = 2000): Promise<boolean> {
    if (!this.sentry || !this.initialized) return true;
    return this.sentry.close(timeout);
  }

  private applyContext(scope: import('@sentry/node').Scope, context: ErrorContext): void {
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

  private log(...args: unknown[]): void {
    if (this.debug) {
      console.log('[ErrorTracking:Sentry]', ...args);
    }
  }

  private logError(error: unknown): void {
    console.error('[ErrorTracking] Error (Sentry not initialized):', error);
  }
}

// =============================================================================
// No-op Provider (fallback when Sentry is not configured)
// =============================================================================

class NoopProvider implements ErrorTrackingProviderInterface {
  init(): void {}
  captureException(error: Error | unknown): string | undefined {
    console.error('[ErrorTracking:Noop] Exception:', error);
    return undefined;
  }
  captureMessage(message: string, level?: SeverityLevel): string | undefined {
    console.log(`[ErrorTracking:Noop:${level || 'info'}]`, message);
    return undefined;
  }
  setUser(): void {}
  addBreadcrumb(): void {}
  setTag(): void {}
  setTags(): void {}
  setExtra(): void {}
  setExtras(): void {}
  setContext(): void {}
  startTransaction(): Transaction | null {
    return null;
  }
  async flush(): Promise<boolean> {
    return true;
  }
  async close(): Promise<boolean> {
    return true;
  }
}

// =============================================================================
// Error Tracking Service
// =============================================================================

class ErrorTrackingService {
  private provider: ErrorTrackingProviderInterface = new NoopProvider();
  private initialized = false;

  /**
   * Initialize error tracking with Sentry
   */
  initErrorTracking(config: ErrorTrackingConfig): void {
    if (this.initialized) {
      console.warn('[ErrorTracking] Already initialized');
      return;
    }

    const enabled = process.env.ERROR_TRACKING_ENABLED !== 'false';
    if (!enabled) {
      this.provider = new NoopProvider();
      this.initialized = true;
      return;
    }

    this.provider = new SentryProvider();
    this.provider.init(config);
    this.initialized = true;
  }

  /**
   * Capture an exception and send to Sentry
   */
  captureException(error: Error | unknown, context?: ErrorContext): string | undefined {
    return this.provider.captureException(error, context);
  }

  /**
   * Capture a message and send to Sentry
   */
  captureMessage(message: string, level: SeverityLevel = 'info', context?: ErrorContext): string | undefined {
    return this.provider.captureMessage(message, level, context);
  }

  /**
   * Set user context for all future events
   */
  setUser(user: UserContext | null): void {
    this.provider.setUser(user);
  }

  /**
   * Add a breadcrumb for debugging
   */
  addBreadcrumb(breadcrumb: Breadcrumb): void {
    this.provider.addBreadcrumb(breadcrumb);
  }

  /**
   * Set a tag for all future events
   */
  setTag(key: string, value: string): void {
    this.provider.setTag(key, value);
  }

  /**
   * Set multiple tags for all future events
   */
  setTags(tags: Record<string, string>): void {
    this.provider.setTags(tags);
  }

  /**
   * Set extra data for all future events
   */
  setExtra(key: string, value: unknown): void {
    this.provider.setExtra(key, value);
  }

  /**
   * Set multiple extra data for all future events
   */
  setExtras(extras: Record<string, unknown>): void {
    this.provider.setExtras(extras);
  }

  /**
   * Set a named context for all future events
   */
  setContext(name: string, context: Record<string, unknown>): void {
    this.provider.setContext(name, context);
  }

  /**
   * Start a new transaction for performance monitoring
   */
  startTransaction(context: TransactionContext): Transaction | null {
    return this.provider.startTransaction(context);
  }

  /**
   * Flush pending events (call before shutting down)
   */
  async flush(timeout?: number): Promise<boolean> {
    return this.provider.flush(timeout);
  }

  /**
   * Close the SDK (call when shutting down)
   */
  async close(timeout?: number): Promise<boolean> {
    return this.provider.close(timeout);
  }

  /**
   * Check if error tracking is initialized
   */
  get isInitialized(): boolean {
    return this.initialized;
  }
}

// =============================================================================
// Singleton Export
// =============================================================================

export const errorTracking = new ErrorTrackingService();

// =============================================================================
// Request Handler Helper
// =============================================================================

/**
 * Get request context for error tracking
 */
export function getRequestContext(req: {
  method?: string;
  url?: string;
  headers?: Record<string, string | string[] | undefined>;
  ip?: string;
  user?: { id?: string; email?: string };
}): ErrorContext {
  return {
    user: req.user
      ? {
          id: req.user.id,
          email: req.user.email,
        }
      : undefined,
    tags: {
      method: req.method || 'unknown',
      url: req.url || 'unknown',
    },
    extra: {
      headers: {
        'user-agent': req.headers?.['user-agent'],
        'x-request-id': req.headers?.['x-request-id'],
        'x-forwarded-for': req.headers?.['x-forwarded-for'],
      },
      ip: req.ip,
    },
  };
}

export default errorTracking;
