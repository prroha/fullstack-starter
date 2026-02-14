import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import type { TaskProject } from "@/lib/tasks/types";

interface ProjectCardProps {
  project: TaskProject;
  onClick?: () => void;
}

export default function ProjectCard({ project, onClick }: ProjectCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-4 transition-colors",
        onClick && "cursor-pointer hover:bg-accent/50"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: project.color }}
            />
            <h3 className="font-medium text-foreground">{project.name}</h3>
          </div>
          {project.description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {project.description}
            </p>
          )}
        </div>
        <StatusBadge
          status={project.isArchived ? "inactive" : "active"}
          label={project.isArchived ? "Archived" : "Active"}
          showDot
        />
      </div>

      {project.icon && (
        <div className="mt-2">
          <Badge variant="outline">{project.icon}</Badge>
        </div>
      )}
    </div>
  );
}
