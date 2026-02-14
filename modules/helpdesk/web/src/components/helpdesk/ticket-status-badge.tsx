import { StatusBadge } from "@/components/ui/status-badge";
import { formatTicketStatus, getTicketStatusBadge } from "@/lib/helpdesk/formatters";
import type { TicketStatus } from "@/lib/helpdesk/types";

interface TicketStatusBadgeProps {
  status: TicketStatus;
  showDot?: boolean;
}

export default function TicketStatusBadge({ status, showDot = true }: TicketStatusBadgeProps) {
  return (
    <StatusBadge
      status={getTicketStatusBadge(status) as "active" | "inactive" | "pending" | "success" | "warning" | "error" | "info"}
      label={formatTicketStatus(status)}
      showDot={showDot}
    />
  );
}
