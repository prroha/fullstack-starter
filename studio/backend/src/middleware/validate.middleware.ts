/**
 * Request Validation Middleware
 * Uses Zod schemas to validate request body, query, and params
 */

import { FastifyRequest, FastifyReply } from "fastify";
import { AnyZodObject, ZodError } from "zod";
import { ApiError } from "../utils/errors.js";

/**
 * Middleware factory for validating requests against Zod schemas
 * @param schema - Zod schema with optional body, query, and params properties
 */
export function validateRequest<T extends AnyZodObject>(schema: T) {
  return async (req: FastifyRequest, _reply: FastifyReply) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          path: err.path.join("."),
          message: err.message,
        }));
        throw ApiError.validation(formattedErrors);
      }
      throw error;
    }
  };
}
