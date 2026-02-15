'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ConfirmButton } from '@/components/ui/confirm-button';
import { Pagination } from '@/components/ui/pagination';
import { SkeletonTable } from '@/components/ui/skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { Alert } from '@/components/feedback/alert';

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

export interface PaginationData {
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
  pagination: PaginationData;
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
// Constants
// =============================================================================

const roleOptions = [
  { value: 'USER', label: 'User' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'ADMIN', label: 'Admin' },
];

const roleBadgeVariants: Record<UserRole, 'default' | 'secondary' | 'outline'> = {
  ADMIN: 'default',
  MANAGER: 'secondary',
  USER: 'outline',
};

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

    setProcessingId(userId);
    try {
      await onDelete(userId);
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    if (!onToggleActive) return;

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
          'bg-card rounded-xl shadow-sm border border-border overflow-hidden',
          className
        )}
      >
        <div className="p-6">
          <Alert variant="destructive" title="Error loading users">
            {error}
          </Alert>
          {onPageChange && (
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                onClick={() => onPageChange(pagination.page)}
              >
                Try again
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-card rounded-xl shadow-sm border border-border overflow-hidden',
        className
      )}
    >
      {loading ? (
        <div className="p-4">
          <SkeletonTable rows={pagination.limit || 5} columns={5} />
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          title="No users found"
          description="There are no users to display yet. When users sign up, they will appear here."
          className="border-0 rounded-none"
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const isProcessing = processingId === user.id;
                  const isSelf = user.id === currentUserId;

                  return (
                    <TableRow
                      key={user.id}
                      className={cn(
                        onUserClick && 'cursor-pointer'
                      )}
                      onClick={() => onUserClick?.(user)}
                    >
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                              <span className="text-sm font-medium text-muted-foreground">
                                {(user.name?.[0] || user.email[0]).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-foreground">
                              {user.name || 'No name'}
                            </div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell
                        className="whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {canManageRoles && onRoleChange && !isSelf ? (
                          <Select
                            value={user.role}
                            onChange={(value) =>
                              handleRoleChange(user.id, value as UserRole)
                            }
                            disabled={isProcessing}
                            options={roleOptions}
                            size="sm"
                          />
                        ) : (
                          <Badge variant={roleBadgeVariants[user.role]}>
                            {user.role}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell
                        className="whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {onToggleActive && !isSelf ? (
                          <ConfirmButton
                            confirmMode="dialog"
                            confirmTitle={`${(user.isActive ?? true) ? 'Deactivate' : 'Activate'} User`}
                            confirmMessage={`Are you sure you want to ${(user.isActive ?? true) ? 'deactivate' : 'activate'} this user?`}
                            confirmLabel={(user.isActive ?? true) ? 'Deactivate' : 'Activate'}
                            variant="ghost"
                            size="sm"
                            onConfirm={() =>
                              handleToggleActive(user.id, user.isActive ?? true)
                            }
                            disabled={isProcessing}
                            className={cn(
                              'p-0 h-auto',
                              isProcessing && 'opacity-50 cursor-not-allowed'
                            )}
                          >
                            <StatusBadge
                              status={(user.isActive ?? true) ? 'active' : 'inactive'}
                            />
                          </ConfirmButton>
                        ) : (
                          <StatusBadge
                            status={(user.isActive ?? true) ? 'active' : 'inactive'}
                          />
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell
                        className="whitespace-nowrap text-right text-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-2">
                          {onUserClick && (
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => onUserClick(user)}
                            >
                              View
                            </Button>
                          )}
                          {canDelete && onDelete && !isSelf && (
                            <ConfirmButton
                              confirmMode="dialog"
                              confirmTitle="Delete User"
                              confirmMessage="Are you sure you want to delete this user?"
                              variant="ghost"
                              size="sm"
                              onConfirm={() => handleDelete(user.id)}
                              disabled={isProcessing}
                              className={cn(
                                'text-destructive hover:text-destructive',
                                isProcessing && 'opacity-50 cursor-not-allowed'
                              )}
                            >
                              {isProcessing ? 'Deleting...' : 'Delete'}
                            </ConfirmButton>
                          )}
                          {isSelf && (
                            <span className="text-muted-foreground text-xs">(You)</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-border">
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={(page) => onPageChange?.(page)}
                totalItems={pagination.total}
                pageSize={pagination.limit}
                showItemCount
                disabled={loading}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AdminUsersTable;
