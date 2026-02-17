import { FastifyPluginAsync } from "fastify";
import { faqController } from "../controllers/faq.controller.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware.js";

const routePlugin: FastifyPluginAsync = async (fastify) => {
  // ============================================================================
  // Public routes
  // ============================================================================

  fastify.get("/public", (req, reply) =>
    faqController.getPublicFaqs(req, reply)
  );

  fastify.get("/public/categories", (req, reply) =>
    faqController.getPublicCategories(req, reply)
  );

  // ============================================================================
  // Admin routes (nested plugin for scoped middleware)
  // ============================================================================

  await fastify.register(async (admin) => {
    admin.addHook("preHandler", authMiddleware);
    admin.addHook("preHandler", adminMiddleware);

    // Categories
    admin.get("/categories", (req, reply) =>
      faqController.getCategories(req, reply)
    );

    admin.post("/categories", (req, reply) =>
      faqController.createCategory(req, reply)
    );

    admin.patch("/categories/:id", (req, reply) =>
      faqController.updateCategory(req, reply)
    );

    admin.delete("/categories/:id", (req, reply) =>
      faqController.deleteCategory(req, reply)
    );

    // FAQs
    admin.get("/", (req, reply) =>
      faqController.getFaqs(req, reply)
    );

    // Export FAQs (must be before /:id to avoid matching "export" as id)
    admin.get("/export", (req, reply) =>
      faqController.exportFaqs(req, reply)
    );

    admin.get("/:id", (req, reply) =>
      faqController.getFaq(req, reply)
    );

    admin.post("/", (req, reply) =>
      faqController.createFaq(req, reply)
    );

    admin.patch("/:id", (req, reply) =>
      faqController.updateFaq(req, reply)
    );

    admin.delete("/:id", (req, reply) =>
      faqController.deleteFaq(req, reply)
    );

    admin.post("/reorder", (req, reply) =>
      faqController.reorderFaqs(req, reply)
    );
  });
};

export default routePlugin;
