"use client";

import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/feedback/alert";
import { cannedResponseApi } from "@/lib/helpdesk/api";
import type { CannedResponse, MessageCreateInput } from "@/lib/helpdesk/types";

// =============================================================================
// Props
// =============================================================================

interface TicketMessageFormProps {
  onSubmit: (data: MessageCreateInput) => Promise<void>;
  senderType?: "customer" | "agent";
}

// =============================================================================
// Component
// =============================================================================

export default function TicketMessageForm({
  onSubmit,
  senderType = "agent",
}: TicketMessageFormProps) {
  const [body, setBody] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cannedResponses, setCannedResponses] = useState<CannedResponse[]>([]);
  const [selectedCanned, setSelectedCanned] = useState("");

  useEffect(() => {
    if (senderType === "agent") {
      cannedResponseApi.getMine().then((res) => setCannedResponses(res.items)).catch(() => {});
    }
  }, [senderType]);

  const handleCannedSelect = (value: string) => {
    setSelectedCanned(value);
    if (value) {
      const response = cannedResponses.find((r) => r.id === value);
      if (response) {
        setBody((prev) => (prev ? `${prev}\n\n${response.content}` : response.content));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;

    setIsSending(true);
    setError(null);
    try {
      await onSubmit({
        body: body.trim(),
        senderType,
        isInternal,
      });
      setBody("");
      setIsInternal(false);
      setSelectedCanned("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const cannedOptions = [
    { value: "", label: "Insert canned response..." },
    ...cannedResponses.map((r) => ({ value: r.id, label: r.title })),
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <Alert variant="destructive" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {senderType === "agent" && cannedResponses.length > 0 && (
        <Select
          value={selectedCanned}
          onChange={handleCannedSelect}
          options={cannedOptions}
        />
      )}

      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={isInternal ? "Write an internal note..." : "Type your reply..."}
        rows={4}
        required
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button type="submit" isLoading={isSending} disabled={!body.trim()}>
            {isInternal ? "Add Note" : "Send Reply"}
          </Button>
          {senderType === "agent" && (
            <Button
              type="button"
              variant={isInternal ? "secondary" : "outline"}
              size="sm"
              onClick={() => setIsInternal(!isInternal)}
            >
              {isInternal ? "Internal Note" : "Public Reply"}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
