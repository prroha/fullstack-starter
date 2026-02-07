import { Response, NextFunction } from "express";
import { authService, AccountLockedError } from "../services/auth.service";
import { successResponse, errorResponse, ErrorCodes } from "../utils/response";
import { z } from "zod";
import { AppRequest, AuthenticatedRequest } from "../types";
import { generateCsrfToken } from "../middleware/csrf.middleware";

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

const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required").optional(),
});

class AuthController {
  /**
   * Register a new user
   * POST /api/v1/auth/register
   */
  async register(req: AppRequest, res: Response, next: NextFunction) {
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
  async login(req: AppRequest, res: Response, next: NextFunction) {
    try {
      const validated = loginSchema.parse(req.body);
      const deviceId = req.headers["x-device-id"] as string | undefined;

      const result = await authService.login({
        ...validated,
        deviceId,
      });

      // Generate CSRF token for the session
      const csrfToken = generateCsrfToken();

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

      // Set CSRF token cookie (readable by JavaScript for header inclusion)
      res.cookie("csrfToken", csrfToken, {
        httpOnly: false, // Must be readable by JS to send in header
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json(successResponse({
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        csrfToken, // Also return in body for non-browser clients
      }));
    } catch (error) {
      // Handle account lockout errors with detailed response
      if (error instanceof AccountLockedError) {
        const { lockoutStatus } = error;
        return res.status(423).json(errorResponse(
          ErrorCodes.ACCOUNT_LOCKED,
          error.message,
          {
            lockedUntil: lockoutStatus.lockedUntil?.toISOString(),
            minutesUntilUnlock: lockoutStatus.minutesUntilUnlock,
          }
        ));
      }
      next(error);
    }
  }

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh
   */
  async refresh(req: AppRequest, res: Response, next: NextFunction) {
    try {
      const validated = refreshSchema.parse(req.body);

      // Try to get refresh token from cookie first, then body
      const refreshToken = req.cookies?.refreshToken || validated.refreshToken;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_INPUT",
            message: "Refresh token is required",
          },
        });
      }

      const result = await authService.refreshToken(refreshToken);

      // Generate new CSRF token
      const csrfToken = generateCsrfToken();

      // Update cookies with new tokens
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

      // Update CSRF token cookie
      res.cookie("csrfToken", csrfToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json(successResponse({
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        csrfToken,
      }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user
   * POST /api/v1/auth/logout
   */
  async logout(_req: AppRequest, res: Response, next: NextFunction) {
    try {
      // Clear cookies
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      res.clearCookie("csrfToken");

      res.json(successResponse(null, "Logged out successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user
   * GET /api/v1/auth/me
   */
  async me(req: AppRequest, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id, email, name, role, isActive, createdAt, updatedAt } = authReq.dbUser;

      res.json(successResponse({
        user: {
          id,
          email,
          name,
          role,
          isActive,
          createdAt,
          updatedAt,
        },
      }));
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
