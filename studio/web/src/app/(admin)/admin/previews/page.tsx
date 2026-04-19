"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Trash2,
  Database,
  CheckCircle,
  Clock,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import { showSuccess, showError, showLoading, dismissToast } from "@/lib/toast";

// Shared UI components
import {
  Button,
  StatCard,
  SearchInput,
  Select,
  StatusBadge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  EmptyState,
} from "@/components/ui";
import { Alert } from "@/components/feedback/alert";
import { AdminPageHeader, AdminTableSkeleton } from "@/components/admin";
import { API_CONFIG } from "@/lib/constants";

// =====================================================
// Types
// =====================================================

type SchemaStatus = "PENDING" | "PROVISIONING" | "READY" | "FAILED" | "DROPPED";

interface PreviewSession {
  id: string;
  sessionToken: string;
  tier: string;
  selectedFeatures: string[];
  schemaStatus: SchemaStatus;
  schemaName: string | null;
  lastAccessedAt: string | null;
  expiresAt: string;
  createdAt: string;
}

interface PreviewStats {
  total: number;
  byStatus: Record<SchemaStatus, number>;
  active: number;
  expired: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// =====================================================
// Helpers
// =====================================================

function timeAgo(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function isExpired(date: string): boolean {
  return new Date(date) <= new Date();
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "PROVISIONING", label: "Provisioning" },
  { value: "READY", label: "Ready" },
  { value: "FAILED", label: "Failed" },
  { value: "DROPPED", label: "Dropped" },
];

const schemaStatusMap: Record<SchemaStatus, { status: "pending" | "warning" | "success" | "error" | "inactive"; label: string }> = {
  PENDING: { status: "pending", label: "Pending" },
  PROVISIONING: { status: "warning", label: "Provisioning" },
  READY: { status: "success", label: "Ready" },
  FAILED: { status: "error", label: "Failed" },
  DROPPED: { status: "inactive", label: "Dropped" },
};

// =====================================================
// Main Page Component
// =====================================================

export default function PreviewsPage() {
  const [sessions, setSessions] = useState<PreviewSession[]>([]);
  const [stats, setStats] = useState<PreviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purging, setPurging] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [filters, setFilters] = useState({
    search: "",
    status: "",
  });

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
      });
      if (filters.status) params.set("status", filters.status);
      if (filters.search) params.set("search", filters.search);

      const res = await fetch(
        `${API_CONFIG.BASE_URL}/admin/previews?${params.toString()}`,
        { credentials: "include" }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Failed to fetch preview sessions");
      }

      const { data } = await res.json();
      setSessions(data.items);
      setPagination(data.pagination);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch preview sessions";
      setError(message);
      showError("Failed to load preview sessions", message);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/admin/previews/stats`, {
        credentials: "include",
      });
      if (!res.ok) return;
      const { data } = await res.json();
      setStats(data);
    } catch {
      // Stats are non-critical, silently ignore
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchSessions();
    fetchStats();
  }, [fetchSessions, fetchStats]);

  // Handle filter change
  const handleFilterChange = (key: "search" | "status", value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Delete session
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const loadingId = showLoading("Deleting preview session...");
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/admin/previews/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Failed to delete session");
      }

      dismissToast(loadingId);
      showSuccess("Preview session deleted");
      setSessions((prev) => prev.filter((s) => s.id !== id));
      fetchStats();
    } catch (err) {
      dismissToast(loadingId);
      showError(
        "Failed to delete session",
        err instanceof Error ? err.message : undefined
      );
    } finally {
      setDeletingId(null);
    }
  };

  // Purge expired
  const handlePurge = async () => {
    setPurging(true);
    const loadingId = showLoading("Purging expired sessions...");
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/admin/previews/purge`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Failed to purge sessions");
      }

      const { data } = await res.json();
      dismissToast(loadingId);
      showSuccess(`Purged ${data.purged} expired session${data.purged === 1 ? "" : "s"}`);
      fetchSessions();
      fetchStats();
    } catch (err) {
      dismissToast(loadingId);
      showError(
        "Failed to purge sessions",
        err instanceof Error ? err.message : undefined
      );
    } finally {
      setPurging(false);
    }
  };

  // Loading skeleton
  if (loading && sessions.length === 0) {
    return (
      <AdminTableSkeleton
        columns={7}
        rows={5}
        statsCount={4}
        filterCount={2}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <AdminPageHeader
        title="Preview Sessions"
        description="Manage live preview sessions and their provisioned schemas"
        actions={
          <Button
            onClick={handlePurge}
            variant="outline"
            isLoading={purging}
            disabled={purging}
          >
            <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
            Purge Expired
          </Button>
        }
      />

      {/* Stats */}
      {stats && (
        <section aria-label="Preview statistics" aria-live="polite">
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              label="Total Sessions"
              value={formatNumber(stats.total)}
              icon={<Database className="h-5 w-5" aria-hidden="true" />}
              trendLabel={`${stats.expired} expired`}
            />
            <StatCard
              label="Active (Ready)"
              value={formatNumber(stats.byStatus.READY)}
              icon={<CheckCircle className="h-5 w-5" aria-hidden="true" />}
              trendLabel={`${stats.active} not expired`}
            />
            <StatCard
              label="Provisioning"
              value={formatNumber(stats.byStatus.PROVISIONING + stats.byStatus.PENDING)}
              icon={<Clock className="h-5 w-5" aria-hidden="true" />}
              trendLabel={`${stats.byStatus.PENDING} pending`}
            />
            <StatCard
              label="Failed"
              value={formatNumber(stats.byStatus.FAILED)}
              icon={<XCircle className="h-5 w-5" aria-hidden="true" />}
              trendLabel={`${stats.byStatus.DROPPED} dropped`}
            />
          </div>
        </section>
      )}

      {/* Filter Bar */}
      <div
        className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4"
        role="search"
        aria-label="Filter preview sessions"
      >
        <div className="w-full sm:flex-1 sm:min-w-[240px]">
          <SearchInput
            placeholder="Search by token or tier..."
            onSearch={(v) => handleFilterChange("search", v)}
            debounceDelay={300}
          />
        </div>
        <div className="w-full sm:w-auto sm:min-w-[160px]">
          <Select
            id="status-filter"
            value={filters.status}
            onChange={(v) => handleFilterChange("status", v)}
            options={STATUS_OPTIONS}
            aria-label="Filter by status"
          />
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" title="Failed to load preview sessions">
          {error}
        </Alert>
      )}

      {/* Data Table */}
      <div className="bg-background rounded-lg border">
        <Table className="min-w-[800px]">
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="px-4 py-3">Token</TableHead>
              <TableHead className="px-4 py-3">Tier</TableHead>
              <TableHead className="px-4 py-3 hidden md:table-cell">Features</TableHead>
              <TableHead className="px-4 py-3">Schema Status</TableHead>
              <TableHead className="px-4 py-3 hidden sm:table-cell">Last Accessed</TableHead>
              <TableHead className="px-4 py-3 hidden sm:table-cell">Expires</TableHead>
              <TableHead className="px-4 py-3 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y">
            {sessions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  <EmptyState
                    title="No preview sessions found"
                    description={
                      filters.search || filters.status
                        ? "Try adjusting your filters"
                        : "Preview sessions will appear here when users start live previews"
                    }
                    variant={filters.search || filters.status ? "noResults" : "noData"}
                  />
                </TableCell>
              </TableRow>
            ) : (
              sessions.map((session) => {
                const expired = isExpired(session.expiresAt);
                return (
                  <TableRow key={session.id}>
                    <TableCell className="px-4 py-3">
                      <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                        {session.sessionToken.slice(0, 12)}...
                      </code>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm font-medium capitalize">
                      {session.tier}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                      {session.selectedFeatures?.length ?? 0}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <StatusBadge
                        status={schemaStatusMap[session.schemaStatus].status}
                        label={schemaStatusMap[session.schemaStatus].label}
                      />
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">
                      {session.lastAccessedAt
                        ? timeAgo(session.lastAccessedAt)
                        : "Never"}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "px-4 py-3 text-sm hidden sm:table-cell",
                        expired
                          ? "text-destructive font-medium"
                          : "text-muted-foreground"
                      )}
                    >
                      {expired ? "Expired" : timeAgo(session.expiresAt)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(session.id)}
                        disabled={deletingId === session.id}
                        isLoading={deletingId === session.id}
                        aria-label={`Delete session ${session.sessionToken.slice(0, 8)}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {sessions.length > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-t">
            <div className="text-sm text-muted-foreground text-center sm:text-left">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
              {pagination.total} sessions
            </div>
            <nav
              className="flex items-center justify-center sm:justify-end gap-2"
              aria-label="Pagination"
            >
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                }
                disabled={pagination.page === 1}
                aria-label="Go to previous page"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </Button>
              <span className="text-sm" aria-current="page">
                Page {pagination.page} of {pagination.totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                }
                disabled={pagination.page >= pagination.totalPages}
                aria-label="Go to next page"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}
