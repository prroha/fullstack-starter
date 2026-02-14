import TaskBoardColumn from "./task-board-column";
import type { Task, TaskStatus } from "@/lib/tasks/types";

const BOARD_STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];

interface TaskBoardViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export default function TaskBoardView({ tasks, onTaskClick }: TaskBoardViewProps) {
  const groupedTasks = BOARD_STATUSES.reduce<Record<TaskStatus, Task[]>>(
    (acc, status) => {
      acc[status] = tasks.filter((t) => t.status === status);
      return acc;
    },
    {} as Record<TaskStatus, Task[]>
  );

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {BOARD_STATUSES.map((status) => (
        <TaskBoardColumn
          key={status}
          status={status}
          tasks={groupedTasks[status]}
          onTaskClick={onTaskClick}
        />
      ))}
    </div>
  );
}
