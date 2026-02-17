import { FastifyRequest, FastifyReply, FastifyError } from "fastify";
import { ApiError } from "../utils/errors.js";
import { sendError } from "../utils/response.js";
import { env } from "../config/env.js";

export function errorHandler(
  err: FastifyError | Error,
  _req: FastifyRequest,
  reply: FastifyReply
): void {
  if (err instanceof ApiError) {
    // Client errors (4xx) are expected — log briefly, no stack trace
    if (err.statusCode < 500) {
      console.warn(`[${err.statusCode}] ${err.code}: ${err.message}`);
    } else {
      console.error("Error:", err);
    }
    sendError(reply, err.message, err.statusCode, err.code, err.details);
    return;
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
      sendError(reply, `A record with this ${friendlyFields} already exists`, 409, "CONFLICT");
      return;
    }
    if (prismaError.code === "P2025") {
      sendError(reply, "Record not found", 404, "NOT_FOUND");
      return;
    }
  }

  // Handle Zod validation errors
  if (err.name === "ZodError") {
    const zodErr = err as unknown as { flatten: () => unknown };
    sendError(reply, "Validation failed", 400, "VALIDATION_ERROR", zodErr.flatten());
    return;
  }

  // Generic error
  const message = env.NODE_ENV === "production" ? "Internal server error" : err.message;
  sendError(reply, message, 500, "INTERNAL_ERROR");
}

export function notFoundHandler(_req: FastifyRequest, reply: FastifyReply): void {
  sendError(reply, "Endpoint not found", 404, "NOT_FOUND");
}
