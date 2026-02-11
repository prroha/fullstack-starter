"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { SkeletonDashboard, Badge, Text } from "@/components/ui";
import { Alert } from "@/components/feedback";
import { Icon } from "@/components/ui/icon";
import { FeatureGate } from "@/components";
import type { AdminStats } from "@/types/api";

/**
 * Stats Card Component - displays a single stat with icon and optional link
 */
function StatsCard({
  title,
  value,
  description,
  icon,
  href,
  color = "primary",
}: {
  title: string;
  value: number | string;
  description?: string;
  icon: React.ReactNode;
  href?: string;
  color?: "primary" | "success" | "warning" | "destructive" | "muted";
}) {
  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    success: "bg-green-500/10 text-green-600 dark:text-green-400",
    warning: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    destructive: "bg-red-500/10 text-red-600 dark:text-red-400",
    muted: "bg-muted text-muted-foreground",
  };

  const content = (
    <div className="rounded-lg border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className={`rounded-full p-3 ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

/**
 * Section Card - for grouping related stats with a header
 */
function SectionCard({
  title,
  href,
  icon,
  children,
}: {
  title: string;
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
      <Link
        href={href}
        className="flex items-center justify-between p-4 border-b hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">{icon}</div>
          <h3 className="font-semibold">{title}</h3>
        </div>
        <Icon name="ChevronRight" size="sm" color="muted" />
      </Link>
      <div className="p-4">{children}</div>
    </div>
  );
}

/**
 * Mini Stat Row - compact stat display for section cards
 */
function MiniStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: "success" | "warning" | "destructive" | "muted";
}) {
  const dotColors = {
    success: "bg-green-500",
    warning: "bg-yellow-500",
    destructive: "bg-red-500",
    muted: "bg-muted-foreground",
  };

  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        {color && (
          <div className={`h-2 w-2 rounded-full ${dotColors[color]}`} />
        )}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className="font-medium">{value}</span>
    </div>
  );
}

/**
 * Signups Chart - simple bar chart for signups by day
 */
