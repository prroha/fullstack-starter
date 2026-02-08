"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import { logger } from "@/lib/logger";
import { toast } from "@/lib/toast";
import { Button, Spinner } from "@/components/ui";

// =====================================================
// Types
// =====================================================

interface Session {
  id: string;
  deviceName: string | null;
  browser: string | null;
  os: string | null;
  ipAddress: string | null;
  lastActiveAt: string;
  createdAt: string;
  isCurrent: boolean;
}

// =====================================================
// Icon Components
// =====================================================

function MonitorIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <line x1="8" x2="16" y1="21" y2="21" />
      <line x1="12" x2="12" y1="17" y2="21" />
    </svg>
  );
}

function SmartphoneIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
      <path d="M12 18h.01" />
    </svg>
  );
}

function TabletIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
      <line x1="12" x2="12.01" y1="18" y2="18" />
    </svg>
  );
}

function GlobeIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );
}

function ArrowLeftIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}

// =====================================================
// Helper Functions
// =====================================================

function getDeviceIcon(session: Session) {
  const deviceName = session.deviceName?.toLowerCase() || "";
  const os = session.os?.toLowerCase() || "";

  if (deviceName.includes("iphone") || deviceName.includes("android phone")) {
    return <SmartphoneIcon size={24} />;
  }
  if (deviceName.includes("ipad") || deviceName.includes("tablet")) {
    return <TabletIcon size={24} />;
  }
  if (deviceName.includes("desktop") || os.includes("windows") || os.includes("macos") || os.includes("linux")) {
    return <MonitorIcon size={24} />;
  }
  return <GlobeIcon size={24} />;
}

function getDeviceDisplayName(session: Session): string {
  if (session.deviceName) {
    return session.deviceName;
  }
  if (session.browser && session.os) {
    return `${session.browser} on ${session.os}`;
  }
  if (session.browser) {
    return session.browser;
  }
  if (session.os) {
    return session.os;
  }
  return "Unknown Device";
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return "Just now";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  }
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }
  if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  }
  return date.toLocaleDateString();
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// =====================================================
// Session Card Component
// =====================================================

interface SessionCardProps {
  session: Session;
  onRevoke: (sessionId: string) => void;
  isRevoking: boolean;
}

function SessionCard({ session, onRevoke, isRevoking }: SessionCardProps) {
  return (
    <div
      className={`p-4 rounded-lg border ${
        session.isCurrent
          ? "border-primary/50 bg-primary/5"
          : "border-border bg-card"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center ${
            session.isCurrent
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {getDeviceIcon(session)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-foreground truncate">
              {getDeviceDisplayName(session)}
            </h3>
            {session.isCurrent && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                Current
              </span>
            )}
          </div>
          <div className="mt-1 space-y-0.5 text-sm text-muted-foreground">
            {session.ipAddress && (
              <p>IP: {session.ipAddress}</p>
            )}
            <p>Last active: {formatRelativeTime(session.lastActiveAt)}</p>
            <p className="text-xs">Created: {formatDate(session.createdAt)}</p>
          </div>
        </div>
        {!session.isCurrent && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRevoke(session.id)}
            disabled={isRevoking}
          >
            {isRevoking ? <Spinner size="sm" /> : "Revoke"}
          </Button>
        )}
      </div>
    </div>
  );
}

// =====================================================
// Main Component
// =====================================================

export default function SessionsPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [isRevokingAll, setIsRevokingAll] = useState(false);

  const fetchSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.getSessions();
      if (response.success && response.data) {
        setSessions(response.data.sessions);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        logger.error("Sessions", "Failed to fetch sessions", err);
        setError(err.message);
      } else {
        logger.error("Sessions", "Unexpected error fetching sessions", err);
        setError("Failed to load sessions. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthLoading && user) {
      fetchSessions();
    }
  }, [isAuthLoading, user, fetchSessions]);

  // Redirect if not authenticated
  if (!isAuthLoading && !user) {
    router.push("/login");
    return null;
  }

  const handleRevokeSession = async (sessionId: string) => {
    try {
      setRevokingSessionId(sessionId);
      await api.revokeSession(sessionId);
      toast.success("Session revoked", {
        description: "The session has been signed out.",
      });
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err) {
      if (err instanceof ApiError) {
        logger.error("Sessions", "Failed to revoke session", err);
        toast.error("Failed to revoke session", {
          description: err.message,
        });
      } else {
        logger.error("Sessions", "Unexpected error revoking session", err);
        toast.error("Failed to revoke session", {
          description: "An unexpected error occurred.",
        });
      }
    } finally {
      setRevokingSessionId(null);
    }
  };

  const handleRevokeAllOther = async () => {
    try {
      setIsRevokingAll(true);
      const response = await api.revokeAllOtherSessions();
      const count = response.data?.revokedCount || 0;
      toast.success("Sessions revoked", {
        description: `${count} session${count === 1 ? "" : "s"} signed out.`,
      });
      setSessions((prev) => prev.filter((s) => s.isCurrent));
    } catch (err) {
      if (err instanceof ApiError) {
        logger.error("Sessions", "Failed to revoke all sessions", err);
        toast.error("Failed to revoke sessions", {
          description: err.message,
        });
      } else {
        logger.error("Sessions", "Unexpected error revoking all sessions", err);
        toast.error("Failed to revoke sessions", {
          description: "An unexpected error occurred.",
        });
      }
    } finally {
      setIsRevokingAll(false);
    }
  };

  const otherSessionsCount = sessions.filter((s) => !s.isCurrent).length;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/settings"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground "
      >
        <ArrowLeftIcon size={16} />
        Back to Settings
      </Link>

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Active Sessions</h1>
        <p className="text-muted-foreground mt-1">
          Manage your logged-in devices
        </p>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Spinner size="lg" />
          <p className="mt-4 text-muted-foreground">Loading sessions...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-lg border border-destructive/50 bg-destructive/10">
          <p className="text-destructive">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={fetchSessions}
          >
            Try Again
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Sign out all other devices button */}
          {otherSessionsCount > 0 && (
            <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
              <div>
                <h2 className="font-medium text-foreground">
                  Sign out other devices
                </h2>
                <p className="text-sm text-muted-foreground">
                  {otherSessionsCount} other active session{otherSessionsCount === 1 ? "" : "s"}
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={handleRevokeAllOther}
                isLoading={isRevokingAll}
              >
                Sign Out All
              </Button>
            </div>
          )}

          {/* Session list */}
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Your Sessions
            </h2>
            {sessions.length === 0 ? (
              <div className="p-8 text-center rounded-lg border bg-card">
                <p className="text-muted-foreground">No active sessions found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onRevoke={handleRevokeSession}
                    isRevoking={revokingSessionId === session.id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
