// =====================================================
// Shared Types
// =====================================================
// Re-export all types from this index file.
// Import from @/types to use these types.
//
// Note: api.ts is the single source of truth for types generated
// from OpenAPI spec. Other files may extend these types.
// =====================================================

// API Types - Single source of truth from OpenAPI
export * from "./api";

// Extended user types (re-exports UserRole from api.ts)
export type {
  // User and AdminUser come from api.ts, not user.ts
  LoginCredentials,
  RegisterData,
  ChangePasswordData,
  ResetPasswordData,
  UpdateProfileData,
  UpdateAdminUserData,
  Avatar,
  UserProfile,
} from "./user";

// Notification types (NotificationType and Notification come from api.ts)
export type {
  GetNotificationsParams,
  UnreadCountResponse,
  MarkAllReadResponse,
  DeleteAllNotificationsResponse,
} from "./notification";

// Audit types (AuditAction and AuditLog come from api.ts)
export type { GetAuditLogsParams } from "./audit";

// Contact types (ContactMessage and ContactMessageStatus come from api.ts)
export type { ContactFormData, GetContactMessagesParams } from "./contact";

// Session types (Session comes from api.ts)
export type { GetSessionsResponse, RevokeAllSessionsResponse } from "./session";
