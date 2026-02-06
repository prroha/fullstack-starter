import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// Public routes
router.post("/register", (req, res, next) => authController.register(req, res, next));
router.post("/login", (req, res, next) => authController.login(req, res, next));
router.post("/logout", (req, res, next) => authController.logout(req, res, next));

// Protected routes
router.get("/me", authMiddleware, (req, res, next) => authController.me(req, res, next));

export default router;
