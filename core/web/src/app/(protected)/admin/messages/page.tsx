"use client";

import { useState, useEffect, useCallback } from "react";
import { api, ApiError, ContactMessage, ContactMessageStatus } from "@/lib/api";
import { Button, Input, Badge, Text, Select, Modal } from "@/components/ui";
import { Alert } from "@/components/feedback";
import { Icon } from "@/components/ui/icon";
import { AdminPageHeader, AdminTableContainer } from "@/components/admin";
import { useAdminList } from "@/lib/hooks";
import { downloadFile } from "@/lib/export";
import { toast } from "sonner";

// =====================================================
// Types
// =====================================================

interface MessageFilters {
  status: "" | ContactMessageStatus;
}

// =====================================================
// Status Badge Component
// =====================================================

function StatusBadge({ status }: { status: ContactMessageStatus }) {
  const variants: Record<
    ContactMessageStatus,
    { variant: "default" | "secondary" | "outline"; label: string }
  > = {
    PENDING: { variant: "secondary", label: "Pending" },
    READ: { variant: "outline", label: "Read" },
    REPLIED: { variant: "default", label: "Replied" },
  };

  const { variant, label } = variants[status];
  return <Badge variant={variant}>{label}</Badge>;
}

// =====================================================
// Message Row Component
// =====================================================

function MessageRow({
  message,
  onView,
  onUpdateStatus,
  onDelete,
  isUpdating,
}: {
  message: ContactMessage;
  onView: (message: ContactMessage) => void;
  onUpdateStatus: (id: string, status: ContactMessageStatus) => void;
  onDelete: (id: string) => void;
  isUpdating: boolean;
}) {
  return (
    <tr className="border-b hover:bg-muted/50">
      <td className="px-4 py-3">
        <div>
          <Text as="p" className="font-medium">{message.name}</Text>
          <Text variant="caption" color="muted">{message.email}</Text>
        </div>
      </td>
      <td className="px-4 py-3">
        <Text as="p" className="font-medium line-clamp-1">{message.subject}</Text>
        <Text variant="caption" color="muted" className="line-clamp-1">
          {message.message}
        </Text>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={message.status} />
      </td>
      <td className="px-4 py-3">
        <Text variant="caption" color="muted">
          {message.createdAt ? (
            <>
              {new Date(message.createdAt).toLocaleDateString()}{" "}
              {new Date(message.createdAt).toLocaleTimeString([], {
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
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(message)}
            disabled={isUpdating}
          >
            View
          </Button>
          {message.status === "PENDING" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onUpdateStatus(message.id, "READ")}
              disabled={isUpdating}
            >
              Mark Read
            </Button>
          )}
          {message.status === "READ" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onUpdateStatus(message.id, "REPLIED")}
              disabled={isUpdating}
            >
              Mark Replied
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(message.id)}
            disabled={isUpdating}
            className="text-destructive hover:text-destructive"
          >
            Delete
          </Button>
        </div>
      </td>
    </tr>
  );
}

// =====================================================
// View Message Modal
// =====================================================

function ViewMessageModal({
  message,
  onClose,
  onUpdateStatus,
  onDelete,
  isUpdating,
}: {
  message: ContactMessage;
  onClose: () => void;
  onUpdateStatus: (status: ContactMessageStatus) => void;
  onDelete: () => void;
  isUpdating: boolean;
}) {
  return (
    <Modal
      isOpen
      onClose={onClose}
      title={message.subject}
      size="lg"
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <Text variant="caption" color="muted">
              From: {message.name} ({message.email})
            </Text>
            <Text variant="caption" color="muted">
              Received: {message.createdAt ? new Date(message.createdAt).toLocaleString() : "-"}
            </Text>
          </div>
          <StatusBadge status={message.status} />
        </div>

        <div className="border-t border-b py-4">
          <Text className="whitespace-pre-wrap">{message.message}</Text>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            {message.status === "PENDING" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdateStatus("READ")}
                disabled={isUpdating}
              >
                Mark as Read
              </Button>
            )}
            {message.status !== "REPLIED" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdateStatus("REPLIED")}
                disabled={isUpdating}
              >
                Mark as Replied
              </Button>
            )}
            <a
              href={`mailto:${message.email}?subject=Re: ${encodeURIComponent(message.subject)}`}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Reply via Email
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              disabled={isUpdating}
            >
              Delete
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// =====================================================
// Delete Confirmation Modal
// =====================================================

function DeleteConfirmModal({
  onConfirm,
  onCancel,
  isDeleting,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}) {
  return (
    <Modal isOpen onClose={onCancel} title="Delete Message">
      <div className="space-y-4">
        <Text color="muted">
          Are you sure you want to delete this message? This action cannot be undone.
        </Text>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onCancel} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} isLoading={isDeleting}>
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// =====================================================
// Empty State Component
// =====================================================

