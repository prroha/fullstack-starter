import { FastifyPluginAsync } from "fastify";
import { announcementController } from "../controllers/announcement.controller.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware.js";

const routePlugin: FastifyPluginAsync = async (fastify) => {
  // ============================================================================
  // Public routes
  // ============================================================================

  fastify.get("/active", (req, reply) =>
    announcementController.getActive(req, reply)
  );

  // ============================================================================
  // Admin routes (nested plugin for scoped middleware)
  // ============================================================================

  await fastify.register(async (admin) => {
    admin.addHook("preHandler", authMiddleware);
    admin.addHook("preHandler", adminMiddleware);

    admin.get("/", (req, reply) =>
      announcementController.getAll(req, reply)
    );

    // Export announcements (must be before /:id to avoid matching "export" as id)
    admin.get("/export", (req, reply) =>
      announcementController.exportAnnouncements(req, reply)
    );

    admin.get("/:id", (req, reply) =>
      announcementController.getById(req, reply)
    );

    admin.post("/", (req, reply) =>
      announcementController.create(req, reply)
    );

    admin.patch("/:id", (req, reply) =>
      announcementController.update(req, reply)
    );

    admin.delete("/:id", (req, reply) =>
      announcementController.delete(req, reply)
    );
  });
};

export default routePlugin;
