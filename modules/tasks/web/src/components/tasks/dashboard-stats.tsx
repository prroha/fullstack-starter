import { StatCard } from "@/components/ui/stat-card";
import type { DashboardStats as DashboardStatsType } from "@/lib/tasks/types";

interface DashboardStatsProps {
  stats: DashboardStatsType;
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="To Do"
        value={stats.todoTasks}
        trendLabel={`${stats.dueTodayTasks} due today`}
        variant="warning"
      />
      <StatCard
        label="In Progress"
        value={stats.inProgressTasks}
        trendLabel={`${stats.inReviewTasks} in review`}
      />
      <StatCard
        label="Completed"
        value={stats.doneTasks}
        trendLabel={`of ${stats.totalTasks} total tasks`}
        variant="success"
      />
      <StatCard
        label="Overdue"
        value={stats.overdueTasks}
        trendLabel={`${stats.totalProjects} project${stats.totalProjects !== 1 ? "s" : ""}`}
        variant={stats.overdueTasks > 0 ? "error" : "default"}
      />
    </div>
  );
}
