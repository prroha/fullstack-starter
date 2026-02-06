"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, User, UserRole, ApiError } from "./api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  userRole: UserRole | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider - Manages authentication state using httpOnly cookies
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAuth = useCallback(async () => {
    if (typeof window === "undefined") return;

    try {
      await api.refresh();
      const meResponse = await api.getMe();
      if (meResponse.data) {
        setUser(meResponse.data.user);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    const response = await api.login(email, password);
    if (!response.data) {
      throw new Error("Login failed: No data received");
    }
    setUser(response.data.user);
    return response.data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // Ignore logout errors
    } finally {
      setUser(null);
    }
  }, []);

  // Initial auth check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.getMe();
        if (response.data) {
          setUser(response.data.user);
        }
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          await refreshAuth();
        } else {
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [refreshAuth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: user?.role === "ADMIN",
        userRole: user?.role ?? null,
        login,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
