"use client";

import { DURATIONS } from "./constants";

// =====================================================
// Log Levels
// =====================================================

export type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// =====================================================
// Logger Configuration
// =====================================================

interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
  appName: string;
  appVersion: string;
}

const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";

const defaultConfig: LoggerConfig = {
  minLevel: isDevelopment ? "debug" : "warn",
  enableConsole: true,
  enableRemote: isProduction,
  remoteEndpoint: process.env.NEXT_PUBLIC_LOG_ENDPOINT,
  appName: process.env.NEXT_PUBLIC_APP_NAME || "fullstack-web",
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
};

// =====================================================
// Log Entry Interface
// =====================================================

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  metadata: {
    appName: string;
    appVersion: string;
    userAgent?: string;
    url?: string;
    userId?: string;
  };
}

// =====================================================
// Logger Class
// =====================================================

class Logger {
  private config: LoggerConfig;
  private userId?: string;
  private logBuffer: LogEntry[] = [];
  private flushTimeout: NodeJS.Timeout | null = null;
  private readonly BUFFER_SIZE = 10;
  private readonly FLUSH_INTERVAL = DURATIONS.LOGGER_FLUSH_INTERVAL;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Set the current user ID for log correlation
   */
  setUserId(userId: string | undefined): void {
    this.userId = userId;
  }

