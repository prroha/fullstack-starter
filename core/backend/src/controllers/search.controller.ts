import { FastifyRequest, FastifyReply } from "fastify";
import { searchService, SearchType } from "../services/search.service.js";
import { successResponse } from "../utils/response.js";
import { z } from "zod";
import { AuthenticatedRequest } from "../types/index.js";
import { UserRole } from "@prisma/client";

// Validation schema for search query params
const searchQuerySchema = z.object({
  q: z
    .string()
    .min(2, "Search query must be at least 2 characters")
    .max(100, "Search query must be less than 100 characters"),
  type: z.enum(["all", "users"]).default("all"),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1).max(20))
    .optional(),
});

class SearchController {
  /**
   * Global search across multiple entities
   * GET /api/v1/search?q=query&type=all|users
   */
  async search(req: FastifyRequest, reply: FastifyReply) {
    const authReq = req as AuthenticatedRequest;

    // Validate query params
    const validated = searchQuerySchema.parse({
      q: (req.query as Record<string, string>).q,
      type: (req.query as Record<string, string>).type,
      limit: (req.query as Record<string, string>).limit,
    });

    const isAdmin = authReq.dbUser.role === UserRole.ADMIN || authReq.dbUser.role === UserRole.SUPER_ADMIN;

    const results = await searchService.search({
      query: validated.q,
      types: validated.type as SearchType,
      userId: authReq.dbUser.id,
      isAdmin,
      limit: validated.limit,
    });

    return reply.send(successResponse({ results }));
  }
}

export const searchController = new SearchController();
