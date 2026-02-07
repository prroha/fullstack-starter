import bcrypt from "bcryptjs";
import { db } from "../lib/db";
import { config } from "../config";
import { generateTokenPair, verifyToken, JwtPayload } from "../utils/jwt";
import { ApiError } from "../middleware/error.middleware";
import { ErrorCodes } from "../utils/response";
import { lockoutService, LockoutStatus } from "./lockout.service";

interface RegisterInput {
  email: string;
  password: string;
  name?: string;
}

interface LoginInput {
  email: string;
  password: string;
  deviceId?: string;
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

    // Create user
    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  }

  /**
   * Login user with email and password
   * Includes brute force protection via account lockout
   */
  async login(input: LoginInput): Promise<LoginResult> {
    const { email, password, deviceId } = input;

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

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Refresh access token using a valid refresh token
   */
  async refreshToken(refreshToken: string): Promise<RefreshResult> {
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
}

export const authService = new AuthService();
