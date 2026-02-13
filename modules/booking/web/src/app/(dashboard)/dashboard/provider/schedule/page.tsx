"use client";

import { useState, useEffect, useCallback } from "react";
import { scheduleApi } from "@/lib/booking/api";
import type { Schedule, ScheduleInput, ScheduleOverride } from "@/lib/booking/types";
import { formatDate, formatTimeRange } from "@/lib/booking/formatters";
import ScheduleEditor from "@/components/booking/schedule-editor";
import ScheduleOverrideForm from "@/components/booking/schedule-override-form";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Alert } from "@/components/feedback/alert";
import { Badge } from "@/components/ui/badge";
import { ConfirmButton } from "@/components/ui/confirm-button";

// =============================================================================
// Provider Schedule Management Page
// =============================================================================

export default function ProviderSchedulePage() {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [overrides, setOverrides] = useState<ScheduleOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // We need the provider ID for schedule API calls.
  // In a real app this would come from auth context or session.
  // For this module we derive it from the schedule endpoint that returns the
  // current provider's schedule (providers/me pattern).
  const [providerId, setProviderId] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------------------------

  const fetchScheduleData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // The schedule API uses providerId; the providerDashboard getStats
      // could provide it. For this page we assume a "me" endpoint that
      // the scheduleApi.getWeekly("me") resolves server-side.
      const myProviderId = "me";
      setProviderId(myProviderId);

      const [scheduleData, overrideData] = await Promise.all([
        scheduleApi.getWeekly(myProviderId),
        scheduleApi.listOverrides(myProviderId),
      ]);

      setSchedules(scheduleData);
      setOverrides(overrideData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load schedule"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScheduleData();
  }, [fetchScheduleData]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleSaveSchedule = async (input: ScheduleInput[]) => {
    if (!providerId) return;
    await scheduleApi.updateWeekly(providerId, input);
    // Refresh data after save (ScheduleEditor handles its own success/error alerts)
    const updatedSchedules = await scheduleApi.getWeekly(providerId);
    setSchedules(updatedSchedules);
  };

  const handleCreateOverride = async (data: {
    date: string;
    isBlocked: boolean;
    startTime?: string;
    endTime?: string;
    reason?: string;
  }) => {
    if (!providerId) return;
    await scheduleApi.createOverride(providerId, data);
    setShowOverrideForm(false);
    setFeedbackMessage({ type: "success", text: "Schedule override added successfully." });
    // Refresh overrides
    const updatedOverrides = await scheduleApi.listOverrides(providerId);
    setOverrides(updatedOverrides);
  };

  const handleDeleteOverride = async (overrideId: string) => {
    if (!providerId) return;
    setDeleteLoading(overrideId);
    setFeedbackMessage(null);
    try {
      await scheduleApi.deleteOverride(providerId, overrideId);
      setFeedbackMessage({ type: "success", text: "Override removed." });
      const updatedOverrides = await scheduleApi.listOverrides(providerId);
      setOverrides(updatedOverrides);
    } catch (err) {
      setFeedbackMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to delete override.",
      });
    } finally {
      setDeleteLoading(null);
    }
  };

  // ---------------------------------------------------------------------------
  // Loading State
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Error State
  // ---------------------------------------------------------------------------

  if (error) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <Alert variant="destructive" title="Error">
          <p className="mt-1">{error}</p>
          <Button
            variant="outline"
            onClick={fetchScheduleData}
            className="mt-3"
          >
            Try Again
          </Button>
        </Alert>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Manage Schedule
        </h1>
        <p className="mt-1 text-muted-foreground">
          Set your weekly availability and manage schedule overrides.
        </p>
      </div>

      {/* Feedback Message */}
      {feedbackMessage && (
        <div className="mb-6">
          <Alert
            variant={feedbackMessage.type === "success" ? "success" : "destructive"}
            title={feedbackMessage.type === "success" ? "Success" : "Error"}
            onDismiss={() => setFeedbackMessage(null)}
          >
            {feedbackMessage.text}
          </Alert>
        </div>
      )}

      {/* Section 1: Weekly Schedule */}
      <div className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Weekly Schedule
        </h2>
        <ScheduleEditor schedules={schedules} onSave={handleSaveSchedule} />
      </div>

      {/* Section 2: Schedule Overrides */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            Schedule Overrides
          </h2>
          {!showOverrideForm && (
            <Button size="sm" onClick={() => setShowOverrideForm(true)}>
              Add Override
            </Button>
          )}
        </div>

        {/* Override Form */}
        {showOverrideForm && (
          <div className="mb-6 rounded-lg border border-border bg-card p-6">
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              New Schedule Override
            </h3>
            <ScheduleOverrideForm
              onSubmit={handleCreateOverride}
              onCancel={() => setShowOverrideForm(false)}
            />
          </div>
        )}

        {/* Overrides List */}
        {overrides.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground">
              No schedule overrides set. Use overrides to block specific days or
              change hours for individual dates.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {overrides.map((override) => (
              <div
                key={override.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-5 py-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground">
                      {formatDate(override.date)}
                    </span>
                    <Badge
                      variant={override.isBlocked ? "destructive" : "secondary"}
                      size="sm"
                    >
                      {override.isBlocked ? "Blocked" : "Custom Hours"}
                    </Badge>
                  </div>

                  {!override.isBlocked && override.startTime && override.endTime && (
                    <p className="text-sm text-muted-foreground">
                      {formatTimeRange(override.startTime, override.endTime)}
                    </p>
                  )}

                  {override.reason && (
                    <p className="text-xs text-muted-foreground">
                      {override.reason}
                    </p>
                  )}
                </div>

                <ConfirmButton
                  confirmMode="dialog"
                  confirmTitle="Delete Override"
                  confirmMessage={`Remove the schedule override for ${formatDate(override.date)}?`}
                  onConfirm={() => handleDeleteOverride(override.id)}
                  variant="outline"
                  size="sm"
                  isLoading={deleteLoading === override.id}
                >
                  Remove
                </ConfirmButton>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
