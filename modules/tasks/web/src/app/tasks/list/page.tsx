"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Select } from "@/components/ui/select";
import { SearchInput } from "@/components/ui/search-input";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { Alert } from "@/components/feedback/alert";
import TaskCard from "@/components/tasks/task-card";
import { taskApi } from "@/lib/tasks/api";
import { TASK_STATUS_OPTIONS, TASK_PRIORITY_OPTIONS } from "@/lib/tasks/constants";
import type { Task, TaskStatus, TaskPriority } from "@/lib/tasks/types";

const PAGE_SIZE = 12;

// =============================================================================
// Page Component
// =============================================================================

export default function TaskListPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await taskApi.list({
        search: search || undefined,
        status: (statusFilter || undefined) as TaskStatus | undefined,
        priority: (priorityFilter || undefined) as TaskPriority | undefined,
        page,
        limit: PAGE_SIZE,
      });
      setTasks(result.items);
      setTotalPages(result.pagination.totalPages);
      setTotal(result.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, priorityFilter, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const statusOptions = [
    { value: "", label: "All Statuses" },
    ...TASK_STATUS_OPTIONS,
  ];

  const priorityOptions = [
    { value: "", label: "All Priorities" },
    ...TASK_PRIORITY_OPTIONS,
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                All Tasks
              </h1>
              <p className="mt-1 text-muted-foreground">
                View and manage all your tasks
              </p>
            </div>
            <Button onClick={() => router.push("/tasks/new")}>
              New Task
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={handleSearch}
              placeholder="Search tasks..."
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={statusFilter}
              onChange={(v) => { setStatusFilter(v); setPage(1); }}
              options={statusOptions}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={priorityFilter}
              onChange={(v) => { setPriorityFilter(v); setPage(1); }}
              options={priorityOptions}
            />
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center">
            <Alert variant="destructive">{error}</Alert>
            <Button onClick={fetchData} className="mt-4">
              Try Again
            </Button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && tasks.length === 0 && (
          <EmptyState
            title="No tasks found"
            description={
              search || statusFilter || priorityFilter
                ? "Try adjusting your search or filters."
                : "Create your first task to get started."
            }
            action={
              !search && !statusFilter && !priorityFilter
                ? {
                    label: "Create Task",
                    onClick: () => router.push("/tasks/new"),
                  }
                : undefined
            }
          />
        )}

        {/* Task list */}
        {!loading && !error && tasks.length > 0 && (
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => router.push(`/tasks/${task.id}`)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-8">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalItems={total}
              pageSize={PAGE_SIZE}
              showItemCount
            />
          </div>
        )}
      </div>
    </div>
  );
}
