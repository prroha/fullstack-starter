"use client";

import { useState, useEffect, useCallback } from "react";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Alert } from "@/components/feedback/alert";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { settingsApi, projectApi } from "@/lib/tasks/api";
import { TASK_VIEW_OPTIONS } from "@/lib/tasks/constants";
import type { TaskSettings as TaskSettingsType, TaskProject } from "@/lib/tasks/types";

// =============================================================================
// Page Component
// =============================================================================

export default function TaskSettingsPage() {
  const [projects, setProjects] = useState<TaskProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Settings fields
  const [defaultView, setDefaultView] = useState("LIST");
  const [defaultProjectId, setDefaultProjectId] = useState("");
  const [showCompletedTasks, setShowCompletedTasks] = useState(true);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [settingsData, projectData] = await Promise.all([
        settingsApi.get(),
        projectApi.list(),
      ]);
      setProjects(projectData);

      // Populate fields
      setDefaultView(settingsData.defaultView);
      setDefaultProjectId(settingsData.defaultProjectId ?? "");
      setShowCompletedTasks(settingsData.showCompletedTasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ---------------------------------------------------------------------------
  // Save handler
  // ---------------------------------------------------------------------------

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await settingsApi.update({
        defaultView: defaultView as TaskSettingsType["defaultView"],
        defaultProjectId: defaultProjectId || undefined,
        showCompletedTasks,
      });
      setSuccess("Settings saved successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
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
  // Render
  // ---------------------------------------------------------------------------

  const projectOptions = [
    { value: "", label: "No default project" },
    ...projects.map((p) => ({ value: p.id, label: p.name })),
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: "Tasks", href: "/tasks" },
            { label: "Settings" },
          ]}
        />

        <h1 className="mt-6 text-2xl font-bold text-foreground">
          Task Settings
        </h1>
        <p className="mt-1 text-muted-foreground">
          Configure your task management preferences
        </p>

        <div className="mt-8 space-y-8">
          {error && (
            <Alert variant="destructive" onDismiss={() => setError(null)}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert variant="success" onDismiss={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          {/* Default View */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              Display Preferences
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="defaultView">Default View</Label>
                <Select
                  value={defaultView}
                  onChange={setDefaultView}
                  options={TASK_VIEW_OPTIONS}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultProject">Default Project</Label>
                <Select
                  value={defaultProjectId}
                  onChange={setDefaultProjectId}
                  options={projectOptions}
                />
              </div>
            </div>
          </div>

          {/* Show completed tasks */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              Task Display
            </h2>

            <div className="flex items-end">
              <Button
                variant={showCompletedTasks ? "secondary" : "outline"}
                onClick={() => setShowCompletedTasks(!showCompletedTasks)}
                type="button"
              >
                {showCompletedTasks
                  ? "Show Completed: Enabled"
                  : "Show Completed: Disabled"}
              </Button>
            </div>
          </div>

          <Button onClick={handleSave} isLoading={isSaving}>
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
