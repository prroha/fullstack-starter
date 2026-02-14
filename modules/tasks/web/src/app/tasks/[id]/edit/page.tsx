"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Alert } from "@/components/feedback/alert";
import { Button } from "@/components/ui/button";
import TaskForm from "@/components/tasks/task-form";
import { taskApi } from "@/lib/tasks/api";
import type { Task, TaskUpdateInput } from "@/lib/tasks/types";

// =============================================================================
// Page Component
// =============================================================================

export default function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTask = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await taskApi.getById(id);
      setTask(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load task");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  const handleSubmit = async (data: TaskUpdateInput) => {
    await taskApi.update(id, data as TaskUpdateInput);
    router.push(`/tasks/${id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error && !task) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-3xl">
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

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: "Tasks", href: "/tasks" },
            { label: task.title, href: `/tasks/${id}` },
            { label: "Edit" },
          ]}
        />

        <h1 className="mt-6 text-2xl font-bold text-foreground">
          Edit Task
        </h1>
        <p className="mt-1 text-muted-foreground">
          Update task details
        </p>

        <div className="mt-8 rounded-lg border border-border bg-card p-6">
          <TaskForm
            task={task}
            onSubmit={handleSubmit}
            onCancel={() => router.push(`/tasks/${id}`)}
          />
        </div>
      </div>
    </div>
  );
}
