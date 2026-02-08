"use client";

import { useEffect, useState, useCallback } from "react";
import { api, ApiError, AuditLog, AuditAction } from "@/lib/api";
import { Button, Input, Badge, SkeletonTable, ExportCsvButton, Text } from "@/components/ui";
import { Alert } from "@/components/feedback";
import { EmptySearch, EmptyList } from "@/components/shared";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { downloadFile } from "@/lib/export";

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// =====================================================
// Action Badge Component
// =====================================================

const actionVariants: Record<
  AuditAction,
  { variant: "default" | "secondary" | "outline" | "destructive"; label: string }
> = {
  CREATE: { variant: "default", label: "Create" },
  READ: { variant: "outline", label: "Read" },
  UPDATE: { variant: "secondary", label: "Update" },
  DELETE: { variant: "destructive", label: "Delete" },
  LOGIN: { variant: "default", label: "Login" },
  LOGOUT: { variant: "outline", label: "Logout" },
  LOGIN_FAILED: { variant: "destructive", label: "Login Failed" },
  PASSWORD_CHANGE: { variant: "secondary", label: "Password Change" },
  PASSWORD_RESET: { variant: "secondary", label: "Password Reset" },
  EMAIL_VERIFY: { variant: "default", label: "Email Verify" },
  ADMIN_ACTION: { variant: "default", label: "Admin Action" },
};

