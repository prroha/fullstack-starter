import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { EventSpeaker } from "@/lib/events/types";

interface SpeakerCardProps {
  speaker: EventSpeaker;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function SpeakerCard({ speaker, onEdit, onDelete }: SpeakerCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground"
          )}
        >
          {speaker.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-medium text-foreground">{speaker.name}</h4>
          {(speaker.title || speaker.company) && (
            <p className="text-sm text-muted-foreground">
              {[speaker.title, speaker.company].filter(Boolean).join(" at ")}
            </p>
          )}
          {speaker.bio && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {speaker.bio}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {speaker.email && (
              <Badge variant="outline">{speaker.email}</Badge>
            )}
          </div>
        </div>
        {(onEdit || onDelete) && (
          <div className="flex flex-shrink-0 items-center gap-1">
            {onEdit && (
              <Button variant="ghost" size="sm" onClick={onEdit}>
                Edit
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="sm" onClick={onDelete}>
                Remove
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
