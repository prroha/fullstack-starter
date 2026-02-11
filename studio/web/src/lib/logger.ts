// =====================================================
// Logger Utility
// =====================================================
//
// Re-exports the logger from core for consistent logging.
// The logger provides structured logging with different levels
// and is configured based on the environment.
//
// Log Levels:
// - logger.debug(tag, message, data?) - Development only
// - logger.info(tag, message, data?) - Informational
// - logger.warn(tag, message, data?) - Warnings
// - logger.error(tag, message, error?, data?) - Errors
//
// Usage:
//   import { logger } from "@/lib/logger";
//
//   logger.info("Orders", "Order created", { orderId: "123" });
//   logger.error("API", "Failed to fetch", error, { endpoint: "/orders" });
//
// Configuration:
// - Debug logs are only shown in development
// - All logs include timestamps in development
// - Errors are always logged regardless of environment
// =====================================================

export * from "@core/lib/logger";
