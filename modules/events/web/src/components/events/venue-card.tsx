import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { EventVenue } from "@/lib/events/types";

interface VenueCardProps {
  venue: EventVenue;
  onClick?: () => void;
}

export default function VenueCard({ venue, onClick }: VenueCardProps) {
  const locationParts = [venue.city, venue.state, venue.country].filter(Boolean);
  const locationStr = locationParts.join(", ");

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
          <h3 className="font-medium text-foreground">{venue.name}</h3>
          {venue.address && (
            <p className="mt-1 text-sm text-muted-foreground">{venue.address}</p>
          )}
          {locationStr && (
            <p className="text-sm text-muted-foreground">{locationStr}</p>
          )}
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          {venue.isVirtual ? (
            <Badge variant="secondary">Virtual</Badge>
          ) : (
            <Badge variant="outline">Physical</Badge>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {venue.capacity != null && (
          <span className="text-xs text-muted-foreground">
            Capacity: {venue.capacity}
          </span>
        )}
        {venue.meetingUrl && (
          <Badge variant="outline">Has Meeting Link</Badge>
        )}
      </div>
    </div>
  );
}
