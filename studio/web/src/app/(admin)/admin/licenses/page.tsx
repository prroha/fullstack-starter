"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Key,
  Check,
  MoreHorizontal,
  Calendar,
  RefreshCw,
  Ban,
  ExternalLink,
  Eye,
  EyeOff,
  Download,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn, formatNumber, formatDate, formatDateTime } from "@/lib/utils";
import { API_CONFIG } from "@/lib/constants";
import { showSuccess, showError, showLoading, dismissToast } from "@/lib/toast";
import { Button, Modal, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, StatCard, CopyButton } from "@/components/ui";
import { EmptyList } from "@/components/ui";
import { EmptyState } from "@core/components/shared";
import { AdminPageHeader, AdminFilters, LicenseStatusBadge, AdminTableSkeleton } from "@/components/admin";

// Types
type LicenseStatus = "ACTIVE" | "EXPIRED" | "REVOKED";

interface License {
  id: string;
  licenseKey: string;
  downloadToken: string;
  status: LicenseStatus;
  downloadCount: number;
  maxDownloads: number;
  expiresAt: string | null;
  createdAt: string;
  revokedAt?: string | null;
  revokedReason?: string | null;
  order: {
    orderNumber: string;
    customerEmail: string;
    customerName: string | null;
    tier: string;
    template?: { name: string } | null;
  };
}

interface LicenseWithDetails extends License {
  downloadHistory?: DownloadRecord[];
}

interface DownloadRecord {
  id: string;
  downloadedAt: string;
  ipAddress: string;
  userAgent: string;
}

interface LicenseStats {
  total: number;
  active: number;
  expired: number;
  revoked: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Extend License Modal
function ExtendLicenseModal({
  license,
  open,
  onClose,
  onExtend,
}: {
  license: License | null;
  open: boolean;
  onClose: () => void;
  onExtend: (licenseId: string, days: number) => Promise<void>;
}) {
  const [days, setDays] = useState(365);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (license) {
      setDays(365);
    }
  }, [license]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!license) return;

    setLoading(true);
    try {
      await onExtend(license.id, days);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!license) return null;

  const currentExpiry = license.expiresAt ? new Date(license.expiresAt) : new Date();
  const newExpiry = new Date(currentExpiry.getTime() + days * 24 * 60 * 60 * 1000);

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Extend License"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || days <= 0}
            onClick={handleSubmit}
          >
            {loading ? "Extending..." : "Extend License"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">License Key</label>
          <p className="text-sm text-muted-foreground font-mono">{license.licenseKey}</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Current Expiration</label>
          <p className="text-sm text-muted-foreground">
            {license.expiresAt ? formatDateTime(license.expiresAt) : "No expiration set"}
          </p>
        </div>

        <div>
          <label htmlFor="days" className="block text-sm font-medium mb-1">
            Extend by (days) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="days"
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value) || 0)}
            min={1}
            max={365}
            required
            className="w-full px-3 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-xs text-muted-foreground mt-1">
            New expiration: {formatDateTime(newExpiry.toISOString())}
          </p>
        </div>
      </form>
    </Modal>
  );
}

// Revoke License Modal
function RevokeLicenseModal({
  license,
  open,
  onClose,
  onRevoke,
}: {
  license: License | null;
  open: boolean;
  onClose: () => void;
  onRevoke: (licenseId: string, reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!license) return;

    setLoading(true);
    try {
      await onRevoke(license.id, reason);
      setReason("");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!license) return null;

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Revoke License"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || !reason.trim()}
            onClick={handleSubmit}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {loading ? "Revoking..." : "Revoke License"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20">
          <div className="flex gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-600">Warning</p>
              <p className="text-sm text-red-600/80">
                This action will immediately revoke the license and prevent further downloads.
                This cannot be undone.
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">License Key</label>
          <p className="text-sm text-muted-foreground font-mono">{license.licenseKey}</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Customer</label>
          <p className="text-sm text-muted-foreground">{license.order.customerEmail}</p>
        </div>

        <div>
          <label htmlFor="revokeReason" className="block text-sm font-medium mb-1">
            Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            id="revokeReason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Refund requested, policy violation, fraud..."
            rows={3}
            required
            className="w-full px-3 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>
      </form>
    </Modal>
  );
}

// Regenerate Token Modal
function RegenerateTokenModal({
  license,
  open,
  onClose,
  onRegenerate,
}: {
  license: License | null;
  open: boolean;
  onClose: () => void;
  onRegenerate: (licenseId: string) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!license) return;

    setLoading(true);
    try {
      await onRegenerate(license.id);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!license) return null;

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Regenerate Download Token"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Regenerating..." : "Regenerate Token"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/20">
          <div className="flex gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-600">Important</p>
              <p className="text-sm text-amber-600/80">
                Regenerating the token will invalidate the current download link.
                The customer will need to use the new link for future downloads.
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">License Key</label>
          <p className="text-sm text-muted-foreground font-mono">{license.licenseKey}</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Customer</label>
          <p className="text-sm text-muted-foreground">{license.order.customerEmail}</p>
        </div>
      </div>
    </Modal>
  );
}

