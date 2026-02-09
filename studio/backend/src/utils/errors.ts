/**
 * Custom API Error class
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode = 400,
    code = "API_ERROR",
    details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details?: unknown): ApiError {
    return new ApiError(message, 400, "BAD_REQUEST", details);
  }

  static unauthorized(message = "Unauthorized"): ApiError {
    return new ApiError(message, 401, "UNAUTHORIZED");
  }

  static forbidden(message = "Forbidden"): ApiError {
    return new ApiError(message, 403, "FORBIDDEN");
  }

  static notFound(resource = "Resource"): ApiError {
    return new ApiError(`${resource} not found`, 404, "NOT_FOUND");
  }

  static conflict(message: string): ApiError {
    return new ApiError(message, 409, "CONFLICT");
  }

  static tooManyRequests(message = "Too many requests"): ApiError {
    return new ApiError(message, 429, "TOO_MANY_REQUESTS");
  }

  static internal(message = "Internal server error"): ApiError {
    return new ApiError(message, 500, "INTERNAL_ERROR");
  }

  static validation(details: unknown): ApiError {
    return new ApiError("Validation failed", 400, "VALIDATION_ERROR", details);
  }
}
