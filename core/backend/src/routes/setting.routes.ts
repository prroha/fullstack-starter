import { FastifyPluginAsync } from "fastify";
import { settingController } from "../controllers/setting.controller.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware.js";

const routePlugin: FastifyPluginAsync = async (fastify) => {
  // ============================================================================
  // Public routes
  // ============================================================================

  fastify.get("/public", (req, reply) =>
    settingController.getPublic(req, reply)
  );

  // ============================================================================
  // Admin routes (nested plugin for scoped middleware)
  // ============================================================================

  await fastify.register(async (admin) => {
    admin.addHook("preHandler", authMiddleware);
    admin.addHook("preHandler", adminMiddleware);

    admin.get("/", (req, reply) =>
      settingController.getAll(req, reply)
    );

    // Export settings (must be before /:key to avoid matching "export" as key)
    admin.get("/export", (req, reply) =>
      settingController.exportSettings(req, reply)
    );

    admin.get("/:key", (req, reply) =>
      settingController.getByKey(req, reply)
    );

    admin.post("/", (req, reply) =>
      settingController.create(req, reply)
    );

    admin.patch("/:key", (req, reply) =>
      settingController.update(req, reply)
    );

    admin.post("/bulk", (req, reply) =>
      settingController.bulkUpdate(req, reply)
    );

    admin.delete("/:key", (req, reply) =>
      settingController.delete(req, reply)
    );
  });
};

export default routePlugin;
