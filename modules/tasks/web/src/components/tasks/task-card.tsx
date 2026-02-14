import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import TaskStatusBadge from "./task-status-badge";
import TaskPriorityBadge from "./task-priority-badge";
import { formatDueDate } from "@/lib/tasks/formatters";
import type { Task } from "@/lib/tasks/types";

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
}

export default function TaskCard({ task, onClick }: TaskCardProps) {
  const dueInfo = task.dueDate ? formatDueDate(task.dueDate) : null;

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
              task.status === "DONE" ? "text-muted-foreground line-through" : "text-foreground"
            )}
          >
            {task.title}
          </h3>
          {task.description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <TaskStatusBadge status={task.status} />
          <TaskPriorityBadge priority={task.priority} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {task.project && (
          <Badge variant="outline">
            <span
              className="mr-1.5 inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: task.project.color }}
            />
            {task.project.name}
          </Badge>
        )}
        {task.labels?.map((link) =>
          link.label ? (
            <Badge key={link.id} variant="outline">
              <span
                className="mr-1.5 inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: link.label.color }}
              />
              {link.label.name}
            </Badge>
          ) : null
        )}
        {dueInfo && (
          <span
            className={cn(
              "text-xs",
              dueInfo.isOverdue ? "font-medium text-destructive" : "text-muted-foreground"
            )}
          >
            {dueInfo.text}
          </span>
        )}
      </div>
    </div>
  );
}
