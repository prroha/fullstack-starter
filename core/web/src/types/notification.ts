// =====================================================
// Notification Types
// =====================================================

import { NOTIFICATION_TYPES } from "@/lib/constants";

/**
 * Notification type enum values
 */
export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

/**
 * Notification entity
 */
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

/**
 * Notification query parameters
 */
export interface GetNotificationsParams {
  page?: number;
  limit?: number;
  read?: boolean;
  type?: NotificationType;
}

/**
 * Unread count response
 */
export interface UnreadCountResponse {
  count: number;
}

/**
 * Mark all as read response
 */
export interface MarkAllReadResponse {
  count: number;
}

/**
 * Delete all notifications response
 */
export interface DeleteAllNotificationsResponse {
  count: number;
}
