/**
 * Logger Utility
 *
 * A simple logger wrapper that can be easily swapped to Winston/Pino later.
 * All logging should go through this module instead of direct console calls.
 */

import { config } from "../config";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// In production, only log warn and above by default
const MIN_LOG_LEVEL: LogLevel = config.isProduction() ? "warn" : "debug";

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LOG_LEVEL];
}

function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` ${JSON.stringify(context)}` : "";

  if (config.isProduction()) {
    // JSON format for production (easier to parse in log aggregators)
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...context,
    });
  }

  // Human-readable format for development
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
}

/**
 * Logger instance
 *
 * Usage:
 *   logger.info("User logged in", { userId: "123" });
 *   logger.error("Operation failed", { error: err.message });
 *   logger.warn("Rate limit approaching", { ip, count });
 *   logger.debug("Request details", { headers, body });
 */
export const logger = {
  debug(message: string, context?: LogContext): void {
    if (shouldLog("debug")) {
      console.debug(formatMessage("debug", message, context));
    }
  },

  info(message: string, context?: LogContext): void {
    if (shouldLog("info")) {
      console.info(formatMessage("info", message, context));
    }
  },

  warn(message: string, context?: LogContext): void {
    if (shouldLog("warn")) {
      console.warn(formatMessage("warn", message, context));
    }
  },

  error(message: string, context?: LogContext): void {
    if (shouldLog("error")) {
      console.error(formatMessage("error", message, context));
    }
  },

  /**
   * Log security-related events (always logged regardless of level)
   */
  security(message: string, context?: LogContext): void {
    const securityContext = { ...context, _security: true };
    console.warn(formatMessage("warn", `[SECURITY] ${message}`, securityContext));
  },

  /**
   * Log audit events (always logged regardless of level)
   */
  audit(message: string, context?: LogContext): void {
    const auditContext = { ...context, _audit: true };
    console.info(formatMessage("info", `[AUDIT] ${message}`, auditContext));
  },
};

export default logger;
