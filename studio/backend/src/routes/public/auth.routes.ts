import { Router, Request, Response, NextFunction } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import { prisma } from "../../config/db.js";
import { env } from "../../config/env.js";
import { ApiError } from "../../utils/errors.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { success: false, error: { message: "Too many login attempts, please try again later", code: "RATE_LIMITED" } },
  standardHeaders: true,
  legacyHeaders: false,
});

// =====================================================
// Admin Login
// POST /auth/admin/login
// =====================================================

interface LoginRequest {
  email: string;
  password: string;
}

router.post(
  "/admin/login",
  loginLimiter,
  async (req: Request<object, object, LoginRequest>, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw ApiError.badRequest("Email and password are required");
      }
      if (typeof email !== 'string' || email.length > 255) {
        throw ApiError.badRequest("Invalid email format");
      }
      if (typeof password !== 'string' || password.length > 200) {
        throw ApiError.badRequest("Invalid password format");
      }

      // Validate admin credentials
      const adminEmail = env.ADMIN_EMAIL;
      const adminPassword = env.ADMIN_PASSWORD;

      if (email !== adminEmail) {
        throw ApiError.unauthorized("Invalid credentials");
      }

      // Password comparison: require bcrypt hash in production
      let isValidPassword = false;
      if (adminPassword.startsWith("$2")) {
        isValidPassword = await bcrypt.compare(password, adminPassword);
      } else if (env.NODE_ENV === "production") {
        throw ApiError.internal(
          "ADMIN_PASSWORD must be a bcrypt hash in production. " +
            'Generate one with: node -e "require(\'bcryptjs\').hash(\'yourpassword\', 10).then(console.log)"'
        );
      } else {
        // Development only: plaintext comparison with timing-safe check
        console.warn(
          "⚠️  WARNING: ADMIN_PASSWORD is stored in plaintext. " +
            "This is only allowed in development. " +
            'Use a bcrypt hash: node -e "require(\'bcryptjs\').hash(\'yourpassword\', 10).then(console.log)"'
        );
        const passwordBuffer = Buffer.from(password);
        const adminPasswordBuffer = Buffer.from(adminPassword);
        if (passwordBuffer.length === adminPasswordBuffer.length) {
          isValidPassword = crypto.timingSafeEqual(passwordBuffer, adminPasswordBuffer);
        } else {
          isValidPassword = false;
        }
      }

      if (!isValidPassword) {
        throw ApiError.unauthorized("Invalid credentials");
      }

      // Find or create admin user in database
      let user = await prisma.studioUser.findUnique({
        where: { email: adminEmail },
      });

      if (!user) {
        // Create admin user if doesn't exist
        user = await prisma.studioUser.create({
          data: {
            email: adminEmail,
            name: "Admin",
            emailVerified: true,
          },
        });
      }

      // Generate JWT token
      const signOptions: SignOptions = {
        algorithm: 'HS256',
        expiresIn: "24h",
      };
      const token = jwt.sign(
        {
          userId: user.id,
          role: "admin",
        },
        env.JWT_SECRET,
        signOptions
      );

      // Set HTTP-only cookie
      // In production with cross-origin (frontend != backend domain),
      // sameSite must be "none" (requires secure: true) for cookies to be sent
      const isSecure = env.NODE_ENV !== "development";
      res.cookie("auth_token", token, {
        httpOnly: true,
        secure: isSecure,
        sameSite: isSecure ? "none" : "lax",
        path: "/",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: "admin",
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// =====================================================
// Get Current User
// GET /auth/me
// =====================================================

// Custom middleware to extract token from cookie or header
async function authenticateFromCookie(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Try to get token from cookie first, then header
    const cookieToken = req.cookies?.auth_token;
    const authHeader = req.headers.authorization;
    const headerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const token = cookieToken || headerToken;

    if (!token) {
      throw ApiError.unauthorized("Not authenticated");
    }

    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] }) as {
      userId: string;
      role?: string;
    };

    const user = await prisma.studioUser.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true, isBlocked: true },
    });

    if (!user) {
      throw ApiError.unauthorized("User not found");
    }

    if (user.isBlocked) {
      throw ApiError.forbidden("Account is blocked");
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: (payload.role as "user" | "admin") || "user",
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(ApiError.unauthorized("Invalid token"));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(ApiError.unauthorized("Token expired"));
    } else {
      next(error);
    }
  }
}

router.get(
  "/me",
  authenticateFromCookie,
  async (req: Request, res: Response) => {
    res.json({
      success: true,
      user: req.user,
    });
  }
);

// =====================================================
// Logout
// POST /auth/logout
// =====================================================

router.post("/logout", (_req: Request, res: Response) => {
  const isSecure = env.NODE_ENV !== "development";
  res.clearCookie("auth_token", {
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? "none" : "lax",
    path: "/",
  });

  res.json({
    success: true,
    message: "Logged out successfully",
  });
});

export { router as authRoutes };
