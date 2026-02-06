'use client';

import { useState, useEffect, useCallback } from 'react';

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

  const getLevelBadge = (level: string) => {
    const colors: Record<string, string> = {
      info: 'bg-blue-100 text-blue-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      security: 'bg-purple-100 text-purple-800',
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          colors[level] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {level}
      </span>
    );
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
              <p className="text-sm text-gray-500 mt-1">
                View and search system activity logs
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Export CSV
              </button>
              <button
                onClick={() => handleExport('json')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Export JSON
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <StatCard title="Total Logs" value={stats.total} />
            <StatCard
              title="Info"
              value={stats.byLevel['info'] || 0}
              color="blue"
            />
            <StatCard
              title="Warnings"
              value={stats.byLevel['warning'] || 0}
              color="yellow"
            />
            <StatCard
              title="Errors"
              value={stats.byLevel['error'] || 0}
              color="red"
            />
          </div>
        )}

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Level
                </label>
                <select
                  value={filters.level}
                  onChange={(e) => handleFilterChange('level', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">All Levels</option>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                  <option value="security">Security</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">All Categories</option>
                  <option value="auth">Auth</option>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="payment">Payment</option>
                  <option value="api">API</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search actions..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchLogs}
              className="mt-2 text-sm text-red-700 underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Logs Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No audit logs found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Timestamp
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Level
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Action
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Path
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Duration
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      IP
                    </th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getLevelBadge(log.level)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                        {log.action}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {log.userEmail || log.userId || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                        <span className="text-gray-400">{log.method}</span>{' '}
                        {log.path}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {log.statusCode && (
                          <span
                            className={
                              log.statusCode >= 400
                                ? 'text-red-600'
                                : 'text-green-600'
                            }
                          >
                            {log.statusCode}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDuration(log.duration)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                        {log.ipAddress}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-blue-600 hover:text-blue-700 text-sm"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Audit Log Details
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <DetailRow label="ID" value={selectedLog.id} mono />
              <DetailRow label="Timestamp" value={formatDate(selectedLog.timestamp)} />
              <DetailRow
                label="Level"
                value={<span>{getLevelBadge(selectedLog.level)}</span>}
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
                  <div className="text-sm font-medium text-gray-500 mb-1">
                    Metadata
                  </div>
                  <pre className="bg-gray-50 rounded p-3 text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function StatCard({
  title,
  value,
  color = 'gray',
}: {
  title: string;
  value: number;
  color?: string;
}) {
  const colors: Record<string, string> = {
    gray: 'bg-white',
    blue: 'bg-blue-50',
    yellow: 'bg-yellow-50',
    red: 'bg-red-50',
  };

  return (
    <div
      className={`${colors[color]} rounded-lg border border-gray-200 p-4`}
    >
      <div className="text-sm font-medium text-gray-500">{title}</div>
      <div className="mt-1 text-2xl font-semibold text-gray-900">
        {value.toLocaleString()}
      </div>
    </div>
  );
}

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
      <div className="text-sm font-medium text-gray-500">{label}</div>
      <div
        className={`
          mt-1 text-gray-900
          ${mono ? 'font-mono' : ''}
          ${small ? 'text-xs' : 'text-sm'}
          ${error ? 'text-red-600' : ''}
        `}
      >
        {value}
      </div>
    </div>
  );
}