function ActionBadge({ action }: { action: AuditAction }) {
  const config = actionVariants[action] || { variant: "outline", label: action };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

// =====================================================
// Expanded Row Details
// =====================================================

function LogDetails({ log }: { log: AuditLog }) {
  return (
    <tr className="bg-muted/30">
      <td colSpan={6} className="px-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {/* User Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon name="User" size="sm" />
              <Text as="span" className="font-medium">User Information</Text>
            </div>
            <div className="pl-6 space-y-1">
              <Text as="p" size="sm">
                <Text as="span" color="muted">ID:</Text>{" "}
                {log.userId || "N/A"}
              </Text>
              {log.user && (
                <>
                  <Text as="p" size="sm">
                    <Text as="span" color="muted">Email:</Text>{" "}
                    {log.user.email}
                  </Text>
                  <Text as="p" size="sm">
                    <Text as="span" color="muted">Name:</Text>{" "}
                    {log.user.name || "N/A"}
                  </Text>
                </>
              )}
            </div>
          </div>

          {/* Request Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon name="Globe" size="sm" />
              <Text as="span" className="font-medium">Request Information</Text>
            </div>
            <div className="pl-6 space-y-1">
              <Text as="p" size="sm">
                <Text as="span" color="muted">IP Address:</Text>{" "}
                {log.ipAddress || "N/A"}
              </Text>
              <Text as="p" size="sm" className="break-all">
                <Text as="span" color="muted">User Agent:</Text>{" "}
                {log.userAgent || "N/A"}
              </Text>
            </div>
          </div>

          {/* Changes */}
          {log.changes && Object.keys(log.changes).length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icon name="Monitor" size="sm" />
                <Text as="span" className="font-medium">Changes</Text>
              </div>
              <div className="pl-6">
                <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto max-h-32">
                  {JSON.stringify(log.changes, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Metadata */}
          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icon name="Calendar" size="sm" />
                <Text as="span" className="font-medium">Metadata</Text>
              </div>
              <div className="pl-6">
                <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto max-h-32">
                  {JSON.stringify(log.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

// =====================================================
// Log Row Component
// =====================================================

function LogRow({
  log,
  isExpanded,
  onToggle,
}: {
  log: AuditLog;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        className={cn(
          "border-b hover:bg-muted/50 cursor-pointer",
          isExpanded && "bg-muted/30"
        )}
        onClick={onToggle}
      >
        <td className="px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
          >
            {isExpanded ? (
              <Icon name="ChevronUp" size="sm" />
            ) : (
              <Icon name="ChevronDown" size="sm" />
            )}
          </Button>
        </td>
        <td className="px-4 py-3">
          <Text variant="caption" color="muted">
            {new Date(log.createdAt).toLocaleDateString()}{" "}
            {new Date(log.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </td>
        <td className="px-4 py-3">
          <ActionBadge action={log.action} />
        </td>
        <td className="px-4 py-3">
          <div>
            <Text as="p" className="font-medium">{log.entity}</Text>
            {log.entityId && (
              <Text variant="caption" color="muted" size="xs" className="truncate max-w-[200px]">
                {log.entityId}
              </Text>
            )}
          </div>
        </td>
        <td className="px-4 py-3">
          {log.user ? (
            <div>
              <Text as="p" className="font-medium">{log.user.name || "No name"}</Text>
              <Text variant="caption" color="muted">{log.user.email}</Text>
            </div>
          ) : (
            <Text color="muted">System / Anonymous</Text>
          )}
        </td>
        <td className="px-4 py-3">
          <Text variant="caption" color="muted">
            {log.ipAddress || "N/A"}
          </Text>
        </td>
      </tr>
      {isExpanded && <LogDetails log={log} />}
    </>
  );
}

// =====================================================
// Pagination Component
// =====================================================

function Pagination({
  pagination,
  onPageChange,
}: {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
}) {
  const pages = Array.from({ length: pagination.totalPages }, (_, i) => i + 1);
  const visiblePages = pages.filter(
    (p) =>
      p === 1 ||
      p === pagination.totalPages ||
      Math.abs(p - pagination.page) <= 1
  );

  return (
    <div className="flex items-center justify-between px-2">
      <Text variant="caption" color="muted">
        Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
        {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
        {pagination.total} logs
      </Text>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.page - 1)}
          disabled={!pagination.hasPrev}
        >
          Previous
        </Button>
        {visiblePages.map((page, index) => {
          const prevPage = visiblePages[index - 1];
          const showEllipsis = prevPage && page - prevPage > 1;

          return (
            <div key={page} className="flex items-center">
              {showEllipsis && (
                <span className="px-2 text-muted-foreground">...</span>
              )}
              <Button
                variant={page === pagination.page ? "default" : "ghost"}
                size="sm"
                onClick={() => onPageChange(page)}
                className="w-9"
              >
                {page}
              </Button>
            </div>
          );
        })}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={!pagination.hasNext}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

// =====================================================
// Main Admin Audit Logs Page
// =====================================================

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Filters
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [actionFilter, setActionFilter] = useState<"" | AuditAction>("");
  const [entityFilter, setEntityFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Filter options
  const [actionTypes, setActionTypes] = useState<AuditAction[]>([]);
  const [entityTypes, setEntityTypes] = useState<string[]>([]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [actionsRes, entitiesRes] = await Promise.all([
          api.getAuditLogActionTypes(),
          api.getAuditLogEntityTypes(),
        ]);
        if (actionsRes.data) {
          setActionTypes(actionsRes.data.actionTypes);
        }
        if (entitiesRes.data) {
          setEntityTypes(entitiesRes.data.entityTypes);
        }
      } catch {
        // Silently fail - filters will just be empty
      }
    };
    fetchFilterOptions();
  }, []);

  const fetchLogs = useCallback(
    async (page = 1) => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await api.getAuditLogs({
          page,
          limit: 20,
          search: searchDebounced || undefined,
          action: actionFilter || undefined,
          entity: entityFilter || undefined,
          startDate: startDate ? new Date(startDate).toISOString() : undefined,
          endDate: endDate ? new Date(endDate).toISOString() : undefined,
        });

        if (response.data) {
          setLogs(response.data.items);
          setPagination(response.data.pagination);
        }
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Failed to load audit logs");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [searchDebounced, actionFilter, entityFilter, startDate, endDate]
  );

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handlePageChange = (page: number) => {
    fetchLogs(page);
  };

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const clearFilters = () => {
    setSearch("");
    setSearchDebounced("");
    setActionFilter("");
    setEntityFilter("");
    setStartDate("");
    setEndDate("");
  };

  const hasActiveFilters =
    searchDebounced || actionFilter || entityFilter || startDate || endDate;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <Text color="muted">
            View all system activity and user actions
          </Text>
        </div>
        <ExportCsvButton
          label="Export Logs"
          onExport={async () => {
            await downloadFile(
              api.getAdminAuditLogsExportUrl({
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                action: actionFilter || undefined,
              })
            );
          }}
          onSuccess={() => toast.success("Audit logs exported successfully")}
          onError={(error) => toast.error(error.message || "Export failed")}
        />
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              type="search"
              placeholder="Search by entity, IP, or user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value as "" | AuditAction)}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="">All Actions</option>
            {actionTypes.map((action) => (
              <option key={action} value={action}>
                {actionVariants[action]?.label || action}
              </option>
            ))}
          </select>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="">All Entities</option>
            {entityTypes.map((entity) => (
              <option key={entity} value={entity}>
                {entity}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">From:</label>
            <Input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-auto"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">To:</label>
            <Input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-auto"
            />
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && <Alert variant="destructive">{error}</Alert>}

      {/* Logs Table */}
      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="p-6">
            <SkeletonTable rows={10} columns={6} />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-6">
            {hasActiveFilters ? (
              <EmptySearch
                searchQuery={searchDebounced}
                action={{
                  label: "Clear filters",
                  onClick: clearFilters,
                  variant: "outline",
                }}
              />
            ) : (
              <EmptyList
                title="No audit logs"
                description="System activity will be recorded here as users interact with the application."
              />
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium w-10">
                    {/* Expand toggle */}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Timestamp
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Entity
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    IP Address
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <LogRow
                    key={log.id}
                    log={log}
                    isExpanded={expandedRows.has(log.id)}
                    onToggle={() => toggleRow(log.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="border-t p-4">
            <Pagination
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}
