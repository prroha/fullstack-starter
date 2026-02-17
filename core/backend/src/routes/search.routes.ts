import { FastifyPluginAsync } from "fastify";
import { searchController } from "../controllers/search.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const routePlugin: FastifyPluginAsync = async (fastify) => {
  /**
   * @route   GET /api/v1/search
   * @desc    Global search across multiple entities
   * @access  Private (authenticated users)
   * @query   q - Search query (required, min 2 chars)
   * @query   type - Search type: all | users (default: all)
   * @query   limit - Results per type (default: 5, max: 20)
   */
  fastify.get("/", { preHandler: [authMiddleware] }, searchController.search);
};

export default routePlugin;
