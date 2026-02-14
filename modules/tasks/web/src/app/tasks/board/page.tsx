"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Alert } from "@/components/feedback/alert";
import { EmptyState } from "@/components/shared/empty-state";
import TaskBoardView from "@/components/tasks/task-board-view";
import { taskApi, projectApi } from "@/lib/tasks/api";
import type { Task, TaskProject } from "@/lib/tasks/types";

// =============================================================================
// Page Component
// =============================================================================

export default function TaskBoardPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<TaskProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [taskResult, projectList] = await Promise.all([
        taskApi.list({
          projectId: projectFilter || undefined,
          limit: 100,
          showCompleted: true,
        }),
        projectApi.list(),
      ]);
      setTasks(taskResult.items);
      setProjects(projectList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load board");
    } finally {
      setLoading(false);
    }
  }, [projectFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const projectOptions = [
    { value: "", label: "All Projects" },
    ...projects.map((p) => ({ value: p.id, label: p.name })),
  ];

  const handleTaskClick = (task: Task) => {
    router.push(`/tasks/${task.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Board
              </h1>
              <p className="mt-1 text-muted-foreground">
                Kanban view of your tasks
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-48">
                <Select
                  value={projectFilter}
                  onChange={setProjectFilter}
                  options={projectOptions}
                />
              </div>
              <Button onClick={() => router.push("/tasks/new")}>
                New Task
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            {error}
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState
            title="No tasks yet"
            description="Create a task to see it on the board."
            action={{
              label: "New Task",
              onClick: () => router.push("/tasks/new"),
            }}
          />
        ) : (
          <TaskBoardView tasks={tasks} onTaskClick={handleTaskClick} />
        )}
      </div>
    </div>
  );
}
