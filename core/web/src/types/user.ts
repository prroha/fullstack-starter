// =====================================================
// User Types
// =====================================================

import { USER_ROLES } from "@/lib/constants";

/**
 * User role enum values
 */
export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

/**
 * Base user type for authenticated users
 */
export interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  emailVerified?: boolean;
}

/**
 * Extended user type for admin views
 */
export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * User profile type
 */
export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: string;
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
