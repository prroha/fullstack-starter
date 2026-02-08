"use client";

import { useAuth } from "@/lib/auth-context";
import { Text } from "@/components/ui";
import { AppLink } from "@/components/ui/link";
import { Icon, IconName } from "@/components/ui/icon";
import { CardSection } from "@/components/layout";

// =====================================================
// Quick Action Card Component
// =====================================================

interface QuickActionCardProps {
  href: string;
  iconName: IconName;
  title: string;
  description: string;
}

function QuickActionCard({ href, iconName, title, description }: QuickActionCardProps) {
  return (
    <AppLink
      href={href}
      className="group p-6 rounded-lg border bg-card hover:bg-accent/50"
      underline="none"
    >
      <div className="flex items-start gap-4">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Icon name={iconName} size="lg" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground group-hover:text-primary">
            {title}
          </h3>
          <Text variant="caption" color="muted" className="mt-1">{description}</Text>
        </div>
        <Icon name="ArrowRight" size="sm" color="muted" className="group-hover:text-primary" />
      </div>
    </AppLink>
  );
}

// =====================================================
// Dashboard Page
// =====================================================

export default function DashboardPage() {
  const { user } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {getGreeting()}, {user?.name || "there"}!
        </h1>
        <Text color="muted" className="mt-1">
          Welcome to your dashboard. Here's what you can do today.
        </Text>
      </div>

      {/* Quick Actions Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickActionCard
            href="/dashboard/profile"
            iconName="User"
            title="Edit Profile"
            description="Update your personal information and avatar"
          />
          <QuickActionCard
            href="/dashboard/notifications"
            iconName="Bell"
            title="Notifications"
            description="View and manage your notifications"
          />
          <QuickActionCard
            href="/dashboard/settings"
            iconName="Settings"
            title="Settings"
            description="Configure your account preferences"
          />
        </div>
      </div>

      {/* Activity Section (placeholder for future content) */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
        <CardSection className="p-8 text-center">
          <Text color="muted">No recent activity to display.</Text>
          <Text variant="caption" color="muted" className="mt-1">
            Your recent activity will appear here.
          </Text>
        </CardSection>
      </div>

      {/* Stats Section (placeholder for future content) */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Overview</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <CardSection>
            <Text variant="caption" color="muted">Account Status</Text>
            <p className="text-2xl font-bold text-green-600 mt-1">Active</p>
          </CardSection>
          <CardSection>
            <Text variant="caption" color="muted">Member Since</Text>
            <p className="text-2xl font-bold mt-1">--</p>
          </CardSection>
          <CardSection>
            <Text variant="caption" color="muted">Email Verified</Text>
            <p className="text-2xl font-bold mt-1">
              {user?.emailVerified ? (
                <span className="text-green-600">Yes</span>
              ) : (
                <span className="text-amber-600">Pending</span>
              )}
            </p>
          </CardSection>
          <CardSection>
            <Text variant="caption" color="muted">Account Type</Text>
            <p className="text-2xl font-bold mt-1">{user?.role || "User"}</p>
          </CardSection>
        </div>
      </div>
    </div>
  );
}
