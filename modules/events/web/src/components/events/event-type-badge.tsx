import { StatusBadge } from "@/components/ui/status-badge";
import { formatEventType, getEventTypeBadge } from "@/lib/events/formatters";
import type { EventType } from "@/lib/events/types";

interface EventTypeBadgeProps {
  type: EventType;
  showDot?: boolean;
}

export default function EventTypeBadge({ type, showDot = false }: EventTypeBadgeProps) {
  return (
    <StatusBadge
      status={getEventTypeBadge(type)}
      label={formatEventType(type)}
      showDot={showDot}
    />
  );
}
