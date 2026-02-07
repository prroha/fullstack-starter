import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { config } from "../config";
import { logger } from "../lib/logger";
import { errorResponse, ErrorCodes } from "../utils/response";

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code: string = "API_ERROR",
    public isOperational = true
  ) {
    super(message);
    this.name = "ApiError";
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, code = ErrorCodes.INVALID_INPUT): ApiError {
    return new ApiError(400, message, code);
  }

  static unauthorized(message = "Unauthorized", code = ErrorCodes.AUTH_REQUIRED): ApiError {
    return new ApiError(401, message, code);
  }

  static forbidden(message = "Forbidden", code = ErrorCodes.FORBIDDEN): ApiError {
    return new ApiError(403, message, code);
  }

  static notFound(message = "Not found", code = ErrorCodes.NOT_FOUND): ApiError {
    return new ApiError(404, message, code);
  }

  static conflict(message: string, code = ErrorCodes.CONFLICT): ApiError {
    return new ApiError(409, message, code);
  }

  static internal(message = "Internal server error", code = ErrorCodes.INTERNAL_ERROR): ApiError {
    return new ApiError(500, message, code, false);
  }
}

/**
 * Error handling middleware
 */
export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.id;

  // Log all errors with request ID for correlation
  logger.error("Request error", {
    requestId,
    name: err.name,
    message: err.message,
    stack: config.isDevelopment() ? err.stack : undefined,
  });

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    const response = errorResponse(
      ErrorCodes.VALIDATION_ERROR,
      "Validation error",
      details
    );
    (response.error as { requestId?: string }).requestId = requestId;
    res.status(400).json(response);
    return;
  }

  // Handle API errors
  if (err instanceof ApiError) {
    const response = errorResponse(err.code, err.message);
    (response.error as { requestId?: string }).requestId = requestId;
    if (config.isDevelopment() && !err.isOperational) {
      (response.error as { stack?: string }).stack = err.stack;
    }
    res.status(err.statusCode).json(response);
    return;
  }

  // Handle Prisma errors
  if (err.name === "PrismaClientKnownRequestError") {
    const details = config.isDevelopment() ? err.message : undefined;
    const response = errorResponse(
      ErrorCodes.DATABASE_ERROR,
      "Database error",
      details
    );
    (response.error as { requestId?: string }).requestId = requestId;
    res.status(400).json(response);
    return;
  }

  // Handle unknown errors
  const message = config.isProduction() ? "Internal server error" : err.message;
  const response = errorResponse(ErrorCodes.INTERNAL_ERROR, message);
  (response.error as { requestId?: string }).requestId = requestId;
  if (config.isDevelopment()) {
    (response.error as { stack?: string }).stack = err.stack;
  }
  res.status(500).json(response);
}
