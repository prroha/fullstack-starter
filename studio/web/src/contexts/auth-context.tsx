"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { API_CONFIG } from "@/lib/constants";
import { logger } from "@/lib/logger";

// =====================================================
// Types
// =====================================================

/** User role types for Studio admin */
export type StudioUserRole = "user" | "admin";

/**
 * Authenticated user information for the Studio admin panel
 */
export interface AuthUser {
  /** Unique user identifier */
  id: string;
  /** User email address */
  email: string;
  /** User display name */
  name: string | null;
  /** User role for access control */
  role: StudioUserRole;
  /** Whether email is verified */
  emailVerified?: boolean;
}

/**
 * Authentication context value interface
 */
interface AuthContextValue {
  /** Currently authenticated user or null */
  user: AuthUser | null;
  /** Whether a user is authenticated */
  isAuthenticated: boolean;
  /** Whether auth state is being loaded */
  isLoading: boolean;
  /** Whether user has admin access */
  isAdmin: boolean;
  /** Login with email and password */
  login: (email: string, password: string) => Promise<void>;
  /** Logout and clear session */
  logout: () => Promise<void>;
  /** Refresh authentication state */
  checkAuth: () => Promise<void>;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

// =====================================================
// Context
// =====================================================

const AuthContext = createContext<AuthContextValue | null>(null);

// =====================================================
// Provider
// =====================================================

/**
 * AuthProvider - Manages authentication state for Studio admin panel
 * Uses httpOnly cookies for secure session management
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/me`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        logger.debug("Auth", "Auth check successful", { userId: data.user?.id });
      } else {
        setUser(null);
        logger.debug("Auth", "Auth check failed - no valid session");
      }
    } catch (error) {
      logger.error("Auth", "Auth check failed", error as Error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await fetch(`${API_CONFIG.BASE_URL}/auth/admin/login`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.message || data.error?.message || "Login failed";
      logger.warn("Auth", "Login failed", { email, error: errorMessage });
      throw new Error(errorMessage);
    }

    setUser(data.user);
    logger.info("Auth", "Login successful", { userId: data.user?.id });
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_CONFIG.BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      logger.info("Auth", "Logout successful");
    } catch (error) {
      logger.error("Auth", "Logout error", error as Error);
    } finally {
      setUser(null);
    }
  }, []);

  // Check auth status on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Compute admin status from role type
  const isAdmin = user?.role === "admin";

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      isAdmin,
      login,
      logout,
      checkAuth,
    }),
    [user, isLoading, isAdmin, login, logout, checkAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// =====================================================
// Hook
// =====================================================

/**
 * Hook to access authentication context
 * @throws Error if used outside AuthProvider
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;

}
