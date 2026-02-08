"use client";

import { useEffect, useState, useCallback } from "react";
import { api, ApiError, ContactMessage, ContactMessageStatus } from "@/lib/api";
import { Button, Input, Badge, SkeletonTable, Text } from "@/components/ui";
import { Alert } from "@/components/feedback";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
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
          {new Date(message.createdAt).toLocaleDateString()}{" "}
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
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
// Pagination Component
// =====================================================

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
      <Text variant="caption" color="muted">
        Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
        {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
        {pagination.total} messages
      </Text>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-2xl rounded-lg border bg-background p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">{message.subject}</h2>
            <Text variant="caption" color="muted">
              From: {message.name} ({message.email})
            </Text>
            <Text variant="caption" color="muted">
              Received: {new Date(message.createdAt).toLocaleString()}
            </Text>
          </div>
          <StatusBadge status={message.status} />
        </div>

        <div className="border-t border-b py-4 my-4">
          <Text className="whitespace-pre-wrap">{message.message}</Text>
        </div>

        <div className="flex items-center justify-between">
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
              href={`mailto:${message.email}?subject=Re: ${encodeURIComponent(
                message.subject
              )}`}
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
    </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-md rounded-lg border bg-background p-6 shadow-lg">
        <h2 className="text-lg font-semibold mb-2">Delete Message</h2>
        <Text color="muted" className="mb-6">
          Are you sure you want to delete this message? This action cannot be
          undone.
        </Text>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            isLoading={isDeleting}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
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
      <Text color="muted">
        Contact form submissions will appear here.
      </Text>
    </div>
  );
}

// =====================================================
// Main Admin Messages Page
// =====================================================

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | ContactMessageStatus>(
    ""
  );
  const [viewingMessage, setViewingMessage] = useState<ContactMessage | null>(
    null
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

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

  const fetchMessages = useCallback(
    async (page = 1) => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await api.getContactMessages({
          page,
          limit: 10,
          search: searchDebounced || undefined,
          status: statusFilter || undefined,
          sortBy: "createdAt",
          sortOrder: "desc",
        });

        if (response.data) {
          setMessages(response.data.items);
          setPagination(response.data.pagination);
        }
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Failed to load messages");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [searchDebounced, statusFilter]
  );

  useEffect(() => {
    fetchMessages();
    fetchUnreadCount();
  }, [fetchMessages, fetchUnreadCount]);

  const handlePageChange = (page: number) => {
    fetchMessages(page);
  };

  const handleUpdateStatus = async (id: string, status: ContactMessageStatus) => {
    try {
      setIsUpdating(true);
      await api.updateContactMessage(id, { status });
      toast.success(`Message marked as ${status.toLowerCase()}`);
      fetchMessages(pagination?.page || 1);
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
      fetchMessages(pagination?.page || 1);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Contact Messages
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-2 align-middle">
                {unreadCount} new
              </Badge>
            )}
          </h1>
          <Text color="muted">
            View and manage contact form submissions
          </Text>
        </div>
      </div>

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
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "" | ContactMessageStatus)
          }
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="READ">Read</option>
          <option value="REPLIED">Replied</option>
        </select>
      </div>

      {/* Error Alert */}
      {error && <Alert variant="destructive">{error}</Alert>}

      {/* Messages Table */}
      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="p-6">
            <SkeletonTable rows={5} columns={5} />
          </div>
        ) : messages.length === 0 ? (
          <div className="p-6">
            <EmptyMessages />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    From
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Subject / Message
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Received
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Actions
                  </th>
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

      {/* View Message Modal */}
      {viewingMessage && (
        <ViewMessageModal
          message={viewingMessage}
          onClose={() => setViewingMessage(null)}
          onUpdateStatus={(status) =>
            handleUpdateStatus(viewingMessage.id, status)
          }
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