  /**
   * Update logger configuration
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Check if a log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.config.minLevel];
  }

  /**
   * Format error for logging
   */
  private formatError(error: unknown): LogEntry["error"] | undefined {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: isDevelopment ? error.stack : undefined,
      };
    }
    if (typeof error === "string") {
      return {
        name: "Error",
        message: error,
      };
    }
    return undefined;
  }

  /**
   * Create a log entry
   */
  private createEntry(
    level: LogLevel,
    message: string,
    context?: string,
    data?: Record<string, unknown>,
    error?: unknown
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      data,
      error: this.formatError(error),
      metadata: {
        appName: this.config.appName,
        appVersion: this.config.appVersion,
        userAgent: typeof window !== "undefined" ? window.navigator.userAgent : undefined,
        url: typeof window !== "undefined" ? window.location.origin + window.location.pathname : undefined,
        userId: this.userId,
      },
    };
  }

  /**
   * Output to console with appropriate formatting
   */
  private consoleOutput(entry: LogEntry): void {
    if (!this.config.enableConsole) return;

    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]${entry.context ? ` [${entry.context}]` : ""}`;
    const message = `${prefix} ${entry.message}`;

    const consoleMethod = {
      debug: console.debug, // eslint-disable-line no-console
      info: console.info, // eslint-disable-line no-console
      warn: console.warn,
      error: console.error,
    }[entry.level];

    if (entry.data || entry.error) {
      consoleMethod(message, { data: entry.data, error: entry.error });
    } else {
      consoleMethod(message);
    }
  }

  /**
   * Send logs to remote endpoint
   */
  private async sendToRemote(entries: LogEntry[]): Promise<void> {
    if (!this.config.enableRemote || !this.config.remoteEndpoint) return;

    try {
      await fetch(this.config.remoteEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ logs: entries }),
        keepalive: true,
      });
    } catch {
      // Silently fail for remote logging - don't spam console
      if (isDevelopment) {
        console.warn("Failed to send logs to remote endpoint");
      }
    }
  }

  /**
   * Buffer and flush logs for remote sending
   */
  private bufferLog(entry: LogEntry): void {
    if (!this.config.enableRemote) return;

    this.logBuffer.push(entry);

    // Flush immediately for errors
    if (entry.level === "error") {
      this.flush();
      return;
    }

    // Flush when buffer is full
    if (this.logBuffer.length >= this.BUFFER_SIZE) {
      this.flush();
      return;
    }

    // Schedule flush
    if (!this.flushTimeout) {
      this.flushTimeout = setTimeout(() => this.flush(), this.FLUSH_INTERVAL);
    }
  }

  /**
   * Flush buffered logs
   */
  flush(): void {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }

    if (this.logBuffer.length === 0) return;

    const entries = [...this.logBuffer];
    this.logBuffer = [];
    this.sendToRemote(entries);
  }

  /**
   * Main log method
   */
  private log(
    level: LogLevel,
    message: string,
    context?: string,
    data?: Record<string, unknown>,
    error?: unknown
  ): void {
    if (!this.shouldLog(level)) return;

    const entry = this.createEntry(level, message, context, data, error);
    this.consoleOutput(entry);
    this.bufferLog(entry);
  }

  /**
   * Debug level log
   */
  debug(message: string, data?: Record<string, unknown>): void;
  debug(context: string, message: string, data?: Record<string, unknown>): void;
  debug(
    contextOrMessage: string,
    messageOrData?: string | Record<string, unknown>,
    data?: Record<string, unknown>
  ): void {
    if (typeof messageOrData === "string") {
      this.log("debug", messageOrData, contextOrMessage, data);
    } else {
      this.log("debug", contextOrMessage, undefined, messageOrData);
    }
  }

  /**
   * Info level log
   */
  info(message: string, data?: Record<string, unknown>): void;
  info(context: string, message: string, data?: Record<string, unknown>): void;
  info(
    contextOrMessage: string,
    messageOrData?: string | Record<string, unknown>,
    data?: Record<string, unknown>
  ): void {
    if (typeof messageOrData === "string") {
      this.log("info", messageOrData, contextOrMessage, data);
    } else {
      this.log("info", contextOrMessage, undefined, messageOrData);
    }
  }

  /**
   * Warn level log
   */
  warn(message: string, data?: Record<string, unknown>): void;
  warn(context: string, message: string, data?: Record<string, unknown>): void;
  warn(
    contextOrMessage: string,
    messageOrData?: string | Record<string, unknown>,
    data?: Record<string, unknown>
  ): void {
    if (typeof messageOrData === "string") {
      this.log("warn", messageOrData, contextOrMessage, data);
    } else {
      this.log("warn", contextOrMessage, undefined, messageOrData);
    }
  }

  /**
   * Error level log
   */
  error(message: string, error?: unknown, data?: Record<string, unknown>): void;
  error(context: string, message: string, error?: unknown, data?: Record<string, unknown>): void;
  error(
    contextOrMessage: string,
    messageOrError?: string | unknown,
    errorOrData?: unknown | Record<string, unknown>,
    data?: Record<string, unknown>
  ): void {
    if (typeof messageOrError === "string") {
      this.log("error", messageOrError, contextOrMessage, data, errorOrData);
    } else {
      this.log(
        "error",
        contextOrMessage,
        undefined,
        errorOrData as Record<string, unknown>,
        messageOrError
      );
    }
  }

  /**
   * Create a child logger with a fixed context
   */
  child(context: string): ContextLogger {
    return new ContextLogger(this, context);
  }
}

// =====================================================
// Context Logger (Child Logger)
// =====================================================

class ContextLogger {
  constructor(
    private parent: Logger,
    private context: string
  ) {}

  debug(message: string, data?: Record<string, unknown>): void {
    this.parent.debug(this.context, message, data);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.parent.info(this.context, message, data);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.parent.warn(this.context, message, data);
  }

  error(message: string, error?: unknown, data?: Record<string, unknown>): void {
    this.parent.error(this.context, message, error, data);
  }
}

// =====================================================
// Singleton Export
// =====================================================

export const logger = new Logger();

// Export for creating custom loggers
export { Logger, ContextLogger };

// =====================================================
// Error Reporting Integration
// =====================================================

/**
 * Report an error to the error tracking service
 * This is a placeholder for integration with services like Sentry, Bugsnag, etc.
 */
export function reportError(
  error: Error,
  context?: Record<string, unknown>
): void {
  logger.error("Reported Error", error, context);

  // Integration point for error reporting services
  // Example with Sentry:
  // if (typeof Sentry !== "undefined") {
  //   Sentry.captureException(error, { extra: context });
  // }
}

/**
 * Track a custom event
 * This is a placeholder for integration with analytics services
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, unknown>
): void {
  logger.info("Event", eventName, properties);

  // Integration point for analytics services
  // Example with Amplitude:
  // if (typeof amplitude !== "undefined") {
  //   amplitude.track(eventName, properties);
  // }
}
