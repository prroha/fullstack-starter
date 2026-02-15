import jwt, { SignOptions } from "jsonwebtoken";
import { config } from "../config/index.js";

export interface JwtPayload {
  userId: string;
  email: string;
  deviceId?: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Generate JWT access token
 */
export function generateAccessToken(payload: Omit<JwtPayload, "iat" | "exp">): string {
  const options: SignOptions = {
    expiresIn: config.jwt.expiresIn as jwt.SignOptions["expiresIn"],
  };
  return jwt.sign(payload, config.jwt.secret, options);
}

/**
 * Generate JWT refresh token (longer expiry)
 */
export function generateRefreshToken(payload: Omit<JwtPayload, "iat" | "exp">): string {
  const options: SignOptions = {
    expiresIn: config.jwt.refreshExpiresIn as jwt.SignOptions["expiresIn"],
  };
  return jwt.sign(payload, config.jwt.secret, options);
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokenPair(payload: Omit<JwtPayload, "iat" | "exp">): TokenPair {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  const expiresIn = parseExpiry(config.jwt.expiresIn);

  return {
    accessToken,
    refreshToken,
    expiresIn,
  };
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, config.jwt.secret) as JwtPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Token expired");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Invalid token");
    }
    throw error;
  }
}

/**
 * Decode token without verification (for debugging)
 */
export function decodeToken(token: string): JwtPayload | null {
  return jwt.decode(token) as JwtPayload | null;
}

/**
 * Parse expiry string to seconds (e.g., "7d" -> 604800)
 */
function parseExpiry(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) {
    return 3600; // Default 1 hour
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case "s":
      return value;
    case "m":
      return value * 60;
    case "h":
      return value * 3600;
    case "d":
      return value * 86400;
    default:
      return 3600;
  }
}
