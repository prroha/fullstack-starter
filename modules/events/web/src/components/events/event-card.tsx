import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import EventStatusBadge from "./event-status-badge";
import EventTypeBadge from "./event-type-badge";
import { formatDateRange, formatPrice } from "@/lib/events/formatters";
import type { Event } from "@/lib/events/types";

interface EventCardProps {
  event: Event;
  onClick?: () => void;
}

export default function EventCard({ event, onClick }: EventCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-4 transition-colors",
        onClick && "cursor-pointer hover:bg-accent/50"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3
            className={cn(
              "font-medium",
              event.status === "CANCELLED" ? "text-muted-foreground line-through" : "text-foreground"
            )}
          >
            {event.title}
          </h3>
          {event.description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {event.description}
            </p>
          )}
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <EventStatusBadge status={event.status} />
          <EventTypeBadge type={event.type} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">
          {formatDateRange(event.startDate, event.endDate)}
        </span>
        {event.category && (
          <Badge variant="outline">
            <span
              className="mr-1.5 inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: event.category.color }}
            />
            {event.category.name}
          </Badge>
        )}
        {event.venue && (
          <Badge variant="outline">
            {event.venue.name}
          </Badge>
        )}
        {event.price > 0 && (
          <span className="text-xs font-medium text-foreground">
            {formatPrice(event.price, event.currency)}
          </span>
        )}
        {event.isFeatured && (
          <Badge variant="secondary">Featured</Badge>
        )}
      </div>
    </div>
  );
}
