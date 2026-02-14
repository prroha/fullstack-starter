import TaskCard from "./task-card";
import { formatTaskStatus } from "@/lib/tasks/formatters";
import type { Task, TaskStatus } from "@/lib/tasks/types";

interface TaskBoardColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export default function TaskBoardColumn({ status, tasks, onTaskClick }: TaskBoardColumnProps) {
  return (
    <div className="flex min-w-[280px] flex-col rounded-lg border border-border bg-muted/30">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">
          {formatTaskStatus(status)}
        </h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {tasks.length}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
        {tasks.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            No tasks
          </p>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
            />
          ))
        )}
      </div>
    </div>
  );
}
