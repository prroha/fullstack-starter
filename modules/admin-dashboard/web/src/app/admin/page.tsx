'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/stat-card';
import { Alert } from '@/components/feedback/alert';

// =============================================================================
// Types
// =============================================================================

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
}

interface Activity {
  id: string;
  type: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  timestamp: string;
}

// =============================================================================
// Activity Item Component
// =============================================================================

function ActivityItem({ activity }: { activity: Activity }) {
  const getActivityText = (type: string) => {
    switch (type) {
      case 'user_created':
        return 'New user registered';
      case 'user_updated':
        return 'User profile updated';
      default:
        return type;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div>
        <p className="text-sm font-medium text-foreground">
          {getActivityText(activity.type)}
        </p>
        <p className="text-sm text-muted-foreground">
          {activity.user.name || activity.user.email}
        </p>
      </div>
      <span className="text-xs text-muted-foreground">
        {formatTime(activity.timestamp)}
      </span>
    </div>
  );
}

// =============================================================================
// Admin Dashboard Page
// =============================================================================

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, activityRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/activity?limit=10'),
      ]);

      const statsData = await statsRes.json();
      const activityData = await activityRes.json();

      if (statsData.success) {
        setStats(statsData.stats);
      }

      if (activityData.success) {
        setActivity(activityData.activity);
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full">
          <Alert variant="destructive" title="Error">
            {error}
          </Alert>
          <div className="mt-4 text-center">
            <Button
              onClick={() => {
                setError(null);
                setLoading(true);
                fetchDashboardData();
              }}
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Overview of your application
              </p>
            </div>
            <Button asChild>
              <Link href="/admin/users">
                Manage Users
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            label="Total Users"
            value={stats?.totalUsers || 0}
            trendLabel="All registered users"
          />
          <StatCard
            label="Active Users"
            value={stats?.activeUsers || 0}
            trendLabel="Active in last 30 days"
            trend="up"
          />
          <StatCard
            label="New Today"
            value={stats?.newUsersToday || 0}
            trendLabel="Registered today"
          />
          <StatCard
            label="This Month"
            value={stats?.newUsersThisMonth || 0}
            trendLabel={`${stats?.newUsersThisWeek || 0} this week`}
            trend="up"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-card rounded-xl shadow-sm border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                Recent Activity
              </h2>
              <Button
                variant="link"
                size="sm"
                onClick={fetchDashboardData}
              >
                Refresh
              </Button>
            </div>

            {activity.length > 0 ? (
              <div>
                {activity.map((item) => (
                  <ActivityItem key={item.id} activity={item} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No recent activity
              </p>
            )}
          </div>

          {/* Quick Links */}
          <div className="bg-card rounded-xl shadow-sm border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Quick Actions
            </h2>
            <nav className="space-y-2">
              <Link
                href="/admin/users"
                className="block px-4 py-3 rounded-lg hover:bg-muted transition-colors"
              >
                <span className="font-medium text-foreground">User Management</span>
                <p className="text-sm text-muted-foreground">View and manage users</p>
              </Link>
              <Link
                href="/admin/settings"
                className="block px-4 py-3 rounded-lg hover:bg-muted transition-colors"
              >
                <span className="font-medium text-foreground">Settings</span>
                <p className="text-sm text-muted-foreground">Configure application</p>
              </Link>
              <Link
                href="/"
                className="block px-4 py-3 rounded-lg hover:bg-muted transition-colors"
              >
                <span className="font-medium text-foreground">View Site</span>
                <p className="text-sm text-muted-foreground">Open public site</p>
              </Link>
            </nav>
          </div>
        </div>
      </main>
    </div>
  );
}
