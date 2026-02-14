import { StatusBadge } from "@/components/ui/status-badge";
import { formatEventStatus, getEventStatusBadge } from "@/lib/events/formatters";
import type { EventStatus } from "@/lib/events/types";

interface EventStatusBadgeProps {
  status: EventStatus;
  showDot?: boolean;
}

export default function EventStatusBadge({ status, showDot = true }: EventStatusBadgeProps) {
  return (
    <StatusBadge
      status={getEventStatusBadge(status)}
      label={formatEventStatus(status)}
      showDot={showDot}
    />
  );
}
