"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/feedback/alert";
import TaskStatusBadge from "@/components/tasks/task-status-badge";
import TaskPriorityBadge from "@/components/tasks/task-priority-badge";
import TaskCommentList from "@/components/tasks/task-comment-list";
import { taskApi, commentApi } from "@/lib/tasks/api";
import { formatDate, formatDueDate } from "@/lib/tasks/formatters";
import { TASK_STATUS_OPTIONS, TASK_PRIORITY_OPTIONS } from "@/lib/tasks/constants";
import type { Task, TaskComment } from "@/lib/tasks/types";

// =============================================================================
// Page Component
// =============================================================================

export default function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchTask = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [taskData, commentsData] = await Promise.all([
        taskApi.getById(id),
        taskApi.getComments(id),
      ]);

      setTask(taskData);
      setComments(commentsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load task");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  // ---------------------------------------------------------------------------
  // Action handlers
  // ---------------------------------------------------------------------------

  const handleStatusChange = async (status: string) => {
    try {
      setActionLoading("status");
      const updated = await taskApi.changeStatus(id, status);
      setTask(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    try {
      setActionLoading("delete");
      await taskApi.delete(id);
      router.push("/tasks/list");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task");
      setActionLoading(null);
    }
  };

  const handleAddComment = async (content: string) => {
    await taskApi.addComment(id, { content });
    const updated = await taskApi.getComments(id);
    setComments(updated);
  };

  const handleUpdateComment = async (commentId: string, content: string) => {
    await commentApi.update(commentId, { content });
    const updated = await taskApi.getComments(id);
    setComments(updated);
  };

  const handleDeleteComment = async (commentId: string) => {
    await commentApi.delete(commentId);
    const updated = await taskApi.getComments(id);
    setComments(updated);
  };

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Error state (blocking)
  // ---------------------------------------------------------------------------

  if (error && !task) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-4xl">
          <Alert variant="destructive" title="Error loading task">
            <p className="mt-1">{error}</p>
            <div className="mt-3 flex items-center gap-3">
              <Button onClick={fetchTask}>Retry</Button>
              <Button
                variant="outline"
                onClick={() => router.push("/tasks/list")}
              >
                Back to Tasks
              </Button>
            </div>
          </Alert>
        </div>
      </div>
    );
  }

  if (!task) return null;

  const dueInfo = task.dueDate ? formatDueDate(task.dueDate) : null;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumb
            items={[
              { label: "Tasks", href: "/tasks" },
              { label: "All Tasks", href: "/tasks/list" },
              { label: task.title },
            ]}
            className="mb-4"
          />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  {task.title}
                </h1>
                <TaskStatusBadge status={task.status} />
                <TaskPriorityBadge priority={task.priority} />
              </div>
              {task.project && (
                <p className="mt-1 text-muted-foreground">
                  in {task.project.name}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/tasks/${id}/edit`)}
              >
                Edit
              </Button>
              <ConfirmButton
                confirmMode="dialog"
                confirmTitle="Delete Task"
                confirmMessage="Are you sure you want to delete this task? This action cannot be undone."
                confirmLabel="Delete"
                onConfirm={handleDelete}
                variant="destructive"
                size="sm"
                disabled={actionLoading === "delete"}
              >
                Delete
              </ConfirmButton>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Non-blocking error banner */}
        {error && (
          <Alert variant="destructive" onDismiss={() => setError(null)} className="mb-6">
            {error}
          </Alert>
        )}

        {/* Two-column layout */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content (left) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {task.description && (
              <div className="rounded-lg border border-border bg-card p-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  Description
                </h3>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {task.description}
                </p>
              </div>
            )}

            {/* Comments */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Comments ({comments.length})
              </h3>
              <TaskCommentList
                comments={comments}
                onAdd={handleAddComment}
                onUpdate={handleUpdateComment}
                onDelete={handleDeleteComment}
              />
            </div>
          </div>

          {/* Sidebar (right) */}
          <div className="lg:col-span-1 space-y-6">
            {/* Status change */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                Properties
              </h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Select
                    value={task.status}
                    onChange={handleStatusChange}
                    options={TASK_STATUS_OPTIONS}
                  />
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Priority</p>
                  <TaskPriorityBadge priority={task.priority} />
                </div>

                {dueInfo && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Due Date</p>
                    <p className={cn("text-sm font-medium", dueInfo.isOverdue ? "text-destructive" : "text-foreground")}>
                      {dueInfo.text}
                    </p>
                  </div>
                )}

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="text-sm font-medium text-foreground">
                    {formatDate(task.createdAt)}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-sm font-medium text-foreground">
                    {formatDate(task.updatedAt)}
                  </p>
                </div>

                {task.completedAt && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-sm font-medium text-foreground">
                      {formatDate(task.completedAt)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Labels */}
            {task.labels && task.labels.length > 0 && (
              <div className="rounded-lg border border-border bg-card p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                  Labels
                </h3>
                <div className="flex flex-wrap gap-2">
                  {task.labels.map((link) =>
                    link.label ? (
                      <Badge key={link.id} variant="outline">
                        <span
                          className="mr-1.5 inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: link.label.color }}
                        />
                        {link.label.name}
                      </Badge>
                    ) : null
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
