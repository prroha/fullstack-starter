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

// Password reset routes (public with rate limiting)
router.post("/forgot-password", authRateLimiter, (req, res, next) => authController.forgotPassword(req, res, next));
router.get("/verify-reset-token/:token", authRateLimiter, (req, res, next) => authController.verifyResetToken(req, res, next));
router.post("/reset-password", authRateLimiter, (req, res, next) => authController.resetPassword(req, res, next));

// Email verification routes
router.get("/verify-email/:token", authRateLimiter, (req, res, next) => authController.verifyEmail(req, res, next));
router.post("/send-verification", authMiddleware, authRateLimiter, (req, res, next) => authController.sendVerification(req, res, next));

// Protected routes
router.get("/me", authMiddleware, (req, res, next) => authController.me(req, res, next));
router.post("/change-password", authMiddleware, authRateLimiter, (req, res, next) => authController.changePassword(req, res, next));

// Session management routes (protected)
router.get("/sessions", authMiddleware, (req, res, next) => authController.getSessions(req, res, next));
router.delete("/sessions/:id", authMiddleware, (req, res, next) => authController.revokeSession(req, res, next));
router.delete("/sessions", authMiddleware, (req, res, next) => authController.revokeAllOtherSessions(req, res, next));

export default router;