function EmptyMessages() {
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
        <Icon name="Mail" size="lg" color="muted" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">No messages</h3>
      <Text color="muted">Contact form submissions will appear here.</Text>
    </div>
  );
}

// =====================================================
// Main Admin Messages Page
// =====================================================

export default function AdminMessagesPage() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [viewingMessage, setViewingMessage] = useState<ContactMessage | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await api.getContactUnreadCount();
      if (response.data) {
        setUnreadCount(response.data.count);
      }
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Use shared admin list hook
  const {
    items: messages,
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
  } = useAdminList<ContactMessage, MessageFilters>({
    fetchFn: async ({ page, limit, search, filters }) => {
      const response = await api.getContactMessages({
        page,
        limit,
        search: search || undefined,
        status: filters.status || undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      if (!response.data) {
        throw new Error("Failed to load messages");
      }

      return {
        items: response.data.items,
        pagination: response.data.pagination,
      };
    },
    initialFilters: { status: "" },
  });

  const handleUpdateStatus = async (id: string, status: ContactMessageStatus) => {
    try {
      setIsUpdating(true);
      await api.updateContactMessage(id, { status });
      toast.success(`Message marked as ${status.toLowerCase()}`);
      refetch(pagination?.page || 1);
      fetchUnreadCount();

      // Update viewing message if open
      if (viewingMessage?.id === id) {
        setViewingMessage({ ...viewingMessage, status });
      }
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to update message");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setIsUpdating(true);
      await api.deleteContactMessage(id);
      toast.success("Message deleted");
      setDeletingId(null);
      setViewingMessage(null);
      refetch(pagination?.page || 1);
      fetchUnreadCount();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to delete message");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleViewMessage = (message: ContactMessage) => {
    setViewingMessage(message);
    // Auto-mark as read when viewing
    if (message.status === "PENDING") {
      handleUpdateStatus(message.id, "READ");
    }
  };

  const statusFilterOptions = [
    { value: "", label: "All Status" },
    { value: "PENDING", label: "Pending" },
    { value: "READ", label: "Read" },
    { value: "REPLIED", label: "Replied" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        title={
          <>
            Contact Messages
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-2 align-middle">
                {unreadCount} new
              </Badge>
            )}
          </>
        }
        description="View and manage contact form submissions"
        exportConfig={{
          label: "Export",
          onExport: async () => {
            await downloadFile(api.getContactMessagesExportUrl());
          },
          successMessage: "Messages exported successfully",
        }}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <Input
            type="search"
            placeholder="Search by name, email, or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          options={statusFilterOptions}
          value={filters.status}
          onChange={(value) => setFilter("status", value as "" | ContactMessageStatus)}
          className="w-40"
        />
      </div>

      {/* Error Alert */}
      {error && <Alert variant="destructive">{error}</Alert>}

      {/* Messages Table */}
      <AdminTableContainer
        isLoading={isLoading}
        isEmpty={isEmpty}
        hasActiveFilters={hasActiveFilters}
        searchQuery={searchDebounced}
        onClearFilters={clearFilters}
        emptyState={{
          title: "No messages",
          description: "Contact form submissions will appear here.",
        }}
        pagination={pagination}
        onPageChange={handlePageChange}
        itemLabel="messages"
        skeletonRows={5}
        skeletonColumns={5}
      >
        {!isEmpty && !isLoading && (
          messages.length === 0 && !hasActiveFilters ? (
            <div className="p-6">
              <EmptyMessages />
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium">From</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Subject / Message</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Received</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((message) => (
                  <MessageRow
                    key={message.id}
                    message={message}
                    onView={handleViewMessage}
                    onUpdateStatus={handleUpdateStatus}
                    onDelete={(id) => setDeletingId(id)}
                    isUpdating={isUpdating}
                  />
                ))}
              </tbody>
            </table>
          )
        )}
      </AdminTableContainer>

      {/* View Message Modal */}
      {viewingMessage && (
        <ViewMessageModal
          message={viewingMessage}
          onClose={() => setViewingMessage(null)}
          onUpdateStatus={(status) => handleUpdateStatus(viewingMessage.id, status)}
          onDelete={() => setDeletingId(viewingMessage.id)}
          isUpdating={isUpdating}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <DeleteConfirmModal
          onConfirm={() => handleDelete(deletingId)}
          onCancel={() => setDeletingId(null)}
          isDeleting={isUpdating}
        />
      )}
    </div>
  );
}