// License Details Modal
function LicenseDetailsModal({
  license,
  open,
  onClose,
}: {
  license: License | null;
  open: boolean;
  onClose: () => void;
}) {
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    if (!open) setShowToken(false);
  }, [open]);

  if (!license) return null;

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="License Details"
      footer={
        <Button
          variant="outline"
          onClick={onClose}
        >
          Close
        </Button>
      }
    >
      <div className="space-y-6">
        {/* License Info */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">License Key</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 rounded-md bg-muted text-sm font-mono break-all">
                {license.licenseKey}
              </code>
              <CopyButton text={license.licenseKey} size="sm" variant="ghost" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Download Token</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 rounded-md bg-muted text-sm font-mono break-all">
                {showToken ? license.downloadToken : "••••••••••••••••••••••••"}
              </code>
              <button
                onClick={() => setShowToken(!showToken)}
                className="p-1 rounded hover:bg-muted transition-colors"
                title={showToken ? "Hide token" : "Reveal token"}
              >
                {showToken ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              <CopyButton text={license.downloadToken} size="sm" variant="ghost" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Status</label>
              <LicenseStatusBadge status={license.status} />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Downloads</label>
              <p className="text-sm">{license.downloadCount} / {license.maxDownloads}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Created</label>
              <p className="text-sm">{formatDateTime(license.createdAt)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Expires</label>
              <p className="text-sm">{license.expiresAt ? formatDateTime(license.expiresAt) : "Never"}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Order</label>
              <a href={`/admin/orders/${license.id}`} className="text-sm text-primary hover:underline">
                {license.order.orderNumber}
              </a>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Customer</label>
              <p className="text-sm">{license.order.customerEmail}</p>
            </div>
          </div>

          {license.revokedAt && (
            <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20">
              <p className="text-sm font-medium text-red-600">Revoked on {formatDateTime(license.revokedAt)}</p>
              {license.revokedReason && (
                <p className="text-sm text-red-600/80 mt-1">Reason: {license.revokedReason}</p>
              )}
            </div>
          )}
        </div>

        {/* Download History - Note: Download history is not included in API response for this view */}
        <div>
          <h3 className="text-sm font-medium mb-3">Download Count</h3>
          <p className="text-sm text-muted-foreground">
            {license.downloadCount} / {license.maxDownloads} downloads used
          </p>
        </div>
      </div>
    </Modal>
  );
}

// Actions Dropdown
function ActionsDropdown({
  license,
  onExtend,
  onRevoke,
  onRegenerate,
  onViewDetails,
}: {
  license: License;
  onExtend: () => void;
  onRevoke: () => void;
  onRegenerate: () => void;
  onViewDetails: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1 rounded hover:bg-muted transition-colors"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-48 bg-background border rounded-md shadow-lg z-20 py-1">
            <button
              onClick={() => {
                setOpen(false);
                onViewDetails();
              }}
              className="w-full px-3 py-2 text-sm text-left hover:bg-muted flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              View Details
            </button>
            {license.status !== "REVOKED" && (
              <>
                <button
                  onClick={() => {
                    setOpen(false);
                    onExtend();
                  }}
                  className="w-full px-3 py-2 text-sm text-left hover:bg-muted flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  Extend License
                </button>
                <button
                  onClick={() => {
                    setOpen(false);
                    onRegenerate();
                  }}
                  className="w-full px-3 py-2 text-sm text-left hover:bg-muted flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Regenerate Token
                </button>
                <hr className="my-1" />
                <button
                  onClick={() => {
                    setOpen(false);
                    onRevoke();
                  }}
                  className="w-full px-3 py-2 text-sm text-left hover:bg-muted flex items-center gap-2 text-red-600"
                >
                  <Ban className="h-4 w-4" />
                  Revoke License
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Pagination Component
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t">
      <p className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-2 rounded hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum: number;
          if (totalPages <= 5) {
            pageNum = i + 1;
          } else if (currentPage <= 3) {
            pageNum = i + 1;
          } else if (currentPage >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = currentPage - 2 + i;
          }
          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={cn(
                "w-8 h-8 rounded text-sm font-medium transition-colors",
                currentPage === pageNum
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
            >
              {pageNum}
            </button>
          );
        })}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-2 rounded hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// Loading Skeleton
function LoadingSkeleton() {
  return (
    <AdminTableSkeleton
      columns={8}
      rows={5}
      statsCount={4}
      filterCount={1}
    />
  );
}

// Main Page Component
export default function LicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | LicenseStatus>("ALL");
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Modal states
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [regenerateModalOpen, setRegenerateModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // Fetch licenses from API
  const fetchLicenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", pagination.page.toString());
      params.set("limit", pagination.limit.toString());
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (searchTerm) params.set("search", searchTerm);

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/admin/licenses?${params.toString()}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Failed to fetch licenses");
      }

      const data = await response.json();
      setLicenses(data.data || []);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error("Failed to fetch licenses:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch licenses";
      showError("Failed to load licenses", errorMessage);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, statusFilter, searchTerm]);

  // Initial load and refetch on filter changes
  useEffect(() => {
    fetchLicenses();
  }, [fetchLicenses]);

  // Reset page when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [searchTerm, statusFilter]);

  // Calculate stats from current data
  const stats = useMemo<LicenseStats>(() => {
    return {
      total: pagination.total,
      active: licenses.filter((l) => l.status === "ACTIVE").length,
      expired: licenses.filter((l) => l.status === "EXPIRED").length,
      revoked: licenses.filter((l) => l.status === "REVOKED").length,
    };
  }, [licenses, pagination.total]);

  // Action handlers
  const handleExtend = useCallback(async (licenseId: string, days: number) => {
    const loadingId = showLoading("Extending license...");
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/admin/licenses/${licenseId}/extend`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ days }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Failed to extend license");
      }

      const data = await response.json();

      // Update local state with the response
      setLicenses((prev) =>
        prev.map((l) =>
          l.id === licenseId
            ? { ...l, expiresAt: data.data.expiresAt, status: "ACTIVE" as LicenseStatus }
            : l
        )
      );
      dismissToast(loadingId);
      showSuccess(data.message || "License extended successfully");
    } catch (err) {
      console.error("Failed to extend license:", err);
      dismissToast(loadingId);
      showError("Failed to extend license", err instanceof Error ? err.message : undefined);
      throw err;
    }
  }, []);

  const handleRevoke = useCallback(async (licenseId: string, reason: string) => {
    const loadingId = showLoading("Revoking license...");
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/admin/licenses/${licenseId}/revoke`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ reason }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Failed to revoke license");
      }

      const data = await response.json();

      // Update local state
      setLicenses((prev) =>
        prev.map((l) =>
          l.id === licenseId
            ? {
                ...l,
                status: "REVOKED" as LicenseStatus,
                revokedAt: data.data.revokedAt,
                revokedReason: reason,
              }
            : l
        )
      );
      dismissToast(loadingId);
      showSuccess(data.message || "License revoked successfully");
    } catch (err) {
      console.error("Failed to revoke license:", err);
      dismissToast(loadingId);
      showError("Failed to revoke license", err instanceof Error ? err.message : undefined);
      throw err;
    }
  }, []);

  const handleRegenerate = useCallback(async (licenseId: string) => {
    const loadingId = showLoading("Regenerating download token...");
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/admin/licenses/${licenseId}/regenerate`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Failed to regenerate token");
      }

      const data = await response.json();

      // Update local state with new token
      setLicenses((prev) =>
        prev.map((l) => (l.id === licenseId ? { ...l, downloadToken: data.data.downloadToken } : l))
      );
      dismissToast(loadingId);
      showSuccess(data.message || "Download token regenerated");
    } catch (err) {
      console.error("Failed to regenerate token:", err);
      dismissToast(loadingId);
      showError("Failed to regenerate token", err instanceof Error ? err.message : undefined);
      throw err;
    }
  }, []);

  // Truncate license key for display
  const truncateLicenseKey = (key: string) => {
    if (key.length <= 16) return key;
    return `${key.substring(0, 12)}...${key.substring(key.length - 4)}`;
  };

  // Clear filters handler
  const handleClearFilters = useCallback(() => {
    setSearchTerm("");
    setStatusFilter("ALL");
  }, []);

  // Check if filters are active
  const hasActiveFilters = searchTerm !== "" || statusFilter !== "ALL";

  // Show loading skeleton only on initial load
  if (loading && licenses.length === 0) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Licenses"
        description="Manage customer licenses and download access"
      />

      {/* Filter Bar */}
      <AdminFilters
        search={searchTerm}
        searchPlaceholder="Search by license key, order number, or email..."
        onSearchChange={setSearchTerm}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
      >
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "ALL" | LicenseStatus)}
          className="h-10 px-4 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="EXPIRED">Expired</option>
          <option value="REVOKED">Revoked</option>
        </select>
      </AdminFilters>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total Licenses" value={formatNumber(stats.total)} icon={<Key className="h-5 w-5" />} />
        <StatCard label="Active" value={formatNumber(stats.active)} icon={<Check className="h-5 w-5" />} variant="success" />
        <StatCard label="Expired" value={formatNumber(stats.expired)} icon={<Clock className="h-5 w-5" />} variant="warning" />
        <StatCard label="Revoked" value={formatNumber(stats.revoked)} icon={<Ban className="h-5 w-5" />} variant="error" />
      </div>

      {/* Data Table */}
      {licenses.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            title="No licenses found"
            description="Try adjusting your search or filter criteria."
            variant="noResults"
            action={{
              label: "Clear Filters",
              onClick: handleClearFilters,
            }}
          />
        ) : (
          <EmptyState
            title="No licenses yet"
            description="Licenses will appear here when customers make purchases."
          />
        )
      ) : (
        <div className="bg-background rounded-lg border">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>License Key</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Downloads</TableHead>
                  <TableHead>Expires At</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {licenses.map((license) => (
                  <TableRow key={license.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono">
                          {truncateLicenseKey(license.licenseKey)}
                        </code>
                        <CopyButton text={license.licenseKey} size="sm" variant="ghost" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <a
                        href={`/admin/orders/${license.id}`}
                        className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                      >
                        {license.order.orderNumber}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {license.order.customerEmail}
                    </TableCell>
                    <TableCell>
                      <LicenseStatusBadge status={license.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Download className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>
                          {license.downloadCount} / {license.maxDownloads}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {license.expiresAt ? formatDate(license.expiresAt) : "Never"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(license.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <ActionsDropdown
                        license={license}
                        onExtend={() => {
                          setSelectedLicense(license);
                          setExtendModalOpen(true);
                        }}
                        onRevoke={() => {
                          setSelectedLicense(license);
                          setRevokeModalOpen(true);
                        }}
                        onRegenerate={() => {
                          setSelectedLicense(license);
                          setRegenerateModalOpen(true);
                        }}
                        onViewDetails={() => {
                          setSelectedLicense(license);
                          setDetailsModalOpen(true);
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
            />
          )}
        </div>
      )}

      {/* Modals */}
      <ExtendLicenseModal
        license={selectedLicense}
        open={extendModalOpen}
        onClose={() => setExtendModalOpen(false)}
        onExtend={handleExtend}
      />

      <RevokeLicenseModal
        license={selectedLicense}
        open={revokeModalOpen}
        onClose={() => setRevokeModalOpen(false)}
        onRevoke={handleRevoke}
      />

      <RegenerateTokenModal
        license={selectedLicense}
        open={regenerateModalOpen}
        onClose={() => setRegenerateModalOpen(false)}
        onRegenerate={handleRegenerate}
      />

      <LicenseDetailsModal
        license={selectedLicense}
        open={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
      />
    </div>
  );
}
