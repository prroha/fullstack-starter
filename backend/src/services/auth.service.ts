import bcrypt from "bcryptjs";
import { db } from "../lib/db";
import { config } from "../config";
import { generateTokenPair } from "../utils/jwt";
import { ApiError } from "../middleware/error.middleware";
import { ErrorCodes } from "../utils/response";

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
   */
  async login(input: LoginInput): Promise<LoginResult> {
    const { email, password, deviceId } = input;

    // Find user
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw ApiError.unauthorized("Invalid credentials", ErrorCodes.INVALID_CREDENTIALS);
    }

    // Check if active
    if (!user.isActive) {
      throw ApiError.forbidden("Account is deactivated", ErrorCodes.FORBIDDEN);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw ApiError.unauthorized("Invalid credentials", ErrorCodes.INVALID_CREDENTIALS);
    }

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
}

export const authService = new AuthService();
