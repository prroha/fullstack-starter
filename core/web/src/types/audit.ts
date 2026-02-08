// =====================================================
// Audit Log Types
// =====================================================

import { AUDIT_ACTIONS } from "@/lib/constants";

/**
 * Audit action enum values
 */
export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

/**
 * Audit log entity
 */
export interface AuditLog {
  id: string;
  userId: string | null;
  action: AuditAction;
  entity: string;
  entityId: string | null;
  changes: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  } | null;
}

/**
 * Audit log query parameters
 */
export interface GetAuditLogsParams {
  page?: number;
  limit?: number;
  userId?: string;
  action?: AuditAction;
  entity?: string;
  entityId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

/**
 * Entity types response
 */
export interface EntityTypesResponse {
  entityTypes: string[];
}

/**
 * Action types response
 */
export interface ActionTypesResponse {
  actionTypes: AuditAction[];
}
