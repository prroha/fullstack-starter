// =====================================================
// User Types
// =====================================================

// Import UserRole from the single source of truth (OpenAPI generated types)
import type { UserRole } from "@/types/api";

// Re-export for convenience
export type { UserRole };

// Note: User and AdminUser types are defined in api.ts (from OpenAPI spec)
// Only define additional types here that aren't in the OpenAPI spec

/**
 * User profile type (extended with additional fields)
 */
export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Avatar data type
 */
export interface Avatar {
  url: string | null;
  initials: string;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Registration data
 */
export interface RegisterData {
  email: string;
  password: string;
  name?: string;
}

/**
 * Password change data
 */
export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Password reset data
 */
export interface ResetPasswordData {
  token: string;
  password: string;
  confirmPassword: string;
}

/**
 * Profile update data
 */
export interface UpdateProfileData {
  name?: string;
  email?: string;
}

/**
 * Admin user update data
 */
export interface UpdateAdminUserData {
  role?: UserRole;
  isActive?: boolean;
  name?: string;
}
