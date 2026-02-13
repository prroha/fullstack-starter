"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/feedback/alert";

interface ScheduleOverrideFormProps {
  onSubmit: (data: {
    date: string;
    isBlocked: boolean;
    startTime?: string;
    endTime?: string;
    reason?: string;
  }) => Promise<void>;
  onCancel: () => void;
}

export default function ScheduleOverrideForm({
  onSubmit,
  onCancel,
}: ScheduleOverrideFormProps) {
  const [date, setDate] = useState("");
  const [isBlocked, setIsBlocked] = useState(false);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!date) {
      setError("Please select a date.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        date,
        isBlocked,
        startTime: isBlocked ? undefined : startTime,
        endTime: isBlocked ? undefined : endTime,
        reason: reason.trim() || undefined,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create override."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive" title="Error" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="override-date" required>
          Date
        </Label>
        <Input
          id="override-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <div>
        <Switch
          checked={isBlocked}
          onChange={setIsBlocked}
          label="Block entire day"
        />
      </div>

      {!isBlocked && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="override-start">Start Time</Label>
            <Input
              id="override-start"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="override-end">End Time</Label>
            <Input
              id="override-end"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="override-reason">Reason</Label>
        <Textarea
          id="override-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Optional reason for this schedule change"
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} isLoading={isSubmitting}>
          Save Override
        </Button>
      </div>
    </div>
  );
}
