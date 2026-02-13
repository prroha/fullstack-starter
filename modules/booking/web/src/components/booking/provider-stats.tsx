"use client";

import { StatCard } from "@/components/ui/stat-card";
import type { ProviderStats } from "@/lib/booking/types";
import { formatPrice } from "@/lib/booking/formatters";

interface ProviderStatsProps {
  stats: ProviderStats;
  isLoading?: boolean;
}

export default function ProviderStatsGrid({
  stats,
  isLoading = false,
}: ProviderStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <StatCard
        label="Total Bookings"
        value={stats.totalBookings}
        isLoading={isLoading}
      />
      <StatCard
        label="Upcoming"
        value={stats.upcomingBookings}
        variant="info"
        isLoading={isLoading}
      />
      <StatCard
        label="Completed"
        value={stats.completedBookings}
        variant="success"
        isLoading={isLoading}
      />
      <StatCard
        label="Cancelled"
        value={stats.cancelledBookings}
        variant="warning"
        isLoading={isLoading}
      />
      <StatCard
        label="Revenue"
        value={formatPrice(stats.totalRevenue)}
        variant="default"
        isLoading={isLoading}
      />
    </div>
  );
}
