import { Response, NextFunction } from "express";
import { AppRequest } from "../types";

/**
 * HTML entities to escape for XSS prevention
 */
const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&#x60;",
  "=": "&#x3D;",
};

/**
 * Regex pattern to match dangerous characters
 */
const DANGEROUS_CHARS_REGEX = /[&<>"'`=/]/g;

/**
 * Escape HTML entities in a string
 */
function escapeHtml(str: string): string {
  return str.replace(DANGEROUS_CHARS_REGEX, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Remove potentially dangerous script tags and event handlers
 */
function stripDangerousPatterns(str: string): string {
  // Remove script tags
  let sanitized = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, "");

  // Remove javascript: URLs
  sanitized = sanitized.replace(/javascript\s*:/gi, "");

  // Remove data: URLs that could contain scripts
  sanitized = sanitized.replace(/data\s*:\s*text\/html/gi, "");

  // Remove vbscript: URLs (IE specific)
  sanitized = sanitized.replace(/vbscript\s*:/gi, "");

  return sanitized;
}

/**
 * Sanitize a single string value
 * @param value - The string to sanitize
 * @param options - Sanitization options
 */
export function sanitizeString(
  value: string,
  options: {
    escapeHtml?: boolean;
    stripDangerous?: boolean;
    trim?: boolean;
    maxLength?: number;
  } = {}
): string {
  const {
    escapeHtml: shouldEscapeHtml = true,
    stripDangerous = true,
    trim = true,
    maxLength,
  } = options;

  let result = value;

  // Trim whitespace
  if (trim) {
    result = result.trim();
  }

  // Strip dangerous patterns first
  if (stripDangerous) {
    result = stripDangerousPatterns(result);
  }

  // Escape HTML entities
  if (shouldEscapeHtml) {
    result = escapeHtml(result);
  }

  // Enforce max length
  if (maxLength && result.length > maxLength) {
    result = result.substring(0, maxLength);
  }

  return result;
}

/**
 * Deep sanitize an object (recursively sanitize all string values)
 */
export function sanitizeObject<T>(obj: T, visited = new WeakSet<object>()): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle strings
  if (typeof obj === "string") {
    return sanitizeString(obj) as T;
  }

  // Handle non-objects
  if (typeof obj !== "object") {
    return obj;
  }

  // Handle circular references
  if (visited.has(obj as object)) {
    return obj;
  }
  visited.add(obj as object);

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, visited)) as T;
  }

  // Handle plain objects
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    // Sanitize the key as well (for dynamic keys)
    const sanitizedKey = sanitizeString(key, { escapeHtml: false, trim: false });
    sanitized[sanitizedKey] = sanitizeObject(value, visited);
  }

  return sanitized as T;
}

/**
 * Fields that should not be sanitized (e.g., passwords, tokens)
 * These fields may contain special characters that are valid
 */
const SKIP_SANITIZE_FIELDS = [
  "password",
  "passwordHash",
  "password_hash",
  "token",
  "accessToken",
  "refreshToken",
  "access_token",
  "refresh_token",
  "authorization",
  "apiKey",
  "api_key",
  "secret",
  "signature",
];

/**
 * Check if a field should be skipped for sanitization
 */
function shouldSkipField(fieldName: string): boolean {
  const lowerField = fieldName.toLowerCase();
  return SKIP_SANITIZE_FIELDS.some((skip) => lowerField.includes(skip.toLowerCase()));
}

/**
 * Selective sanitize an object, skipping certain fields
 */
export function selectiveSanitizeObject<T>(obj: T, visited = new WeakSet<object>()): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "string") {
    return sanitizeString(obj) as T;
  }

  if (typeof obj !== "object") {
    return obj;
  }

  if (visited.has(obj as object)) {
    return obj;
  }
  visited.add(obj as object);

  if (Array.isArray(obj)) {
    return obj.map((item) => selectiveSanitizeObject(item, visited)) as T;
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (shouldSkipField(key)) {
      // Keep the original value for sensitive fields
      sanitized[key] = value;
    } else if (typeof value === "string") {
      sanitized[key] = sanitizeString(value);
    } else {
      sanitized[key] = selectiveSanitizeObject(value, visited);
    }
  }

  return sanitized as T;
}

/**
 * Input Sanitization Middleware
 *
 * Sanitizes request body, query parameters, and URL parameters
 * to prevent XSS attacks and other injection vulnerabilities.
 *
 * Should be applied after body parsing middleware.
 */
export function sanitizeInput(
  req: AppRequest,
  _res: Response,
  next: NextFunction
): void {
  try {
    // Sanitize request body
    if (req.body && typeof req.body === "object") {
      req.body = selectiveSanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === "object") {
      req.query = sanitizeObject(req.query);
    }

    // Sanitize URL parameters
    if (req.params && typeof req.params === "object") {
      req.params = sanitizeObject(req.params);
    }

    next();
  } catch {
    // If sanitization fails, continue with unsanitized input
    // but log the error (the error middleware will handle any issues)
    next();
  }
}

/**
 * Create a custom sanitization middleware with specific options
 */
export function createSanitizeMiddleware(options: {
  sanitizeBody?: boolean;
  sanitizeQuery?: boolean;
  sanitizeParams?: boolean;
  skipFields?: string[];
}) {
  const {
    sanitizeBody = true,
    sanitizeQuery = true,
    sanitizeParams = true,
    skipFields = [],
  } = options;

  // Add custom skip fields
  const allSkipFields = [...SKIP_SANITIZE_FIELDS, ...skipFields];

  const shouldSkip = (fieldName: string): boolean => {
    const lowerField = fieldName.toLowerCase();
    return allSkipFields.some((skip) => lowerField.includes(skip.toLowerCase()));
  };

  const customSanitize = <T>(obj: T, visited = new WeakSet<object>()): T => {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === "string") return sanitizeString(obj) as T;
    if (typeof obj !== "object") return obj;
    if (visited.has(obj as object)) return obj;
    visited.add(obj as object);

    if (Array.isArray(obj)) {
      return obj.map((item) => customSanitize(item, visited)) as T;
    }

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (shouldSkip(key)) {
        sanitized[key] = value;
      } else if (typeof value === "string") {
        sanitized[key] = sanitizeString(value);
      } else {
        sanitized[key] = customSanitize(value, visited);
      }
    }
    return sanitized as T;
  };

  return (req: AppRequest, _res: Response, next: NextFunction): void => {
    try {
      if (sanitizeBody && req.body && typeof req.body === "object") {
        req.body = customSanitize(req.body);
      }
      if (sanitizeQuery && req.query && typeof req.query === "object") {
        req.query = sanitizeObject(req.query);
      }
      if (sanitizeParams && req.params && typeof req.params === "object") {
        req.params = sanitizeObject(req.params);
      }
      next();
    } catch {
      next();
    }
  };
}
