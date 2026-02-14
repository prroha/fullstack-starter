"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/feedback/alert";
import { TICKET_PRIORITY_OPTIONS } from "@/lib/helpdesk/constants";
import type {
  SlaPolicy,
  SlaPolicyCreateInput,
  SlaPolicyUpdateInput,
} from "@/lib/helpdesk/types";

// =============================================================================
// Props
// =============================================================================

interface SlaFormProps {
  sla?: SlaPolicy;
  onSubmit: (data: SlaPolicyCreateInput | SlaPolicyUpdateInput) => Promise<void>;
  onCancel?: () => void;
}

// =============================================================================
// Component
// =============================================================================

export default function SlaForm({ sla, onSubmit, onCancel }: SlaFormProps) {
  const [name, setName] = useState(sla?.name ?? "");
  const [priority, setPriority] = useState(sla?.priority ?? "MEDIUM");
  const [firstResponseMinutes, setFirstResponseMinutes] = useState(
    sla?.firstResponseMinutes?.toString() ?? "240"
  );
  const [resolutionMinutes, setResolutionMinutes] = useState(
    sla?.resolutionMinutes?.toString() ?? "1440"
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    setError(null);

    try {
      await onSubmit({
        name: name.trim(),
        priority: priority as SlaPolicyCreateInput["priority"],
        firstResponseMinutes: parseInt(firstResponseMinutes, 10) || 240,
        resolutionMinutes: parseInt(resolutionMinutes, 10) || 1440,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save SLA policy");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="slaName">Policy Name</Label>
          <Input
            id="slaName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Urgent Response"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slaPriority">Priority</Label>
          <Select
            value={priority}
            onChange={setPriority}
            options={TICKET_PRIORITY_OPTIONS}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="slaFirstResponse">First Response (minutes)</Label>
          <Input
            id="slaFirstResponse"
            type="number"
            min="1"
            value={firstResponseMinutes}
            onChange={(e) => setFirstResponseMinutes(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slaResolution">Resolution Target (minutes)</Label>
          <Input
            id="slaResolution"
            type="number"
            min="1"
            value={resolutionMinutes}
            onChange={(e) => setResolutionMinutes(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" isLoading={isSaving}>
          {sla ? "Update Policy" : "Add Policy"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
