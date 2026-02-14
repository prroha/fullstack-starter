import { StatusBadge } from "@/components/ui/status-badge";
import { formatTaskPriority, getTaskPriorityBadge } from "@/lib/tasks/formatters";
import type { TaskPriority } from "@/lib/tasks/types";

interface TaskPriorityBadgeProps {
  priority: TaskPriority;
  showDot?: boolean;
}

export default function TaskPriorityBadge({ priority, showDot = true }: TaskPriorityBadgeProps) {
  if (priority === "NONE") return null;

  return (
    <StatusBadge
      status={getTaskPriorityBadge(priority)}
      label={formatTaskPriority(priority)}
      showDot={showDot}
    />
  );
}
