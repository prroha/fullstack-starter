import { Router, Request, Response, NextFunction } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "../../config/db.js";
import { env } from "../../config/env.js";
import { ApiError } from "../../utils/errors.js";

const router = Router();

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
  async (req: Request<object, object, LoginRequest>, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw ApiError.badRequest("Email and password are required");
      }

      // Check if admin credentials are configured
      const adminEmail = env.ADMIN_EMAIL;
      const adminPassword = env.ADMIN_PASSWORD;

      if (!adminEmail || !adminPassword) {
        throw ApiError.internal("Admin credentials not configured");
      }

      // Validate admin credentials
      if (email !== adminEmail) {
        throw ApiError.unauthorized("Invalid credentials");
      }

      // For simple setup, compare plain password (in production, use hashed)
      // If password starts with $2, it's a bcrypt hash
      let isValidPassword = false;
      if (adminPassword.startsWith("$2")) {
        isValidPassword = await bcrypt.compare(password, adminPassword);
      } else {
        isValidPassword = password === adminPassword;
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
      res.cookie("auth_token", token, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: env.NODE_ENV === "production" ? "strict" : "lax",
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

    const payload = jwt.verify(token, env.JWT_SECRET) as {
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
  res.clearCookie("auth_token", {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "strict" : "lax",
  });

  res.json({
    success: true,
    message: "Logged out successfully",
  });
});

export { router as authRoutes };
