"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/feedback/alert";
import type { Schedule, ScheduleInput } from "@/lib/booking/types";
import { getDayName } from "@/lib/booking/formatters";

interface ScheduleEditorProps {
  schedules: Schedule[];
  onSave: (schedules: ScheduleInput[]) => Promise<void>;
}

interface DaySchedule {
  dayOfWeek: number;
  isActive: boolean;
  startTime: string;
  endTime: string;
}

// Days ordered Monday (1) through Sunday (0)
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

function buildInitialState(schedules: Schedule[]): DaySchedule[] {
  return DAY_ORDER.map((dayOfWeek) => {
    const existing = schedules.find((s) => s.dayOfWeek === dayOfWeek);
    return {
      dayOfWeek,
      isActive: existing?.isActive ?? false,
      startTime: existing?.startTime ?? "09:00",
      endTime: existing?.endTime ?? "17:00",
    };
  });
}

export default function ScheduleEditor({
  schedules,
  onSave,
}: ScheduleEditorProps) {
  const [days, setDays] = useState<DaySchedule[]>(() =>
    buildInitialState(schedules)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const updateDay = useCallback(
    (dayOfWeek: number, updates: Partial<DaySchedule>) => {
      setDays((prev) =>
        prev.map((d) =>
          d.dayOfWeek === dayOfWeek ? { ...d, ...updates } : d
        )
      );
    },
    []
  );

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const input: ScheduleInput[] = days.map((d) => ({
        dayOfWeek: d.dayOfWeek,
        startTime: d.startTime,
        endTime: d.endTime,
        isActive: d.isActive,
      }));
      await onSave(input);
      setSuccess("Schedule saved successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save schedule."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive" title="Error" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" title="Success" onDismiss={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Card>
        <CardContent className="space-y-4 p-6">
          {days.map((day) => (
            <div
              key={day.dayOfWeek}
              className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 py-3 border-b border-border last:border-b-0"
            >
              <div className="w-28 shrink-0">
                <Label className="text-sm font-medium text-foreground">
                  {getDayName(day.dayOfWeek)}
                </Label>
              </div>

              <Switch
                checked={day.isActive}
                onChange={(checked) =>
                  updateDay(day.dayOfWeek, { isActive: checked })
                }
                label={day.isActive ? "Open" : "Closed"}
                size="sm"
              />

              {day.isActive && (
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={day.startTime}
                    onChange={(e) =>
                      updateDay(day.dayOfWeek, { startTime: e.target.value })
                    }
                    className="w-32"
                    aria-label={`Start time for ${getDayName(day.dayOfWeek)}`}
                  />
                  <span className="text-muted-foreground text-sm">to</span>
                  <Input
                    type="time"
                    value={day.endTime}
                    onChange={(e) =>
                      updateDay(day.dayOfWeek, { endTime: e.target.value })
                    }
                    className="w-32"
                    aria-label={`End time for ${getDayName(day.dayOfWeek)}`}
                  />
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} isLoading={isSaving}>
          Save Schedule
        </Button>
      </div>
    </div>
  );
}
