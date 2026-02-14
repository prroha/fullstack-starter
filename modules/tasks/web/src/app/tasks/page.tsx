"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Alert } from "@/components/feedback/alert";
import DashboardStats from "@/components/tasks/dashboard-stats";
import TaskCard from "@/components/tasks/task-card";
import { taskApi } from "@/lib/tasks/api";
import type { Task, DashboardStats as DashboardStatsType } from "@/lib/tasks/types";

// =============================================================================
// Page Component
// =============================================================================

export default function TasksDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStatsType | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, taskResult] = await Promise.all([
        taskApi.getStats(),
        taskApi.list({ page: 1, limit: 5 }),
      ]);
      setStats(statsData);
      setRecentTasks(taskResult.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Tasks
              </h1>
              <p className="mt-1 text-muted-foreground">
                Manage your projects and tasks
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => router.push("/tasks/board")}
              >
                Board View
              </Button>
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

        {/* Stats */}
        {stats && (
          <div className="mb-8">
            <DashboardStats stats={stats} />
          </div>
        )}

        {/* Quick Links */}
        <div className="mb-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Button
            variant="outline"
            className="justify-start"
            onClick={() => router.push("/tasks/list")}
          >
            All Tasks
          </Button>
          <Button
            variant="outline"
            className="justify-start"
            onClick={() => router.push("/tasks/board")}
          >
            Board View
          </Button>
          <Button
            variant="outline"
            className="justify-start"
            onClick={() => router.push("/tasks/projects")}
          >
            Projects
          </Button>
          <Button
            variant="outline"
            className="justify-start"
            onClick={() => router.push("/tasks/labels")}
          >
            Labels
          </Button>
          <Button
            variant="outline"
            className="justify-start"
            onClick={() => router.push("/tasks/settings")}
          >
            Settings
          </Button>
        </div>

        {/* Recent Tasks */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Recent Tasks
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/tasks/list")}
            >
              View All
            </Button>
          </div>

          {recentTasks.length > 0 ? (
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => router.push(`/tasks/${task.id}`)}
                />
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-muted-foreground">
              No tasks yet. Create your first task to get started.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
