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
  console.error("Error:", err);

  if (err instanceof ApiError) {
    return sendError(res, err.message, err.statusCode, err.code, err.details);
  }

  // Handle Prisma errors
  if (err.name === "PrismaClientKnownRequestError") {
    const prismaError = err as { code?: string; meta?: { target?: string[] } };
    if (prismaError.code === "P2002") {
      const target = prismaError.meta?.target?.join(", ") || "field";
      return sendError(res, `A record with this ${target} already exists`, 409, "CONFLICT");
    }
    if (prismaError.code === "P2025") {
      return sendError(res, "Record not found", 404, "NOT_FOUND");
    }
  }

  // Handle Zod validation errors
  if (err.name === "ZodError") {
    return sendError(res, "Validation failed", 400, "VALIDATION_ERROR", err);
  }

  // Generic error
  const message = env.NODE_ENV === "production" ? "Internal server error" : err.message;
  return sendError(res, message, 500, "INTERNAL_ERROR");
}

export function notFoundHandler(_req: Request, res: Response): Response {
  return sendError(res, "Endpoint not found", 404, "NOT_FOUND");
}
