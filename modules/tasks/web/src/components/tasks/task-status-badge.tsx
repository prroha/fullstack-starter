import { StatusBadge } from "@/components/ui/status-badge";
import { formatTaskStatus, getTaskStatusBadge } from "@/lib/tasks/formatters";
import type { TaskStatus } from "@/lib/tasks/types";

interface TaskStatusBadgeProps {
  status: TaskStatus;
  showDot?: boolean;
}

export default function TaskStatusBadge({ status, showDot = true }: TaskStatusBadgeProps) {
  return (
    <StatusBadge
      status={getTaskStatusBadge(status)}
      label={formatTaskStatus(status)}
      showDot={showDot}
    />
  );
}
