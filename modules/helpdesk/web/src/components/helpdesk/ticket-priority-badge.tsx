import { StatusBadge } from "@/components/ui/status-badge";
import { formatTicketPriority, getTicketPriorityBadge } from "@/lib/helpdesk/formatters";
import type { TicketPriority } from "@/lib/helpdesk/types";

interface TicketPriorityBadgeProps {
  priority: TicketPriority;
  showDot?: boolean;
}

export default function TicketPriorityBadge({ priority, showDot = false }: TicketPriorityBadgeProps) {
  return (
    <StatusBadge
      status={getTicketPriorityBadge(priority) as "active" | "inactive" | "pending" | "success" | "warning" | "error" | "info"}
      label={formatTicketPriority(priority)}
      showDot={showDot}
    />
  );
}
