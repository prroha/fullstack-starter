"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { SkeletonDashboard, Badge } from "@/components/ui";
import { Alert } from "@/components/feedback";

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  adminUsers: number;
  recentSignups: number;
  signupsByDay: Array<{ date: string; count: number }>;
}

/**
 * Stats Card Component
 */
function StatsCard({
  title,
  value,
  description,
  trend,
  icon,
}: {
  title: string;
  value: number | string;
  description?: string;
  trend?: { value: number; isPositive: boolean };
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1">
              <span
                className={
                  trend.isPositive ? "text-green-600" : "text-red-600"
                }
              >
                {trend.isPositive ? "+" : "-"}
                {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-muted-foreground">vs last week</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="rounded-full bg-primary/10 p-3 text-primary">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Simple Bar Chart for signups by day
 */
function SignupsChart({
  data,
}: {
  data: Array<{ date: string; count: number }>;
}) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Signups (Last 7 Days)</h3>
      <div className="flex items-end gap-2 h-40">
        {data.map((day) => {
          const height = (day.count / maxCount) * 100;
          const date = new Date(day.date);
          const dayLabel = date.toLocaleDateString("en-US", { weekday: "short" });

          return (
            <div
              key={day.date}
              className="flex-1 flex flex-col items-center gap-1"
            >
              <span className="text-xs font-medium">{day.count}</span>
              <div
                className="w-full bg-primary rounded-t transition-all duration-300"
                style={{ height: `${Math.max(height, 4)}%` }}
              />
              <span className="text-xs text-muted-foreground">{dayLabel}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Admin Dashboard Page
 */
export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await api.getAdminStats();
        if (response.data) {
          setStats(response.data);
        }
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Failed to load dashboard stats");
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (isLoading) {
    return <SkeletonDashboard />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Alert variant="destructive">{error}</Alert>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Alert variant="warning">No stats available</Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your application statistics
          </p>
        </div>
        <Badge variant="secondary">Admin</Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers}
          description="All registered users"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />
        <StatsCard
          title="Active Users"
          value={stats.activeUsers}
          description="Currently active accounts"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <path d="m9 11 3 3L22 4" />
            </svg>
          }
        />
        <StatsCard
          title="Inactive Users"
          value={stats.inactiveUsers}
          description="Deactivated accounts"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="m15 9-6 6" />
              <path d="m9 9 6 6" />
            </svg>
          }
        />
        <StatsCard
          title="Recent Signups"
          value={stats.recentSignups}
          description="Last 7 days"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" x2="19" y1="8" y2="14" />
              <line x1="22" x2="16" y1="11" y2="11" />
            </svg>
          }
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <SignupsChart data={stats.signupsByDay} />

        {/* Quick Stats Card */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">User Breakdown</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-primary" />
                <span className="text-sm">Regular Users</span>
              </div>
              <span className="font-medium">
                {stats.totalUsers - stats.adminUsers}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-orange-500" />
                <span className="text-sm">Admin Users</span>
              </div>
              <span className="font-medium">{stats.adminUsers}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{
                  width: `${
                    ((stats.totalUsers - stats.adminUsers) / stats.totalUsers) *
                    100
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
