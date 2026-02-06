import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { authRateLimiter } from "../middleware/rate-limit.middleware";

const router = Router();

// Public routes (with stricter rate limiting for auth endpoints)
router.post("/register", authRateLimiter, (req, res, next) => authController.register(req, res, next));
router.post("/login", authRateLimiter, (req, res, next) => authController.login(req, res, next));
router.post("/logout", (req, res, next) => authController.logout(req, res, next));

// Token refresh (public but rate limited)
router.post("/refresh", authRateLimiter, (req, res, next) => authController.refresh(req, res, next));

// Protected routes
router.get("/me", authMiddleware, (req, res, next) => authController.me(req, res, next));

export default router;
