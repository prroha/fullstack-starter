import { StatCard } from "@/components/ui/stat-card";
import { formatPrice } from "@/lib/events/formatters";
import type { DashboardStats as DashboardStatsType } from "@/lib/events/types";

interface DashboardStatsProps {
  stats: DashboardStatsType;
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Published Events"
        value={stats.publishedEvents}
        trendLabel={`${stats.upcomingEvents} upcoming`}
        variant="success"
      />
      <StatCard
        label="Draft Events"
        value={stats.draftEvents}
        trendLabel={`${stats.totalEvents} total`}
        variant="warning"
      />
      <StatCard
        label="Registrations"
        value={stats.totalRegistrations}
        trendLabel={`${stats.confirmedRegistrations} confirmed`}
      />
      <StatCard
        label="Revenue"
        value={formatPrice(stats.totalRevenue)}
        trendLabel={`${stats.totalVenues} venue${stats.totalVenues !== 1 ? "s" : ""}`}
      />
    </div>
  );
}