function SignupsChart({
  data,
}: {
  data?: Array<{ date?: string; count?: number }>;
}) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        No signup data available
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count || 0), 1);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-muted-foreground">
        Signups (Last 7 Days)
      </h4>
      <div className="flex items-end gap-1.5 h-24">
        {data.map((day, index) => {
          const height = ((day.count || 0) / maxCount) * 100;
          const date = day.date ? new Date(day.date) : new Date();
          const dayLabel = date.toLocaleDateString("en-US", { weekday: "short" });

          return (
            <div
              key={day.date || index}
              className="flex-1 flex flex-col items-center gap-1"
            >
              <span className="text-xs font-medium">{day.count || 0}</span>
              <div
                className="w-full bg-primary rounded-t transition-all duration-300"
                style={{ height: `${Math.max(height, 8)}%` }}
              />
              <span className="text-[10px] text-muted-foreground">{dayLabel}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Recent Activity Feed
 */
interface ActivityItem {
  id?: string;
  action?: string;
  entity?: string;
  entityId?: string | null;
  userEmail?: string | null;
  createdAt?: string;
}

function ActivityFeed({
  activities,
}: {
  activities?: ActivityItem[];
}) {
  const getActionColor = (action?: string) => {
    if (action === "CREATE" || action === "LOGIN") return "text-green-600 dark:text-green-400";
    if (action === "DELETE" || action === "LOGIN_FAILED") return "text-red-600 dark:text-red-400";
    if (action === "UPDATE") return "text-blue-600 dark:text-blue-400";
    return "text-muted-foreground";
  };

  const getActionIcon = (action?: string): Parameters<typeof Icon>[0]["name"] => {
    if (action === "CREATE") return "Plus";
    if (action === "DELETE") return "Trash2";
    if (action === "UPDATE") return "Pencil";
    if (action === "LOGIN") return "LogIn";
    if (action === "LOGOUT") return "LogOut";
    if (action === "LOGIN_FAILED") return "ShieldAlert";
    return "Activity";
  };

  const formatTimeAgo = (date?: string) => {
    if (!date) return "";
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Icon name="Activity" size="lg" className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {activities.map((activity, index) => (
        <div
          key={activity.id || index}
          className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
        >
          <div className={getActionColor(activity.action)}>
            <Icon name={getActionIcon(activity.action)} size="sm" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate">
              <span className="font-medium">{activity.action || "Unknown"}</span>
              <span className="text-muted-foreground"> on </span>
              <span className="font-medium">{activity.entity || "Unknown"}</span>
            </p>
            {activity.userEmail && (
              <p className="text-xs text-muted-foreground truncate">
                by {activity.userEmail}
              </p>
            )}
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatTimeAgo(activity.createdAt)}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Quick Actions Grid
 */
function QuickActions() {
  const baseActions = [
    { label: "Add User", href: "/admin/users", icon: "UserPlus" },
    { label: "New Announcement", href: "/admin/announcements", icon: "Megaphone" },
    { label: "Add FAQ", href: "/admin/faqs", icon: "CircleQuestionMark" },
    { label: "New Content", href: "/admin/content", icon: "FileText" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {baseActions.map((action) => (
        <Link
          key={action.label}
          href={action.href}
          className="flex flex-col items-center gap-2 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors text-center"
        >
          <Icon name={action.icon as Parameters<typeof Icon>[0]["name"]} size="md" color="primary" />
          <span className="text-xs font-medium">{action.label}</span>
        </Link>
      ))}
      <FeatureGate feature="payments.stripe">
        <Link
          href="/admin/coupons"
          className="flex flex-col items-center gap-2 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors text-center"
        >
          <Icon name="Ticket" size="md" color="primary" />
          <span className="text-xs font-medium">Create Coupon</span>
        </Link>
      </FeatureGate>
      <FeatureGate feature="security.audit">
        <Link
          href="/admin/audit-logs"
          className="flex flex-col items-center gap-2 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors text-center"
        >
          <Icon name="ScrollText" size="md" color="primary" />
          <span className="text-xs font-medium">View Logs</span>
        </Link>
      </FeatureGate>
    </div>
  );
}

/**
 * Admin Dashboard Page
 */
export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
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
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Alert variant="destructive">{error}</Alert>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-4">
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
            Welcome to your admin control center
          </p>
        </div>
        <Badge variant="secondary">Admin</Badge>
      </div>

      {/* Key Metrics Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={stats.users?.total ?? 0}
          description={`${stats.users?.active ?? 0} active`}
          href="/admin/users"
          icon={<Icon name="Users" size="md" />}
          color="primary"
        />
        <FeatureGate feature="payments.stripe">
          <StatsCard
            title="Total Revenue"
            value={`$${(stats.orders?.totalRevenue ?? 0).toLocaleString()}`}
            description={`${stats.orders?.total ?? 0} orders`}
            href="/admin/orders"
            icon={<Icon name="DollarSign" size="md" />}
            color="success"
          />
        </FeatureGate>
        <StatsCard
          title="Pending Messages"
          value={stats.messages?.pending ?? 0}
          description={`${stats.messages?.total ?? 0} total`}
          href="/admin/messages"
          icon={<Icon name="Mail" size="md" />}
          color={(stats.messages?.pending ?? 0) > 0 ? "warning" : "muted"}
        />
        <FeatureGate feature="payments.stripe">
          <StatsCard
            title="Active Coupons"
            value={stats.coupons?.active ?? 0}
            description={`${stats.coupons?.expired ?? 0} expired`}
            href="/admin/coupons"
            icon={<Icon name="Ticket" size="md" />}
            color="primary"
          />
        </FeatureGate>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left Column - Section Cards */}
        <div className="lg:col-span-2 space-y-4">
          {/* Users & Orders Row */}
          <div className="grid gap-4 sm:grid-cols-2">
            <SectionCard
              title="Users"
              href="/admin/users"
              icon={<Icon name="Users" size="sm" />}
            >
              <MiniStat label="Active Users" value={stats.users?.active ?? 0} color="success" />
              <MiniStat label="Inactive Users" value={stats.users?.inactive ?? 0} color="muted" />
              <MiniStat label="Admin Users" value={stats.users?.admins ?? 0} color="warning" />
              <div className="mt-4 pt-3 border-t">
                <SignupsChart data={stats.users?.signupsByDay ?? []} />
              </div>
            </SectionCard>

            <FeatureGate feature="payments.stripe">
              <SectionCard
                title="Orders"
                href="/admin/orders"
                icon={<Icon name="ShoppingCart" size="sm" />}
              >
                <MiniStat label="Completed" value={stats.orders?.completed ?? 0} color="success" />
                <MiniStat label="Pending" value={stats.orders?.pending ?? 0} color="warning" />
                <MiniStat label="Recent (7 days)" value={stats.orders?.recentOrders ?? 0} />
                <div className="mt-4 pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <Text variant="caption" color="muted">Total Revenue</Text>
                    <Text className="text-lg font-bold text-green-600 dark:text-green-400">
                      ${(stats.orders?.totalRevenue ?? 0).toLocaleString()}
                    </Text>
                  </div>
                </div>
              </SectionCard>
            </FeatureGate>
          </div>

          {/* Content & Engagement Row */}
          <div className="grid gap-4 sm:grid-cols-3">
            <SectionCard
              title="FAQs"
              href="/admin/faqs"
              icon={<Icon name="CircleQuestionMark" size="sm" />}
            >
              <MiniStat label="Active" value={stats.faqs?.active ?? 0} color="success" />
              <MiniStat label="Categories" value={stats.faqs?.categories ?? 0} />
              <MiniStat label="Total" value={stats.faqs?.total ?? 0} />
            </SectionCard>

            <SectionCard
              title="Announcements"
              href="/admin/announcements"
              icon={<Icon name="Megaphone" size="sm" />}
            >
              <MiniStat label="Active" value={stats.announcements?.active ?? 0} color="success" />
              <MiniStat label="Pinned" value={stats.announcements?.pinned ?? 0} color="warning" />
              <MiniStat label="Total" value={stats.announcements?.total ?? 0} />
            </SectionCard>

            <SectionCard
              title="Content"
              href="/admin/content"
              icon={<Icon name="FileText" size="sm" />}
            >
              <MiniStat label="Published" value={stats.content?.published ?? 0} color="success" />
              <MiniStat label="Draft" value={stats.content?.draft ?? 0} color="muted" />
              <MiniStat label="Total" value={stats.content?.total ?? 0} />
            </SectionCard>
          </div>
        </div>

        {/* Right Column - Activity & Quick Actions */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <QuickActions />
          </div>

          {/* Recent Activity */}
          <FeatureGate feature="security.audit">
            <div className="rounded-lg border bg-card shadow-sm">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold">Recent Activity</h3>
                <Link
                  href="/admin/audit-logs"
                  className="text-sm text-primary hover:underline"
                >
                  View all
                </Link>
              </div>
              <div className="p-2 max-h-80 overflow-y-auto">
                <ActivityFeed activities={stats.recentActivity ?? []} />
              </div>
            </div>
          </FeatureGate>

          {/* Messages Summary */}
          <SectionCard
            title="Messages"
            href="/admin/messages"
            icon={<Icon name="Mail" size="sm" />}
          >
            <MiniStat label="Pending" value={stats.messages?.pending ?? 0} color="warning" />
            <MiniStat label="Read" value={stats.messages?.read ?? 0} color="success" />
            <MiniStat label="Replied" value={stats.messages?.replied ?? 0} color="success" />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
