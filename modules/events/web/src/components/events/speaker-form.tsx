"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/feedback/alert";
import type {
  EventSpeaker,
  SpeakerCreateInput,
  SpeakerUpdateInput,
} from "@/lib/events/types";

// =============================================================================
// Props
// =============================================================================

interface SpeakerFormProps {
  speaker?: EventSpeaker;
  onSubmit: (data: SpeakerCreateInput | SpeakerUpdateInput) => Promise<void>;
  onCancel?: () => void;
}

// =============================================================================
// Component
// =============================================================================

export default function SpeakerForm({ speaker, onSubmit, onCancel }: SpeakerFormProps) {
  const [name, setName] = useState(speaker?.name ?? "");
  const [email, setEmail] = useState(speaker?.email ?? "");
  const [title, setTitle] = useState(speaker?.title ?? "");
  const [company, setCompany] = useState(speaker?.company ?? "");
  const [bio, setBio] = useState(speaker?.bio ?? "");
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
        email: email.trim() || undefined,
        title: title.trim() || undefined,
        company: company.trim() || undefined,
        bio: bio.trim() || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save speaker");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="speakerName">Name</Label>
        <Input
          id="speakerName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Speaker name"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="speakerEmail">Email</Label>
          <Input
            id="speakerEmail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="speaker@example.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="speakerTitle">Title</Label>
          <Input
            id="speakerTitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. CTO, Lead Engineer"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="speakerCompany">Company</Label>
        <Input
          id="speakerCompany"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Company name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="speakerBio">Bio</Label>
        <Textarea
          id="speakerBio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Brief speaker biography..."
          rows={3}
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" isLoading={isSaving}>
          {speaker ? "Update Speaker" : "Add Speaker"}
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
