"use client";

import { useEffect, useState, useCallback } from "react";
import { api, ApiError, AdminUser } from "@/lib/api";
import { Button, Input, Badge, SkeletonTable, ExportCsvButton } from "@/components/ui";
import { Alert } from "@/components/feedback";
import { EmptyUsers, EmptySearch } from "@/components/shared";
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

/**
 * User Row Component
 */
function UserRow({
  user,
  onEdit,
  onToggleStatus,
  isUpdating,
}: {
  user: AdminUser;
  onEdit: (user: AdminUser) => void;
  onToggleStatus: (user: AdminUser) => void;
  isUpdating: boolean;
}) {
  return (
    <tr className="border-b transition-colors hover:bg-muted/50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
            {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium">{user.name || "No name"}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
          {user.role}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <Badge variant={user.isActive ? "default" : "destructive"}>
          {user.isActive ? "Active" : "Inactive"}
        </Badge>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {new Date(user.createdAt).toLocaleDateString()}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(user)}
            disabled={isUpdating}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleStatus(user)}
            disabled={isUpdating}
            className={cn(
              user.isActive
                ? "text-destructive hover:text-destructive"
                : "text-green-600 hover:text-green-700"
            )}
          >
            {user.isActive ? "Deactivate" : "Activate"}
          </Button>
        </div>
      </td>
    </tr>
  );
}

/**
 * Pagination Component
 */
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
      <p className="text-sm text-muted-foreground">
        Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
        {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
        {pagination.total} users
      </p>
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

/**
 * Edit User Modal
 */
function EditUserModal({
  user,
  onClose,
  onSave,
  isSaving,
}: {
  user: AdminUser;
  onClose: () => void;
  onSave: (data: { role?: "USER" | "ADMIN"; name?: string }) => void;
  isSaving: boolean;
}) {
  const [role, setRole] = useState<"USER" | "ADMIN">(user.role);
  const [name, setName] = useState(user.name || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ role, name: name || undefined });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-md rounded-lg border bg-background p-6 shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Edit User</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input id="email" value={user.email} disabled />
          </div>
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="role" className="text-sm font-medium">
              Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as "USER" | "ADMIN")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Admin Users Page
 */
export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [roleFilter, setRoleFilter] = useState<"" | "USER" | "ADMIN">("");
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "inactive">(
    ""
  );

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = useCallback(
    async (page = 1) => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await api.getAdminUsers({
          page,
          limit: 10,
          search: searchDebounced || undefined,
          role: roleFilter || undefined,
          isActive:
            statusFilter === "active"
              ? true
              : statusFilter === "inactive"
              ? false
              : undefined,
        });

        if (response.data) {
          setUsers(response.data.items);
          setPagination(response.data.pagination);
        }
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Failed to load users");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [searchDebounced, roleFilter, statusFilter]
  );

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handlePageChange = (page: number) => {
    fetchUsers(page);
  };

  const handleToggleStatus = async (user: AdminUser) => {
    try {
      setIsUpdating(true);
      await api.updateAdminUser(user.id, { isActive: !user.isActive });
      toast.success(
        `User ${user.isActive ? "deactivated" : "activated"} successfully`
      );
      fetchUsers(pagination?.page || 1);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to update user status");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditSave = async (data: {
    role?: "USER" | "ADMIN";
    name?: string;
  }) => {
    if (!editingUser) return;

    try {
      setIsUpdating(true);
      await api.updateAdminUser(editingUser.id, data);
      toast.success("User updated successfully");
      setEditingUser(null);
      fetchUsers(pagination?.page || 1);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to update user");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Manage all users in your application
          </p>
        </div>
        <ExportCsvButton
          label="Export Users"
          onExport={async () => {
            await downloadFile(api.getAdminUsersExportUrl());
          }}
          onSuccess={() => toast.success("Users exported successfully")}
          onError={(error) => toast.error(error.message || "Export failed")}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <Input
            type="search"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as "" | "USER" | "ADMIN")}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <option value="">All Roles</option>
          <option value="USER">User</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "" | "active" | "inactive")
          }
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Error Alert */}
      {error && <Alert variant="destructive">{error}</Alert>}

      {/* Users Table */}
      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="p-6">
            <SkeletonTable rows={5} columns={5} />
          </div>
        ) : users.length === 0 ? (
          <div className="p-6">
            {searchDebounced || roleFilter || statusFilter ? (
              <EmptySearch
                searchQuery={searchDebounced}
                action={{
                  label: "Clear filters",
                  onClick: () => {
                    setSearch("");
                    setSearchDebounced("");
                    setRoleFilter("");
                    setStatusFilter("");
                  },
                  variant: "outline",
                }}
              />
            ) : (
              <EmptyUsers />
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Joined
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onEdit={setEditingUser}
                    onToggleStatus={handleToggleStatus}
                    isUpdating={isUpdating}
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

      {/* Edit Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleEditSave}
          isSaving={isUpdating}
        />
      )}
    </div>
  );
}
