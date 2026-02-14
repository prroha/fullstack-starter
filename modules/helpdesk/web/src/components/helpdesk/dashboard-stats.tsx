import { StatCard } from "@/components/ui/stat-card";
import type { HelpdeskDashboardStats } from "@/lib/helpdesk/types";

interface DashboardStatsProps {
  stats: HelpdeskDashboardStats;
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Open Tickets"
        value={stats.openTickets}
        description={`${stats.unassignedCount} unassigned`}
        variant="warning"
      />
      <StatCard
        title="In Progress"
        value={stats.inProgressTickets}
        description={`${stats.ticketsToday} new today`}
      />
      <StatCard
        title="Resolved"
        value={stats.resolvedTickets}
        description={`Avg ${stats.avgResolutionHours.toFixed(1)}h resolution`}
        variant="success"
      />
      <StatCard
        title="SLA Breached"
        value={stats.slaBreachedCount}
        description={`of ${stats.totalTickets} total tickets`}
        variant={stats.slaBreachedCount > 0 ? "error" : "default"}
      />
    </div>
  );
}
