import { FastifyPluginAsync } from "fastify";
import { contentController } from "../controllers/content.controller.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware.js";

const routePlugin: FastifyPluginAsync = async (fastify) => {
  // ============================================================================
  // Public routes
  // ============================================================================

  fastify.get("/page/:slug", (req, reply) =>
    contentController.getBySlug(req, reply)
  );

  // ============================================================================
  // Admin routes (nested plugin for scoped middleware)
  // ============================================================================

  await fastify.register(async (admin) => {
    admin.addHook("preHandler", authMiddleware);
    admin.addHook("preHandler", adminMiddleware);

    admin.get("/", (req, reply) =>
      contentController.getAll(req, reply)
    );

    // Export content pages (must be before /:id to avoid matching "export" as id)
    admin.get("/export", (req, reply) =>
      contentController.exportContentPages(req, reply)
    );

    admin.get("/:id", (req, reply) =>
      contentController.getById(req, reply)
    );

    admin.post("/", (req, reply) =>
      contentController.create(req, reply)
    );

    admin.patch("/:id", (req, reply) =>
      contentController.update(req, reply)
    );

    admin.delete("/:id", (req, reply) =>
      contentController.delete(req, reply)
    );
  });
};

export default routePlugin;
