import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

/**
 * Request ID Header name
 * Used for correlating requests across services
 */
export const REQUEST_ID_HEADER = "x-request-id";

/**
 * Request ID Middleware
 *
 * Generates a unique correlation ID for each request if not already present.
 * This enables end-to-end request tracing across all platforms and services.
 *
 * - If the request already has an x-request-id header, use that value
 * - Otherwise, generate a new UUID v4
 * - Attach the ID to req.id for use in middleware and handlers
 * - Set the x-request-id response header for client-side tracking
 */
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Use existing request ID from header or generate a new one
  const requestId = (req.get(REQUEST_ID_HEADER) as string) || randomUUID();

  // Attach to request object for use throughout the request lifecycle
  req.id = requestId;

  // Set response header for client-side correlation
  res.setHeader(REQUEST_ID_HEADER, requestId);

  next();
}
