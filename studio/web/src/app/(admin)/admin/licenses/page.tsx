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
import { Button, Modal, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, StatCard, CopyButton } from "@/components/ui";
import { EmptyList } from "@/components/ui";
import { EmptyState } from "@core/components/shared";
import { AdminPageHeader, AdminFilters, LicenseStatusBadge } from "@/components/admin";

// Types
type LicenseStatus = "ACTIVE" | "EXPIRED" | "REVOKED";

interface License {
  id: string;
  licenseKey: string;
  downloadToken: string;
  orderNumber: string;
  orderId: string;
  customerEmail: string;
  customerName: string;
  status: LicenseStatus;
  downloadCount: number;
  maxDownloads: number;
  expiresAt: string;
  createdAt: string;
  revokedAt?: string;
  revokeReason?: string;
  downloadHistory: DownloadRecord[];
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

// Mock Data
const generateMockLicenses = (): License[] => {
  const statuses: LicenseStatus[] = ["ACTIVE", "EXPIRED", "REVOKED"];
  const names = [
    "John Doe",
    "Jane Smith",
    "Bob Johnson",
    "Alice Brown",
    "Charlie Wilson",
    "Diana Prince",
    "Edward Norton",
    "Fiona Green",
    "George Harris",
    "Helen Clark",
  ];

  return Array.from({ length: 47 }, (_, i) => {
    const status = statuses[Math.floor(Math.random() * (i < 30 ? 2 : 3))] || "ACTIVE";
    const createdDate = new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000);
    const expiresDate = new Date(createdDate.getTime() + 365 * 24 * 60 * 60 * 1000);
    const name = names[i % names.length];
    const downloadCount = Math.floor(Math.random() * 5);

    return {
      id: `lic_${String(i + 1).padStart(6, "0")}`,
      licenseKey: `LIC-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      downloadToken: `tok_${Math.random().toString(36).substring(2, 18)}${Math.random().toString(36).substring(2, 18)}`,
      orderNumber: `ORD-${String(100 + i).padStart(6, "0")}`,
      orderId: `ord_${String(i + 1).padStart(6, "0")}`,
      customerEmail: `${name?.toLowerCase().replace(" ", ".")}@example.com`,
      customerName: name || "Unknown",
      status: status as LicenseStatus,
      downloadCount,
      maxDownloads: 5,
      expiresAt: status === "EXPIRED" ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() : expiresDate.toISOString(),
      createdAt: createdDate.toISOString(),
      revokedAt: status === "REVOKED" ? new Date().toISOString() : undefined,
      revokeReason: status === "REVOKED" ? "Policy violation" : undefined,
      downloadHistory: Array.from({ length: downloadCount }, (_, j) => ({
        id: `dl_${i}_${j}`,
        downloadedAt: new Date(createdDate.getTime() + (j + 1) * 24 * 60 * 60 * 1000).toISOString(),
        ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      })),
    };
  });
};

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
  onExtend: (licenseId: string, newDate: string, reason: string) => void;
}) {
  const [newDate, setNewDate] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (license) {
      const currentExpiry = new Date(license.expiresAt);
      const extendedDate = new Date(currentExpiry.getTime() + 365 * 24 * 60 * 60 * 1000);
      setNewDate(extendedDate.toISOString().split("T")[0] || "");
    }
  }, [license]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!license) return;

    setLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    onExtend(license.id, newDate, reason);
    setLoading(false);
    setReason("");
    onClose();
  };

  if (!license) return null;

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
            disabled={loading || !newDate}
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
          <p className="text-sm text-muted-foreground">{formatDateTime(license.expiresAt)}</p>
        </div>

        <div>
          <label htmlFor="newDate" className="block text-sm font-medium mb-1">
            New Expiration Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="newDate"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            required
            className="w-full px-3 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="reason" className="block text-sm font-medium mb-1">
            Reason (optional)
          </label>
          <textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Customer request, promotional extension..."
            rows={3}
            className="w-full px-3 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
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
  onRevoke: (licenseId: string, reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!license) return;

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    onRevoke(license.id, reason);
    setLoading(false);
    setReason("");
    onClose();
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
          <p className="text-sm text-muted-foreground">{license.customerEmail}</p>
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
  onRegenerate: (licenseId: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!license) return;

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    onRegenerate(license.id);
    setLoading(false);
    onClose();
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
          <p className="text-sm text-muted-foreground">{license.customerEmail}</p>
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
              <p className="text-sm">{formatDateTime(license.expiresAt)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Order</label>
              <a href={`/admin/orders/${license.orderId}`} className="text-sm text-primary hover:underline">
                {license.orderNumber}
              </a>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Customer</label>
              <p className="text-sm">{license.customerEmail}</p>
            </div>
          </div>

          {license.revokedAt && (
            <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20">
              <p className="text-sm font-medium text-red-600">Revoked on {formatDateTime(license.revokedAt)}</p>
              {license.revokeReason && (
                <p className="text-sm text-red-600/80 mt-1">Reason: {license.revokeReason}</p>
              )}
            </div>
          )}
        </div>

        {/* Download History */}
        <div>
          <h3 className="text-sm font-medium mb-3">Download History</h3>
          {license.downloadHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No downloads yet</p>
          ) : (
            <div className="border rounded-md divide-y max-h-48 overflow-y-auto">
              {license.downloadHistory.map((record) => (
                <div key={record.id} className="px-3 py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{formatDateTime(record.downloadedAt)}</span>
                    <span className="font-mono text-xs text-muted-foreground">{record.ipAddress}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-1">{record.userAgent}</p>
                </div>
              ))}
            </div>
          )}
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="h-8 bg-muted rounded w-32 animate-pulse" />
        <div className="h-4 bg-muted rounded w-48 mt-2 animate-pulse" />
      </div>

      {/* Filter Bar */}
      <div className="flex gap-4">
        <div className="h-10 bg-muted rounded flex-1 max-w-md animate-pulse" />
        <div className="h-10 bg-muted rounded w-40 animate-pulse" />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-background rounded-lg border p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted" />
              <div>
                <div className="h-4 bg-muted rounded w-16 mb-1" />
                <div className="h-6 bg-muted rounded w-12" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-background rounded-lg border">
        <div className="p-4 border-b">
          <div className="h-5 bg-muted rounded w-24 animate-pulse" />
        </div>
        <div className="divide-y">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-4 animate-pulse">
              <div className="h-4 bg-muted rounded w-40" />
              <div className="h-4 bg-muted rounded w-24" />
              <div className="h-4 bg-muted rounded w-32" />
              <div className="h-4 bg-muted rounded w-16" />
              <div className="h-4 bg-muted rounded w-12" />
              <div className="h-4 bg-muted rounded w-24" />
              <div className="h-4 bg-muted rounded w-24" />
              <div className="h-4 bg-muted rounded w-8" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Main Page Component
export default function LicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | LicenseStatus>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal states
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [regenerateModalOpen, setRegenerateModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // Fetch licenses
  useEffect(() => {
    // Simulate API call: GET /api/admin/licenses
    const fetchLicenses = async () => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 800));
      setLicenses(generateMockLicenses());
      setLoading(false);
    };

    fetchLicenses();
  }, []);

  // Calculate stats
  const stats = useMemo<LicenseStats>(() => {
    return {
      total: licenses.length,
      active: licenses.filter((l) => l.status === "ACTIVE").length,
      expired: licenses.filter((l) => l.status === "EXPIRED").length,
      revoked: licenses.filter((l) => l.status === "REVOKED").length,
    };
  }, [licenses]);

  // Filter licenses
  const filteredLicenses = useMemo(() => {
    return licenses.filter((license) => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        license.licenseKey.toLowerCase().includes(searchLower) ||
        license.orderNumber.toLowerCase().includes(searchLower) ||
        license.customerEmail.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus = statusFilter === "ALL" || license.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [licenses, searchTerm, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredLicenses.length / itemsPerPage);
  const paginatedLicenses = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLicenses.slice(start, start + itemsPerPage);
  }, [filteredLicenses, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Action handlers
  const handleExtend = useCallback((licenseId: string, newDate: string, reason: string) => {
    // Simulate API call: PATCH /api/admin/licenses/:id/extend
    setLicenses((prev) =>
      prev.map((l) =>
        l.id === licenseId
          ? { ...l, expiresAt: new Date(newDate).toISOString(), status: "ACTIVE" as LicenseStatus }
          : l
      )
    );
    console.log("Extended license:", { licenseId, newDate, reason });
  }, []);

  const handleRevoke = useCallback((licenseId: string, reason: string) => {
    // Simulate API call: PATCH /api/admin/licenses/:id/revoke
    setLicenses((prev) =>
      prev.map((l) =>
        l.id === licenseId
          ? {
              ...l,
              status: "REVOKED" as LicenseStatus,
              revokedAt: new Date().toISOString(),
              revokeReason: reason,
            }
          : l
      )
    );
    console.log("Revoked license:", { licenseId, reason });
  }, []);

  const handleRegenerate = useCallback((licenseId: string) => {
    // Simulate API call: POST /api/admin/licenses/:id/regenerate-token
    const newToken = `tok_${Math.random().toString(36).substring(2, 18)}${Math.random().toString(36).substring(2, 18)}`;
    setLicenses((prev) =>
      prev.map((l) => (l.id === licenseId ? { ...l, downloadToken: newToken } : l))
    );
    console.log("Regenerated token for license:", licenseId);
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

  if (loading) {
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
      {filteredLicenses.length === 0 ? (
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
                {paginatedLicenses.map((license) => (
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
                        href={`/admin/orders/${license.orderId}`}
                        className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                      >
                        {license.orderNumber}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {license.customerEmail}
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
                      {formatDate(license.expiresAt)}
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
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
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
