import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { avatarUpload } from "../middleware/upload.middleware";

const router = Router();

// All user routes are protected
router.use(authMiddleware);

// GET /api/v1/users/me - Get current user profile
router.get("/me", (req, res, next) => userController.getProfile(req, res, next));

// PATCH /api/v1/users/me - Update current user profile
router.patch("/me", (req, res, next) => userController.updateProfile(req, res, next));

// GET /api/v1/users/me/avatar - Get current user avatar
router.get("/me/avatar", (req, res, next) => userController.getAvatar(req, res, next));

// POST /api/v1/users/me/avatar - Upload avatar
router.post(
  "/me/avatar",
  avatarUpload.single("avatar"),
  (req, res, next) => userController.uploadAvatar(req, res, next)
);

// DELETE /api/v1/users/me/avatar - Delete avatar
router.delete("/me/avatar", (req, res, next) => userController.deleteAvatar(req, res, next));

// GET /api/v1/users/me/export - Export current user's data (GDPR)
router.get("/me/export", (req, res, next) => userController.exportMyData(req, res, next));

export default router;
