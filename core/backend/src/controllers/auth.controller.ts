import { Response, NextFunction } from "express";
import { AuditAction } from "@prisma/client";
import { authService, AccountLockedError } from "../services/auth.service";
import { emailVerificationService } from "../services/email-verification.service";
import { auditService } from "../services/audit.service";
import { successResponse, errorResponse, ErrorCodes } from "../utils/response";
import { z } from "zod";
import { AppRequest, AuthenticatedRequest } from "../types";
import { generateCsrfToken } from "../middleware/csrf.middleware";
import {
  setAuthCookies,
  clearAuthCookies,
  extractRefreshToken,
} from "../utils/cookies";
import {
  emailSchema,
  passwordSchema,
  strongPasswordSchema,
  nameSchema,
} from "../utils/validation-schemas";
import { ensureParam } from "../utils/controller-helpers";

// ============================================================================
// Validation Schemas
// ============================================================================

const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema.optional(),
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required").optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: strongPasswordSchema,
  confirmPassword: z.string().min(1, "Password confirmation is required"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const forgotPasswordSchema = z.object({
  email: emailSchema,
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: strongPasswordSchema,
  confirmPassword: z.string().min(1, "Password confirmation is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
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

      // Audit log: user registration
      await auditService.log({
        action: AuditAction.CREATE,
        entity: "User",
        entityId: user.id,
        userId: user.id,
        req,
        metadata: { email: user.email },
      });

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
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers["user-agent"];

      const result = await authService.login({
        ...validated,
        deviceId,
        ipAddress,
        userAgent,
      });

      // Generate CSRF token for the session
      const csrfToken = generateCsrfToken();

      // Set authentication cookies for web clients
      setAuthCookies(res, {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        csrfToken,
      });

      // Audit log: successful login
      await auditService.log({
        action: AuditAction.LOGIN,
        entity: "User",
        entityId: result.user.id,
        userId: result.user.id,
        req,
        metadata: { email: result.user.email },
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

        // Audit log: account locked
        await auditService.log({
          action: AuditAction.LOGIN_FAILED,
          entity: "User",
          req,
          metadata: {
            reason: "account_locked",
            email: req.body?.email,
            lockedUntil: lockoutStatus.lockedUntil?.toISOString(),
          },
        });

        return res.status(423).json(errorResponse(
          ErrorCodes.ACCOUNT_LOCKED,
          error.message,
          {
            lockedUntil: lockoutStatus.lockedUntil?.toISOString(),
            minutesUntilUnlock: lockoutStatus.minutesUntilUnlock,
          }
        ));
      }

      // Audit log: failed login (invalid credentials)
      await auditService.log({
        action: AuditAction.LOGIN_FAILED,
        entity: "User",
        req,
        metadata: {
          reason: "invalid_credentials",
          email: req.body?.email,
        },
      });

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
      const refreshToken = extractRefreshToken(req) || validated.refreshToken;

      if (!refreshToken) {
        return res.status(400).json(
          errorResponse(ErrorCodes.INVALID_INPUT, "Refresh token is required")
        );
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers["user-agent"];

      const result = await authService.refreshToken({
        refreshToken,
        ipAddress,
        userAgent,
      });

      // Generate new CSRF token and set all auth cookies
      const csrfToken = generateCsrfToken();
      setAuthCookies(res, {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        csrfToken,
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
  async logout(req: AppRequest, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;

      // Audit log: logout
      if (authReq.user?.userId) {
        await auditService.log({
          action: AuditAction.LOGOUT,
          entity: "Session",
          entityId: authReq.user.userId,
          userId: authReq.user.userId,
          req,
        });
      }

      // Get refresh token to invalidate session
      const refreshToken = extractRefreshToken(req);

      // Invalidate session in database
      if (refreshToken) {
        await authService.logout({ refreshToken });
      }

      // Clear all auth cookies
      clearAuthCookies(res);

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
      const { id, email, name, role, isActive, emailVerified, createdAt, updatedAt } = authReq.dbUser;

      res.json(successResponse({
        user: {
          id,
          email,
          name,
          role,
          isActive,
          emailVerified,
          createdAt,
          updatedAt,
        },
      }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change user password
   * POST /api/v1/auth/change-password
   */
  async changePassword(req: AppRequest, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const validated = changePasswordSchema.parse(req.body);

      await authService.changePassword({
        userId: authReq.dbUser.id,
        currentPassword: validated.currentPassword,
        newPassword: validated.newPassword,
      });

      // Audit log: password change
      await auditService.log({
        action: AuditAction.PASSWORD_CHANGE,
        entity: "User",
        entityId: authReq.dbUser.id,
        userId: authReq.dbUser.id,
        req,
      });

      res.json(successResponse(null, "Password changed successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Request password reset
   * POST /api/v1/auth/forgot-password
   */
  async forgotPassword(req: AppRequest, res: Response, next: NextFunction) {
    try {
      const validated = forgotPasswordSchema.parse(req.body);

      await authService.forgotPassword({ email: validated.email });

      // Always return success to prevent email enumeration
      res.json(successResponse(
        null,
        "If an account with that email exists, we have sent a password reset link."
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify reset token validity
   * GET /api/v1/auth/verify-reset-token/:token
   */
  async verifyResetToken(req: AppRequest, res: Response, next: NextFunction) {
    try {
      const token = req.params.token as string;

      if (!ensureParam(token, res, "Reset token")) {
        return;
      }

      const result = await authService.verifyResetToken(token);

      res.json(successResponse({
        valid: result.valid,
        email: result.email,
      }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset password with token
   * POST /api/v1/auth/reset-password
   */
  async resetPassword(req: AppRequest, res: Response, next: NextFunction) {
    try {
      const validated = resetPasswordSchema.parse(req.body);

      const result = await authService.resetPassword({
        token: validated.token,
        password: validated.password,
      });

      // Audit log: password reset
      if (result?.userId) {
        await auditService.log({
          action: AuditAction.PASSWORD_RESET,
          entity: "User",
          entityId: result.userId,
          userId: result.userId,
          req,
        });
      }

      res.json(successResponse(
        null,
        "Password has been reset successfully. You can now log in with your new password."
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify email with token
   * GET /api/v1/auth/verify-email/:token
   */
  async verifyEmail(req: AppRequest, res: Response, next: NextFunction) {
    try {
      const token = req.params.token as string;

      if (!ensureParam(token, res, "Verification token")) {
        return;
      }

      const result = await emailVerificationService.verifyEmail(token);

      res.json(successResponse({
        verified: result.success,
        email: result.email,
      }, "Email verified successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Resend verification email
   * POST /api/v1/auth/send-verification
   */
  async sendVerification(req: AppRequest, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;

      await emailVerificationService.resendVerificationEmail(authReq.dbUser.id);

      res.json(successResponse(
        null,
        "Verification email sent. Please check your inbox."
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all active sessions for the current user
   * GET /api/v1/auth/sessions
   */
  async getSessions(req: AppRequest, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const refreshToken = extractRefreshToken(req);

      const sessions = await authService.getSessions(authReq.dbUser.id, refreshToken);

      res.json(successResponse({ sessions }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Revoke a specific session
   * DELETE /api/v1/auth/sessions/:id
   */
  async revokeSession(req: AppRequest, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const sessionId = req.params.id as string;

      if (!ensureParam(sessionId, res, "Session ID")) {
        return;
      }

      await authService.revokeSession(authReq.dbUser.id, sessionId);

      res.json(successResponse(null, "Session revoked successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Revoke all other sessions (except current)
   * DELETE /api/v1/auth/sessions
   */
  async revokeAllOtherSessions(req: AppRequest, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const refreshToken = extractRefreshToken(req);

      if (!ensureParam(refreshToken, res, "Refresh token")) {
        return;
      }

      const count = await authService.revokeAllOtherSessions(authReq.dbUser.id, refreshToken);

      res.json(successResponse(
        { revokedCount: count },
        `${count} session${count === 1 ? "" : "s"} revoked successfully`
      ));
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
