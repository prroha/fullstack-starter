import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "../lib/db";
import { config } from "../config";
import { generateTokenPair, verifyToken, JwtPayload } from "../utils/jwt";
import { ApiError } from "../middleware/error.middleware";
import { ErrorCodes } from "../utils/response";
import { lockoutService, LockoutStatus } from "./lockout.service";
import { emailVerificationService } from "./email-verification.service";
import { emailService } from "./email.service";
import { sessionService } from "./session.service";
import { logger } from "../lib/logger";

interface RegisterInput {
  email: string;
  password: string;
  name?: string;
}

interface LoginInput {
  email: string;
  password: string;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
}

interface LoginResult {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
  sessionId: string;
}

interface RefreshInput {
  refreshToken: string;
  ipAddress?: string;
  userAgent?: string;
}

interface RefreshResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  };
}

interface LogoutInput {
  refreshToken?: string;
}

interface ChangePasswordInput {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

interface ForgotPasswordInput {
  email: string;
}

interface ResetPasswordInput {
  token: string;
  password: string;
}

interface ResetPasswordResult {
  userId: string;
  email: string;
}

interface VerifyResetTokenResult {
  valid: boolean;
  email?: string;
}

// Password reset token expiry in milliseconds (1 hour)
const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000;

/**
 * Custom error class for account lockout
 * Includes lockout details for proper error response
 */
export class AccountLockedError extends Error {
  public lockoutStatus: LockoutStatus;

  constructor(message: string, lockoutStatus: LockoutStatus) {
    super(message);
    this.name = "AccountLockedError";
    this.lockoutStatus = lockoutStatus;
  }
}

class AuthService {
  /**
   * Register a new user
   */
  async register(input: RegisterInput) {
    const { email, password, name } = input;

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw ApiError.conflict("Email already registered", ErrorCodes.ALREADY_EXISTS);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, config.bcryptSaltRounds);

    // Create user with emailVerified = false
    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name,
        emailVerified: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    // Send verification email
    try {
      await emailVerificationService.sendVerificationEmail({
        userId: user.id,
        email: user.email,
        name: user.name,
      });
    } catch (error) {
      // Log but don't fail registration if email sending fails
      logger.error("Failed to send verification email", { userId: user.id, error });
    }

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail({
        id: user.id,
        email: user.email,
        name: user.name,
      });
    } catch (error) {
      // Log but don't fail registration if welcome email fails
      logger.error("Failed to send welcome email", { userId: user.id, error });
    }

