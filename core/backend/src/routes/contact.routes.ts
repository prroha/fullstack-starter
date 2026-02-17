import { FastifyPluginAsync } from "fastify";
import { contactController } from "../controllers/contact.controller.js";
import { createRateLimiter } from "../middleware/rate-limit.middleware.js";

// Rate limiter for contact form submissions (5 submissions per 15 minutes per IP)
const contactFormRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  keyGenerator: "ip",
  errorCode: "CONTACT_RATE_LIMIT_EXCEEDED",
  errorMessage: "Too many contact form submissions. Please try again later.",
});

const routePlugin: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /api/v1/contact
   * Submit a contact form message (public, rate limited)
   */
  fastify.post(
    "/",
    { preHandler: [contactFormRateLimiter] },
    (req, reply) => contactController.submit(req, reply)
  );
};

export default routePlugin;
