import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service";
import { successResponse } from "../utils/response";
import { z } from "zod";

// Validation schemas
const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required").optional(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

class AuthController {
  /**
   * Register a new user
   * POST /api/v1/auth/register
   */
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = registerSchema.parse(req.body);
      const user = await authService.register(validated);

      res.status(201).json(successResponse(
        { user },
        "Registration successful"
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   * POST /api/v1/auth/login
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = loginSchema.parse(req.body);
      const deviceId = req.headers["x-device-id"] as string | undefined;

      const result = await authService.login({
        ...validated,
        deviceId,
      });

      // Set httpOnly cookies for web clients
      res.cookie("accessToken", result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      res.json(successResponse({
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user
   * POST /api/v1/auth/logout
   */
  async logout(_req: Request, res: Response, next: NextFunction) {
    try {
      // Clear cookies
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");

      res.json(successResponse(null, "Logged out successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user
   * GET /api/v1/auth/me
   */
  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as Request & { dbUser: unknown };
      res.json(successResponse({ user: authReq.dbUser }));
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
