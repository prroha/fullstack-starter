'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

export type UserRole = 'USER' | 'ADMIN' | 'MANAGER';

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  isActive?: boolean;
  emailVerified?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export interface AdminUsersTableProps {
  /** Array of users to display */
  users: AdminUser[];
  /** Pagination info */
  pagination: Pagination;
  /** Loading state */
  loading?: boolean;
  /** Error message */
  error?: string | null;
  /** Handler for role change */
  onRoleChange?: (userId: string, newRole: UserRole) => Promise<void>;
  /** Handler for user deletion */
  onDelete?: (userId: string) => Promise<void>;
  /** Handler for page change */
  onPageChange?: (page: number) => void;
  /** Handler for user click/view */
  onUserClick?: (user: AdminUser) => void;
  /** Handler for toggling active status */
  onToggleActive?: (userId: string, isActive: boolean) => Promise<void>;
  /** Current user's ID (to prevent self-deletion) */
  currentUserId?: string;
  /** Whether role changes are allowed */
  canManageRoles?: boolean;
  /** Whether delete is allowed */
  canDelete?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Helper Components
// =============================================================================

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse">
      <div className="flex gap-4 p-4 border-b border-gray-200">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex-1 h-4 bg-gray-200 rounded" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-4 border-b border-gray-100">
          {Array.from({ length: 4 }).map((_, colIndex) => (
            <div key={colIndex} className="flex-1 h-4 bg-gray-100 rounded" />
          ))}
        </div>
      ))}
    </div>
  );
}

function EmptyState({ message = 'No users found' }: { message?: string }) {
  return (
    <div className="text-center py-12">
      <svg
        className="mx-auto h-12 w-12 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
        />
      </svg>
      <p className="mt-4 text-gray-500">{message}</p>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="text-center py-12">
      <svg
        className="mx-auto h-12 w-12 text-red-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <p className="mt-4 text-red-600">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 underline"
        >
          Try again
        </button>
      )}
    </div>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      )}
    >
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  const roleStyles: Record<UserRole, string> = {
    ADMIN: 'bg-purple-100 text-purple-800',
    MANAGER: 'bg-blue-100 text-blue-800',
    USER: 'bg-gray-100 text-gray-800',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        roleStyles[role]
      )}
    >
      {role}
    </span>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function AdminUsersTable({
  users,
  pagination,
  loading = false,
  error = null,
  onRoleChange,
  onDelete,
  onPageChange,
  onUserClick,
  onToggleActive,
  currentUserId,
  canManageRoles = true,
  canDelete = true,
  className,
}: AdminUsersTableProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (!onRoleChange) return;

    setProcessingId(userId);
    try {
      await onRoleChange(userId, newRole);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!onDelete) return;
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    setProcessingId(userId);
    try {
      await onDelete(userId);
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    if (!onToggleActive) return;

    const action = currentActive ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;

    setProcessingId(userId);
    try {
      await onToggleActive(userId, !currentActive);
    } finally {
      setProcessingId(null);
    }
  };

  if (error) {
    return (
      <div
        className={cn(
          'bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden',
          className
        )}
      >
        <ErrorState message={error} onRetry={() => onPageChange?.(pagination.page)} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden',
        className
      )}
    >
      {loading ? (
        <TableSkeleton rows={pagination.limit || 5} />
      ) : users.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    User
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Role
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Joined
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => {
                  const isProcessing = processingId === user.id;
                  const isSelf = user.id === currentUserId;

                  return (
                    <tr
                      key={user.id}
                      className={cn(
                        'hover:bg-gray-50 transition-colors',
                        onUserClick && 'cursor-pointer'
                      )}
                      onClick={() => onUserClick?.(user)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600">
                                {(user.name?.[0] || user.email[0]).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name || 'No name'}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {canManageRoles && onRoleChange && !isSelf ? (
                          <select
                            value={user.role}
                            onChange={(e) =>
                              handleRoleChange(user.id, e.target.value as UserRole)
                            }
                            disabled={isProcessing}
                            className={cn(
                              'text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                              isProcessing && 'opacity-50 cursor-not-allowed'
                            )}
                          >
                            <option value="USER">User</option>
                            <option value="MANAGER">Manager</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                        ) : (
                          <RoleBadge role={user.role} />
                        )}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {onToggleActive && !isSelf ? (
                          <button
                            onClick={() =>
                              handleToggleActive(user.id, user.isActive ?? true)
                            }
                            disabled={isProcessing}
                            className={cn(
                              'transition-colors',
                              isProcessing && 'opacity-50 cursor-not-allowed'
                            )}
                          >
                            <StatusBadge isActive={user.isActive ?? true} />
                          </button>
                        ) : (
                          <StatusBadge isActive={user.isActive ?? true} />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.createdAt)}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-right text-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-2">
                          {onUserClick && (
                            <button
                              onClick={() => onUserClick(user)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              View
                            </button>
                          )}
                          {canDelete && onDelete && !isSelf && (
                            <button
                              onClick={() => handleDelete(user.id)}
                              disabled={isProcessing}
                              className={cn(
                                'text-red-600 hover:text-red-700',
                                isProcessing && 'opacity-50 cursor-not-allowed'
                              )}
                            >
                              {isProcessing ? 'Deleting...' : 'Delete'}
                            </button>
                          )}
                          {isSelf && (
                            <span className="text-gray-400 text-xs">(You)</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Showing{' '}
                <span className="font-medium">
                  {(pagination.page - 1) * pagination.limit + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                of <span className="font-medium">{pagination.total}</span> users
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => onPageChange?.(pagination.page - 1)}
                  disabled={pagination.page === 1 || loading}
                  className={cn(
                    'px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg transition-colors',
                    pagination.page === 1 || loading
                      ? 'opacity-50 cursor-not-allowed bg-gray-50'
                      : 'hover:bg-gray-50'
                  )}
                >
                  Previous
                </button>
                <button
                  onClick={() => onPageChange?.(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages || loading}
                  className={cn(
                    'px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg transition-colors',
                    pagination.page >= pagination.totalPages || loading
                      ? 'opacity-50 cursor-not-allowed bg-gray-50'
                      : 'hover:bg-gray-50'
                  )}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AdminUsersTable;