    return user;
  }

  /**
   * Login user with email and password
   * Includes brute force protection via account lockout
   */
  async login(input: LoginInput): Promise<LoginResult> {
    const { email, password, deviceId, ipAddress, userAgent } = input;

    // Find user with lockout fields
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Don't reveal whether user exists - use consistent error
      throw ApiError.unauthorized("Invalid credentials", ErrorCodes.INVALID_CREDENTIALS);
    }

    // Check if account is locked out (before password check to prevent timing attacks)
    const lockoutStatus = lockoutService.getLockoutStatus(user);
    if (lockoutStatus.isLocked) {
      throw new AccountLockedError(
        `Account is locked. Try again in ${lockoutStatus.minutesUntilUnlock} minutes.`,
        lockoutStatus
      );
    }

    // Check if active
    if (!user.isActive) {
      throw ApiError.forbidden("Account is deactivated", ErrorCodes.FORBIDDEN);
    }

    // Verify password (bcrypt.compare is constant-time to prevent timing attacks)
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      // Record failed attempt and possibly lock the account
      const newLockoutStatus = await lockoutService.recordFailedAttempt(user.id, user.email);

      if (newLockoutStatus.isLocked) {
        throw new AccountLockedError(
          `Account is now locked due to too many failed attempts. Try again in ${newLockoutStatus.minutesUntilUnlock} minutes.`,
          newLockoutStatus
        );
      }

      throw ApiError.unauthorized("Invalid credentials", ErrorCodes.INVALID_CREDENTIALS);
    }

    // Successful login - reset failed attempts
    await lockoutService.resetFailedAttempts(user.id);

    // Update active device if provided
    if (deviceId) {
      await db.user.update({
        where: { id: user.id },
        data: { activeDeviceId: deviceId },
      });
    }

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      deviceId,
    });

    // Create session
    const sessionId = await sessionService.createSession({
      userId: user.id,
      refreshToken: tokens.refreshToken,
      ipAddress,
      userAgent,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      sessionId,
    };
  }

  /**
   * Change user password
   * Requires current password verification for security
   */
  async changePassword(input: ChangePasswordInput): Promise<void> {
    const { userId, currentPassword, newPassword } = input;

    // Find user
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw ApiError.notFound("User not found", ErrorCodes.USER_NOT_FOUND);
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      throw ApiError.unauthorized("Current password is incorrect", ErrorCodes.INVALID_CREDENTIALS);
    }

    // Check if new password is same as current
    const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSamePassword) {
      throw ApiError.badRequest("New password must be different from current password", ErrorCodes.INVALID_INPUT);
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, config.bcryptSaltRounds);

    // Update password
    await db.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    // Send password changed notification email
    try {
      await emailService.sendPasswordChangedEmail({
        id: user.id,
        email: user.email,
        name: user.name,
      });
    } catch (error) {
      // Log but don't fail if notification email fails
      logger.error("Failed to send password changed email", { userId: user.id, error });
    }

    logger.info("Password changed successfully", { userId });
  }

  /**
   * Refresh access token using a valid refresh token
   */
  async refreshToken(input: RefreshInput): Promise<RefreshResult> {
    const { refreshToken, ipAddress, userAgent } = input;

    // Verify the refresh token
    let payload: JwtPayload;
    try {
      payload = verifyToken(refreshToken);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid token";
      if (message.includes("expired")) {
        throw ApiError.unauthorized("Refresh token expired", ErrorCodes.TOKEN_EXPIRED);
      }
      throw ApiError.unauthorized("Invalid refresh token", ErrorCodes.INVALID_TOKEN);
    }

    // Check if session exists and is valid
    const session = await sessionService.findSessionByRefreshToken(refreshToken);
    if (!session) {
      throw ApiError.unauthorized("Session not found or expired", ErrorCodes.INVALID_TOKEN);
    }

    // Find the user
    const user = await db.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      throw ApiError.unauthorized("User not found", ErrorCodes.USER_NOT_FOUND);
    }

    // Check if user is active
    if (!user.isActive) {
      throw ApiError.forbidden("Account is deactivated", ErrorCodes.FORBIDDEN);
    }

    // Update session activity
    await sessionService.updateSessionActivity(refreshToken);

    // Generate new token pair
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      deviceId: payload.deviceId,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  /**
   * Logout user and invalidate session
   */
  async logout(input: LogoutInput): Promise<void> {
    const { refreshToken } = input;

    if (refreshToken) {
      await sessionService.deleteSessionByRefreshToken(refreshToken);
    }
  }

  /**
   * Get all active sessions for a user
   */
  async getSessions(userId: string, currentRefreshToken?: string) {
    return sessionService.getUserSessions(userId, currentRefreshToken);
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(userId: string, sessionId: string): Promise<void> {
    await sessionService.revokeSession(userId, sessionId);
  }

  /**
   * Revoke all sessions except current
   */
  async revokeAllOtherSessions(userId: string, currentRefreshToken: string): Promise<number> {
    return sessionService.revokeAllOtherSessions(userId, currentRefreshToken);
  }

  /**
   * Generate a secure password reset token
   * Returns a URL-safe random token
   */
  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * Request a password reset
   * Generates a token and sends email (or logs to console in dev)
   */
  async forgotPassword(input: ForgotPasswordInput): Promise<void> {
    const { email } = input;

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration attacks
    // But only create token and send email if user exists
    if (!user) {
      logger.info("Forgot password requested for non-existent email", { email });
      return;
    }

    // Check if account is active
    if (!user.isActive) {
      logger.info("Forgot password requested for deactivated account", { email });
      return;
    }

    // Invalidate any existing unused reset tokens for this user
    await db.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        used: false,
      },
      data: {
        used: true,
      },
    });

    // Generate new token
    const token = this.generateSecureToken();
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

    // Save token to database
    await db.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Send password reset email
    await this.sendResetEmail(user.email, token, user.name, user.id);

    logger.info("Password reset token generated", { userId: user.id, email: user.email });
  }

  /**
   * Send password reset email using the email service
   */
  private async sendResetEmail(email: string, token: string, name: string | null, userId: string): Promise<void> {
    const expiresInMinutes = RESET_TOKEN_EXPIRY_MS / 60000;

    await emailService.sendPasswordResetEmail(
      { id: userId, email, name },
      token,
      expiresInMinutes
    );
  }

  /**
   * Verify if a reset token is valid
   */
  async verifyResetToken(token: string): Promise<VerifyResetTokenResult> {
    const resetToken = await db.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      return { valid: false };
    }

    // Check if token is already used
    if (resetToken.used) {
      return { valid: false };
    }

    // Check if token is expired
    if (new Date() > resetToken.expiresAt) {
      return { valid: false };
    }

    return {
      valid: true,
      email: resetToken.user.email,
    };
  }

  /**
   * Reset password using a valid token
   */
  async resetPassword(input: ResetPasswordInput): Promise<ResetPasswordResult> {
    const { token, password } = input;

    // Find and validate token
    const resetToken = await db.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      throw ApiError.badRequest("Invalid or expired reset token", ErrorCodes.INVALID_TOKEN);
    }

    if (resetToken.used) {
      throw ApiError.badRequest("This reset link has already been used", ErrorCodes.INVALID_TOKEN);
    }

    if (new Date() > resetToken.expiresAt) {
      throw ApiError.badRequest("This reset link has expired. Please request a new one.", ErrorCodes.TOKEN_EXPIRED);
    }

    // Check if user is active
    if (!resetToken.user.isActive) {
      throw ApiError.forbidden("Account is deactivated", ErrorCodes.FORBIDDEN);
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, config.bcryptSaltRounds);

    // Update password and mark token as used in a transaction
    await db.$transaction([
      db.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      db.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    // Reset any lockout on the account
    await lockoutService.resetFailedAttempts(resetToken.userId);

    // Send password changed notification email
    try {
      await emailService.sendPasswordChangedEmail({
        id: resetToken.userId,
        email: resetToken.user.email,
        name: resetToken.user.name,
      });
    } catch (error) {
      // Log but don't fail if notification email fails
      logger.error("Failed to send password changed email", { userId: resetToken.userId, error });
    }

    logger.info("Password reset successful", { userId: resetToken.userId, email: resetToken.user.email });

    return {
      userId: resetToken.userId,
      email: resetToken.user.email,
    };
  }
}

export const authService = new AuthService();
