"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Select } from "@/components/ui/select";
import { SearchInput } from "@/components/ui/search-input";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { EmptyState } from "@/components/shared/empty-state";
import { Alert } from "@/components/feedback/alert";
import { StatCard } from "@/components/ui/stat-card";
import TaskCard from "@/components/tasks/task-card";
import { projectApi, taskApi } from "@/lib/tasks/api";
import { TASK_STATUS_OPTIONS } from "@/lib/tasks/constants";
import type { TaskProject, ProjectStats, Task, TaskStatus } from "@/lib/tasks/types";

// =============================================================================
// Page Component
// =============================================================================

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [project, setProject] = useState<TaskProject | null>(null);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [projectData, statsData, taskResult] = await Promise.all([
        projectApi.getById(id),
        projectApi.getStats(id),
        taskApi.list({
          projectId: id,
          status: (statusFilter || undefined) as TaskStatus | undefined,
          search: search || undefined,
          limit: 50,
        }),
      ]);

      setProject(projectData);
      setStats(statsData);
      setTasks(taskResult.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load project");
    } finally {
      setLoading(false);
    }
  }, [id, statusFilter, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ---------------------------------------------------------------------------
  // Action handlers
  // ---------------------------------------------------------------------------

  const handleDelete = async () => {
    try {
      await projectApi.delete(id);
      router.push("/tasks/projects");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete project");
    }
  };

  const handleArchiveToggle = async () => {
    if (!project) return;
    try {
      const updated = project.isArchived
        ? await projectApi.unarchive(id)
        : await projectApi.archive(id);
      setProject(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update project");
    }
  };

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (loading && !project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-4xl">
          <Alert variant="destructive" title="Error loading project">
            <p className="mt-1">{error}</p>
            <div className="mt-3 flex items-center gap-3">
              <Button onClick={fetchData}>Retry</Button>
              <Button
                variant="outline"
                onClick={() => router.push("/tasks/projects")}
              >
                Back to Projects
              </Button>
            </div>
          </Alert>
        </div>
      </div>
    );
  }

  if (!project) return null;

  const statusOptions = [
    { value: "", label: "All Statuses" },
    ...TASK_STATUS_OPTIONS,
  ];

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
              { label: "Projects", href: "/tasks/projects" },
              { label: project.name },
            ]}
            className="mb-4"
          />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span
                className="inline-block h-4 w-4 rounded-full"
                style={{ backgroundColor: project.color }}
              />
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {project.name}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleArchiveToggle}
              >
                {project.isArchived ? "Unarchive" : "Archive"}
              </Button>
              <ConfirmButton
                confirmMode="dialog"
                confirmTitle="Delete Project"
                confirmMessage={`Are you sure you want to delete "${project.name}"? Tasks in this project will become unassigned.`}
                confirmLabel="Delete"
                onConfirm={handleDelete}
                variant="destructive"
                size="sm"
              >
                Delete
              </ConfirmButton>
            </div>
          </div>

          {project.description && (
            <p className="mt-2 text-muted-foreground">{project.description}</p>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <Alert variant="destructive" onDismiss={() => setError(null)} className="mb-6">
            {error}
          </Alert>
        )}

        {/* Stats */}
        {stats && (
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total" value={stats.totalTasks} />
            <StatCard label="To Do" value={stats.todoTasks} variant="warning" />
            <StatCard label="In Progress" value={stats.inProgressTasks} />
            <StatCard label="Done" value={stats.doneTasks} variant="success" />
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search tasks in this project..."
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
            />
          </div>
          <Button onClick={() => router.push("/tasks/new")}>
            New Task
          </Button>
        </div>

        {/* Tasks */}
        {tasks.length === 0 ? (
          <EmptyState
            title="No tasks in this project"
            description="Create a task and assign it to this project."
            action={{
              label: "New Task",
              onClick: () => router.push("/tasks/new"),
            }}
          />
        ) : (
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
      </div>
    </div>
  );
}
