import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/errors.js";
import { sendError } from "../utils/response.js";
import { env } from "../config/env.js";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response {
  if (err instanceof ApiError) {
    // Client errors (4xx) are expected — log briefly, no stack trace
    if (err.statusCode < 500) {
      console.warn(`[${err.statusCode}] ${err.code}: ${err.message}`);
    } else {
      console.error("Error:", err);
    }
    return sendError(res, err.message, err.statusCode, err.code, err.details);
  }

  // Unexpected errors always get full logging
  console.error("Error:", err);

  // Handle Prisma errors
  if (err.name === "PrismaClientKnownRequestError") {
    const prismaError = err as { code?: string; meta?: { target?: string[] } };
    if (prismaError.code === "P2002") {
      const targets = prismaError.meta?.target || [];
      const fieldMap: Record<string, string> = { email: "email", slug: "slug", code: "code", orderNumber: "order number" };
      const friendlyFields = (targets as string[]).map(t => fieldMap[t] || "value").join(", ");
      return sendError(res, `A record with this ${friendlyFields} already exists`, 409, "CONFLICT");
    }
    if (prismaError.code === "P2025") {
      return sendError(res, "Record not found", 404, "NOT_FOUND");
    }
  }

  // Handle Zod validation errors
  if (err.name === "ZodError") {
    const zodErr = err as { flatten: () => unknown };
    return sendError(res, "Validation failed", 400, "VALIDATION_ERROR", zodErr.flatten());
  }

  // Generic error
  const message = env.NODE_ENV === "production" ? "Internal server error" : err.message;
  return sendError(res, message, 500, "INTERNAL_ERROR");
}

export function notFoundHandler(_req: Request, res: Response): Response {
  return sendError(res, "Endpoint not found", 404, "NOT_FOUND");
}
