// =====================================================
// Session Types
// =====================================================

/**
 * User session entity
 */
export interface Session {
  id: string;
  deviceName: string | null;
  browser: string | null;
  os: string | null;
  ipAddress: string | null;
  lastActiveAt: string;
  createdAt: string;
  isCurrent: boolean;
}

/**
 * Get sessions response
 */
export interface GetSessionsResponse {
  sessions: Session[];
}

/**
 * Revoke all sessions response
 */
export interface RevokeAllSessionsResponse {
  revokedCount: number;
}
