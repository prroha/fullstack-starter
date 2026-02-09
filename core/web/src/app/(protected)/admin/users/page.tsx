"use client";

import { useState } from "react";
import { api, ApiError, AdminUser } from "@/lib/api";
import { Button, Input, Badge, Text, Select, Modal } from "@/components/ui";
import { Alert } from "@/components/feedback";
import { EmptyUsers } from "@/components/shared";
import { AdminPageHeader, AdminTableContainer } from "@/components/admin";
import { useAdminList } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { downloadFile } from "@/lib/export";

// =====================================================
// Types
// =====================================================

type RoleFilter = "" | "USER" | "ADMIN" | "SUPER_ADMIN";
type StatusFilter = "" | "active" | "inactive";

interface UserFilters {
  role: RoleFilter;
  status: StatusFilter;
}

// =====================================================
// User Row Component
// =====================================================

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
    <tr className="border-b hover:bg-muted/50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
            {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
          </div>
          <div>
            <Text as="p" className="font-medium">{user.name || "No name"}</Text>
            <Text variant="caption" color="muted">{user.email}</Text>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge
          variant={
            user.role === "SUPER_ADMIN"
              ? "destructive"
              : user.role === "ADMIN"
                ? "default"
                : "secondary"
          }
        >
          {user.role === "SUPER_ADMIN" ? "Super Admin" : user.role}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <Badge variant={user.isActive ? "default" : "destructive"}>
          {user.isActive ? "Active" : "Inactive"}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <Text variant="caption" color="muted">
          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
        </Text>
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

// =====================================================
// Edit User Modal
// =====================================================

function EditUserModal({
  user,
  onClose,
  onSave,
  isSaving,
}: {
  user: AdminUser;
  onClose: () => void;
  onSave: (data: { role?: "USER" | "ADMIN" | "SUPER_ADMIN"; name?: string }) => void;
  isSaving: boolean;
}) {
  const [role, setRole] = useState<"USER" | "ADMIN" | "SUPER_ADMIN">(user.role);
  const [name, setName] = useState(user.name || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ role, name: name || undefined });
  };

  const roleOptions = [
    { value: "USER", label: "User" },
    { value: "ADMIN", label: "Admin" },
    { value: "SUPER_ADMIN", label: "Super Admin" },
  ];

  return (
    <Modal isOpen onClose={onClose} title="Edit User">
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
          <Select
            options={roleOptions}
            value={role}
            onChange={(value) => setRole(value as "USER" | "ADMIN" | "SUPER_ADMIN")}
          />
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
    </Modal>
  );
}

// =====================================================
// Admin Users Page
// =====================================================

export default function AdminUsersPage() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  // Use shared admin list hook
  const {
    items: users,
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
    refetch,
  } = useAdminList<AdminUser, UserFilters>({
    fetchFn: async ({ page, limit, search, filters }) => {
      const response = await api.getAdminUsers({
        page,
        limit,
        search: search || undefined,
        role: filters.role || undefined,
        isActive:
          filters.status === "active"
            ? true
            : filters.status === "inactive"
            ? false
            : undefined,
      });

      if (!response.data) {
        throw new Error("Failed to load users");
      }

      return {
        items: response.data.items,
        pagination: response.data.pagination,
      };
    },
    initialFilters: { role: "", status: "" },
  });

  const handleToggleStatus = async (user: AdminUser) => {
    try {
      setIsUpdating(true);
      await api.updateAdminUser(user.id, { isActive: !user.isActive });
      toast.success(
        `User ${user.isActive ? "deactivated" : "activated"} successfully`
      );
      refetch(pagination?.page || 1);
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
    role?: "USER" | "ADMIN" | "SUPER_ADMIN";
    name?: string;
  }) => {
    if (!editingUser) return;

    try {
      setIsUpdating(true);
      await api.updateAdminUser(editingUser.id, data);
      toast.success("User updated successfully");
      setEditingUser(null);
      refetch(pagination?.page || 1);
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

  const roleFilterOptions = [
    { value: "", label: "All Roles" },
    { value: "USER", label: "User" },
    { value: "ADMIN", label: "Admin" },
    { value: "SUPER_ADMIN", label: "Super Admin" },
  ];

  const statusFilterOptions = [
    { value: "", label: "All Status" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Users"
        description="Manage all users in your application"
        exportConfig={{
          label: "Export Users",
          onExport: async () => {
            await downloadFile(api.getAdminUsersExportUrl());
          },
          successMessage: "Users exported successfully",
        }}
      />

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
        <Select
          options={roleFilterOptions}
          value={filters.role}
          onChange={(value) => setFilter("role", value as RoleFilter)}
          className="w-40"
        />
        <Select
          options={statusFilterOptions}
          value={filters.status}
          onChange={(value) => setFilter("status", value as StatusFilter)}
          className="w-40"
        />
      </div>

      {/* Error Alert */}
      {error && <Alert variant="destructive">{error}</Alert>}

      {/* Users Table */}
      <AdminTableContainer
        isLoading={isLoading}
        isEmpty={isEmpty}
        hasActiveFilters={hasActiveFilters}
        searchQuery={searchDebounced}
        onClearFilters={clearFilters}
        emptyState={{
          title: "No users",
          description: "Users will appear here once they register.",
        }}
        pagination={pagination}
        onPageChange={handlePageChange}
        itemLabel="users"
        skeletonRows={5}
        skeletonColumns={5}
      >
        {!isEmpty && !isLoading && (
          <>
            {/* Show EmptyUsers when no users exist at all */}
            {users.length === 0 && !hasActiveFilters ? (
              <div className="p-6">
                <EmptyUsers />
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium">User</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Role</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Joined</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
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
            )}
          </>
        )}
      </AdminTableContainer>

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
