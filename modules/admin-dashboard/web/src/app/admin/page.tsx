'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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
// Stats Card Component
// =============================================================================

function StatsCard({
  title,
  value,
  description,
  trend,
}: {
  title: string;
  value: number | string;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-500',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
      {description && (
        <p className={`mt-1 text-sm ${trend ? trendColors[trend] : 'text-gray-500'}`}>
          {description}
        </p>
      )}
    </div>
  );
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
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-900">
          {getActivityText(activity.type)}
        </p>
        <p className="text-sm text-gray-500">
          {activity.user.name || activity.user.email}
        </p>
      </div>
      <span className="text-xs text-gray-400">
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchDashboardData();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">
                Overview of your application
              </p>
            </div>
            <Link
              href="/admin/users"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Manage Users
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Users"
            value={stats?.totalUsers || 0}
            description="All registered users"
          />
          <StatsCard
            title="Active Users"
            value={stats?.activeUsers || 0}
            description="Active in last 30 days"
            trend="up"
          />
          <StatsCard
            title="New Today"
            value={stats?.newUsersToday || 0}
            description="Registered today"
          />
          <StatsCard
            title="This Month"
            value={stats?.newUsersThisMonth || 0}
            description={`${stats?.newUsersThisWeek || 0} this week`}
            trend="up"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Activity
              </h2>
              <button
                onClick={fetchDashboardData}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Refresh
              </button>
            </div>

            {activity.length > 0 ? (
              <div>
                {activity.map((item) => (
                  <ActivityItem key={item.id} activity={item} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No recent activity
              </p>
            )}
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <nav className="space-y-2">
              <Link
                href="/admin/users"
                className="block px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900">User Management</span>
                <p className="text-sm text-gray-500">View and manage users</p>
              </Link>
              <Link
                href="/admin/settings"
                className="block px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900">Settings</span>
                <p className="text-sm text-gray-500">Configure application</p>
              </Link>
              <Link
                href="/"
                className="block px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900">View Site</span>
                <p className="text-sm text-gray-500">Open public site</p>
              </Link>
            </nav>
          </div>
        </div>
      </main>
    </div>
  );
}
