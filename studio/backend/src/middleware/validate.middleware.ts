/**
 * Request Validation Middleware
 * Uses Zod schemas to validate request body, query, and params
 */

import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";
import { ApiError } from "../utils/errors.js";

/**
 * Middleware factory for validating requests against Zod schemas
 * @param schema - Zod schema with optional body, query, and params properties
 */
export function validateRequest<T extends AnyZodObject>(schema: T) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          path: err.path.join("."),
          message: err.message,
        }));
        throw ApiError.validation(formattedErrors);
      }
      next(error);
    }
  };
}
