"use client";

import { useRouter } from "next/navigation";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import TaskForm from "@/components/tasks/task-form";
import { taskApi } from "@/lib/tasks/api";
import type { TaskCreateInput } from "@/lib/tasks/types";

// =============================================================================
// Page Component
// =============================================================================

export default function NewTaskPage() {
  const router = useRouter();

  const handleSubmit = async (data: TaskCreateInput) => {
    const task = await taskApi.create(data as TaskCreateInput);
    router.push(`/tasks/${task.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: "Tasks", href: "/tasks" },
            { label: "New Task" },
          ]}
        />

        <h1 className="mt-6 text-2xl font-bold text-foreground">
          New Task
        </h1>
        <p className="mt-1 text-muted-foreground">
          Create a new task
        </p>

        <div className="mt-8 rounded-lg border border-border bg-card p-6">
          <TaskForm
            onSubmit={handleSubmit}
            onCancel={() => router.push("/tasks/list")}
          />
        </div>
      </div>
    </div>
  );
}
