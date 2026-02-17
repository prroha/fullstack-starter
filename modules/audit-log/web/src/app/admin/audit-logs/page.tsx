'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import {
  Dialog,
  DialogHeader,
  DialogBody,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { Alert } from '@/components/feedback/alert';
import { FileText } from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

interface AuditLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'security';
  action: string;
  category: string;
  userId?: string;
  userEmail?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  ipAddress?: string;
  userAgent?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
  error?: string;
}

interface AuditStats {
  total: number;
  byLevel: Record<string, number>;
  byCategory: Record<string, number>;
}

interface FilterState {
  startDate: string;
  endDate: string;
  level: string;
  category: string;
  search: string;
  userId: string;
}

// =============================================================================
// Constants
// =============================================================================

const levelOptions = [
  { value: '', label: 'All Levels' },
  { value: 'info', label: 'Info' },
  { value: 'warning', label: 'Warning' },
  { value: 'error', label: 'Error' },
  { value: 'security', label: 'Security' },
];

const categoryOptions = [
  { value: '', label: 'All Categories' },
  { value: 'auth', label: 'Auth' },
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' },
  { value: 'payment', label: 'Payment' },
  { value: 'api', label: 'API' },
];

const levelBadgeVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'> = {
  info: 'default',
  warning: 'warning',
  error: 'destructive',
  security: 'secondary',
};

// =============================================================================
// Audit Logs Page
// =============================================================================

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    startDate: '',
    endDate: '',
    level: '',
    category: '',
    search: '',
    userId: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '50');

      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);
      if (filters.level) params.set('level', filters.level);
      if (filters.category) params.set('category', filters.category);
      if (filters.search) params.set('search', filters.search);
      if (filters.userId) params.set('userId', filters.userId);

      const response = await fetch(`/api/admin/audit-logs?${params}`);
      const data = await response.json();

      if (data.success) {
        setLogs(data.logs);
        setTotalPages(data.totalPages || 1);
      } else {
        setError(data.error || 'Failed to load logs');
      }
    } catch (err) {
      console.error('Fetch logs error:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/audit-logs/stats');
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Fetch stats error:', err);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      level: '',
      category: '',
      search: '',
      userId: '',
    });
    setPage(1);
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const params = new URLSearchParams();
      params.set('format', format);

      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);
      if (filters.level) params.set('level', filters.level);
      if (filters.category) params.set('category', filters.category);

      const response = await fetch(`/api/admin/audit-logs/export?${params}`);
      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
              <p className="text-sm text-muted-foreground mt-1">
                View and search system activity logs
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport('csv')}
              >
                Export CSV
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport('json')}
              >
                Export JSON
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Logs" value={stats.total.toLocaleString()} />
            <StatCard
              label="Info"
              value={(stats.byLevel['info'] || 0).toLocaleString()}
              variant="info"
            />
            <StatCard
              label="Warnings"
              value={(stats.byLevel['warning'] || 0).toLocaleString()}
              variant="warning"
            />
            <StatCard
              label="Errors"
              value={(stats.byLevel['error'] || 0).toLocaleString()}
              variant="error"
            />
          </div>
        )}

        {/* Filters */}
        {showFilters && (
          <div className="bg-card rounded-lg shadow-sm border border-border p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <Label htmlFor="filter-start-date" className="mb-1">
                  Start Date
                </Label>
                <Input
                  id="filter-start-date"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="filter-end-date" className="mb-1">
                  End Date
                </Label>
                <Input
                  id="filter-end-date"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>
              <div>
                <Select
                  label="Level"
                  options={levelOptions}
                  value={filters.level}
                  onChange={(value) => handleFilterChange('level', value)}
                />
              </div>
              <div>
                <Select
                  label="Category"
                  options={categoryOptions}
                  value={filters.category}
                  onChange={(value) => handleFilterChange('category', value)}
                />
              </div>
              <div>
                <Label htmlFor="filter-search" className="mb-1">
                  Search
                </Label>
                <Input
                  id="filter-search"
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search actions..."
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-6">
            <Alert variant="destructive">
              <div className="flex flex-col gap-2">
                <span>{error}</span>
                <Button variant="outline" size="sm" onClick={fetchLogs} className="self-start">
                  Retry
                </Button>
              </div>
            </Alert>
          </div>
        )}

        {/* Logs Table */}
        <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="md" />
            </div>
          ) : logs.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No audit logs found"
              description="There are no audit logs matching your current filters."
              variant="noResults"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Path</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead className="w-[1%]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {formatDate(log.timestamp)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant={levelBadgeVariant[log.level] || 'outline'}>
                        {log.level}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-foreground font-mono">
                      {log.action}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {log.userEmail || log.userId || '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono">
                      <span className="text-muted-foreground/60">{log.method}</span>{' '}
                      {log.path}
                    </TableCell>
                    <TableCell>
                      {log.statusCode && (
                        <span
                          className={cn(
                            'text-sm font-medium',
                            log.statusCode >= 400
                              ? 'text-destructive'
                              : 'text-success'
                          )}
                        >
                          {log.statusCode}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDuration(log.duration)}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono">
                      {log.ipAddress}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                      >
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-border">
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                showItemCount={false}
              />
            </div>
          )}
        </div>
      </main>

      {/* Detail Modal */}
      <Dialog
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        size="lg"
        title="Audit Log Details"
      >
        {selectedLog && (
          <DialogBody className="space-y-4">
            <DetailRow label="ID" value={selectedLog.id} mono />
            <DetailRow label="Timestamp" value={formatDate(selectedLog.timestamp)} />
            <DetailRow
              label="Level"
              value={
                <Badge variant={levelBadgeVariant[selectedLog.level] || 'outline'}>
                  {selectedLog.level}
                </Badge>
              }
            />
            <DetailRow label="Action" value={selectedLog.action} mono />
            <DetailRow label="Category" value={selectedLog.category} />
            <DetailRow label="User ID" value={selectedLog.userId} mono />
            <DetailRow label="User Email" value={selectedLog.userEmail} />
            <DetailRow
              label="Request"
              value={`${selectedLog.method} ${selectedLog.path}`}
              mono
            />
            <DetailRow label="Status Code" value={selectedLog.statusCode} />
            <DetailRow
              label="Duration"
              value={formatDuration(selectedLog.duration)}
            />
            <DetailRow label="IP Address" value={selectedLog.ipAddress} mono />
            <DetailRow label="User Agent" value={selectedLog.userAgent} small />
            {selectedLog.error && (
              <DetailRow label="Error" value={selectedLog.error} error />
            )}
            {selectedLog.metadata && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Metadata
                </div>
                <pre className="bg-muted rounded p-3 text-xs overflow-x-auto text-foreground">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            )}
          </DialogBody>
        )}
      </Dialog>
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function DetailRow({
  label,
  value,
  mono,
  small,
  error,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  small?: boolean;
  error?: boolean;
}) {
  if (!value && value !== 0) return null;

  return (
    <div>
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <div
        className={cn(
          'mt-1 text-foreground',
          mono && 'font-mono',
          small ? 'text-xs' : 'text-sm',
          error && 'text-destructive'
        )}
      >
        {value}
      </div>
    </div>
  );
}
