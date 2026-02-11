"use client";

import { useState, useEffect } from "react";
import { api, AuditLog, AuditAction } from "@/lib/api";
import { Button, Input, Badge, Text, Select } from "@/components/ui";
import { Alert } from "@/components/feedback";
import { FeatureGate } from "@/components";
import { Icon } from "@/components/ui/icon";
import { AdminPageHeader, AdminTableContainer } from "@/components/admin";
import { useAdminList } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { downloadFile } from "@/lib/export";

// =====================================================
// Types
// =====================================================

interface AuditFilters {
  action: "" | AuditAction;
  entity: string;
  startDate: string;
  endDate: string;
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
                <Text as="span" color="muted">ID:</Text> {log.userId || "N/A"}
              </Text>
              {log.user && (
                <>
                  <Text as="p" size="sm">
                    <Text as="span" color="muted">Email:</Text> {log.user.email}
                  </Text>
                  <Text as="p" size="sm">
                    <Text as="span" color="muted">Name:</Text> {log.user.name || "N/A"}
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
                <Text as="span" color="muted">IP Address:</Text> {log.ipAddress || "N/A"}
              </Text>
              <Text as="p" size="sm" className="break-all">
                <Text as="span" color="muted">User Agent:</Text> {log.userAgent || "N/A"}
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
            {log.createdAt ? (
              <>
                {new Date(log.createdAt).toLocaleDateString()}{" "}
                {new Date(log.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </>
            ) : (
              "-"
            )}
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
// Main Admin Audit Logs Page
// =====================================================

export default function AdminAuditLogsPage() {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [actionTypes, setActionTypes] = useState<AuditAction[]>([]);
  const [entityTypes, setEntityTypes] = useState<string[]>([]);

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

  // Use shared admin list hook
  const {
    items: logs,
    pagination,
    isLoading,
    error,
    search,
    setSearch,
    searchDebounced,
    filters,
    setFilter,
    handlePageChange,
    clearFilters,
    hasActiveFilters,
    isEmpty,
  } = useAdminList<AuditLog, AuditFilters>({
    fetchFn: async ({ page, limit: _limit, search, filters }) => {
      const response = await api.getAuditLogs({
        page,
        limit: 20,
        search: search || undefined,
        action: filters.action || undefined,
        entity: filters.entity || undefined,
        startDate: filters.startDate ? new Date(filters.startDate).toISOString() : undefined,
        endDate: filters.endDate ? new Date(filters.endDate).toISOString() : undefined,
      });

      if (!response.data) {
        throw new Error("Failed to load audit logs");
      }

      return {
        items: response.data.items,
        pagination: response.data.pagination,
      };
    },
    initialFilters: { action: "", entity: "", startDate: "", endDate: "" },
    limit: 20,
  });

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

  const actionFilterOptions = [
    { value: "", label: "All Actions" },
    ...actionTypes.map((action) => ({
      value: action,
      label: actionVariants[action]?.label || action,
    })),
  ];

  const entityFilterOptions = [
    { value: "", label: "All Entities" },
    ...entityTypes.map((entity) => ({
      value: entity,
      label: entity,
    })),
  ];

  return (
    <FeatureGate
      feature="security.audit"
      fallback={
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
            <Text color="muted">Audit logging is not available in this configuration.</Text>
          </div>
          <Alert variant="warning">
            The audit logging feature is not enabled. Enable the &quot;Audit Logging&quot; feature to track system activity.
          </Alert>
        </div>
      }
    >
    <div className="space-y-4">
      {/* Header */}
      <AdminPageHeader
        title="Audit Logs"
        description="View all system activity and user actions"
        exportConfig={{
          label: "Export Logs",
          onExport: async () => {
            await downloadFile(
              api.getAdminAuditLogsExportUrl({
                startDate: filters.startDate || undefined,
                endDate: filters.endDate || undefined,
                action: filters.action || undefined,
              })
            );
          },
          successMessage: "Audit logs exported successfully",
        }}
      />

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
          <Select
            options={actionFilterOptions}
            value={filters.action}
            onChange={(value) => setFilter("action", value as "" | AuditAction)}
            className="w-40"
          />
          <Select
            options={entityFilterOptions}
            value={filters.entity}
            onChange={(value) => setFilter("entity", value)}
            className="w-40"
          />
        </div>

        {/* Date Range Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">From:</label>
            <Input
              type="datetime-local"
              value={filters.startDate}
              onChange={(e) => setFilter("startDate", e.target.value)}
              className="w-auto"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">To:</label>
            <Input
              type="datetime-local"
              value={filters.endDate}
              onChange={(e) => setFilter("endDate", e.target.value)}
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
      <AdminTableContainer
        isLoading={isLoading}
        isEmpty={isEmpty}
        hasActiveFilters={hasActiveFilters}
        searchQuery={searchDebounced}
        onClearFilters={clearFilters}
        emptyState={{
          title: "No audit logs",
          description: "System activity will be recorded here as users interact with the application.",
        }}
        pagination={pagination}
        onPageChange={handlePageChange}
        itemLabel="logs"
        skeletonRows={10}
        skeletonColumns={6}
      >
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium w-10">
                {/* Expand toggle */}
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">Timestamp</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Action</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Entity</th>
              <th className="px-4 py-3 text-left text-sm font-medium">User</th>
              <th className="px-4 py-3 text-left text-sm font-medium">IP Address</th>
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
      </AdminTableContainer>
    </div>
    </FeatureGate>
  );
}

