import { Router } from "express";
import { contactController } from "../controllers/contact.controller";
import { createRateLimiter } from "../middleware/rate-limit.middleware";

const router = Router();

// Rate limiter for contact form submissions (5 submissions per 15 minutes per IP)
const contactFormRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  keyGenerator: "ip",
  errorCode: "CONTACT_RATE_LIMIT_EXCEEDED",
  errorMessage: "Too many contact form submissions. Please try again later.",
});

/**
 * POST /api/v1/contact
 * Submit a contact form message (public, rate limited)
 */
router.post(
  "/",
  contactFormRateLimiter,
  (req, res, next) => contactController.submit(req, res, next)
);

export default router;
