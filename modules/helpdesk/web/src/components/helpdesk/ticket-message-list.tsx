"use client";

import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/helpdesk/formatters";
import type { TicketMessage } from "@/lib/helpdesk/types";

// =============================================================================
// Props
// =============================================================================

interface TicketMessageListProps {
  messages: TicketMessage[];
}

// =============================================================================
// Component
// =============================================================================

export default function TicketMessageList({ messages }: TicketMessageListProps) {
  if (messages.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        No messages yet. Start the conversation below.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`rounded-lg border p-4 ${
            message.isInternal
              ? "border-warning/30 bg-warning/5"
              : message.senderType === "agent"
                ? "border-border bg-card"
                : "border-border bg-accent/30"
          }`}
        >
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-foreground">
              {message.senderType === "agent" ? "Agent" : "Customer"}
            </span>
            {message.isInternal && (
              <Badge variant="outline">Internal Note</Badge>
            )}
            <span className="ml-auto text-muted-foreground">
              {formatRelativeTime(message.createdAt)}
            </span>
          </div>
          <div className="mt-2 whitespace-pre-wrap text-sm text-foreground">
            {message.body}
          </div>
        </div>
      ))}
    </div>
  );
}
