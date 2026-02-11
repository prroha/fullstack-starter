"use client";

import { DeviceFrame } from "./device-frame";
import { FeatureFlagProvider, useFeatureFlags } from "@/lib/preview";
import { cn } from "@/lib/utils";
import type { DeviceType, DeviceSize, ThemeMode } from "@/lib/preview";

interface PreviewCanvasProps {
  device: DeviceType;
  size: DeviceSize;
  theme: ThemeMode;
  tier: string;
  features: string[];
  className?: string;
}

export function PreviewCanvas({
  device,
  size,
  theme,
  tier,
  features,
  className,
}: PreviewCanvasProps) {
  return (
    <div
      className={cn(
        "flex-1 overflow-auto bg-zinc-100 dark:bg-zinc-900 p-8",
        className
      )}
    >
      <div className="flex items-center justify-center min-h-full">
        <DeviceFrame device={device} size={size}>
          <FeatureFlagProvider features={features} tier={tier}>
            <PreviewContent theme={theme} />
          </FeatureFlagProvider>
        </DeviceFrame>
      </div>
    </div>
  );
}

/**
 * Preview content that uses feature flags
 */
function PreviewContent({ theme }: { theme: ThemeMode }) {
  const { tier, features, hasFeature } = useFeatureFlags();

  return (
    <div
      className={cn(
        "w-full h-full",
        theme === "dark" ? "dark bg-zinc-950 text-white" : "bg-white text-zinc-900"
      )}
    >
      {/* Mock App Shell */}
      <div className="min-h-full flex flex-col">
        {/* Header */}
        <header className={cn(
          "border-b px-4 py-3 flex items-center justify-between",
          theme === "dark" ? "border-zinc-800" : "border-zinc-200"
        )}>
          <div className="font-semibold">Your App</div>
          <div className="flex items-center gap-2">
            {hasFeature("auth.basic") && (
              <button className={cn(
                "px-3 py-1.5 rounded-md text-sm",
                theme === "dark"
                  ? "bg-zinc-800 hover:bg-zinc-700"
                  : "bg-zinc-100 hover:bg-zinc-200"
              )}>
                Sign In
              </button>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Dashboard Layout */}
          {hasFeature("ui.dashboard") ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Stat Cards */}
              {hasFeature("analytics.basic") && (
                <>
                  <StatCard title="Total Users" value="1,234" theme={theme} />
                  <StatCard title="Revenue" value="$45,678" theme={theme} />
                  <StatCard title="Orders" value="567" theme={theme} />
                </>
              )}

              {/* Placeholder cards */}
              <Card theme={theme}>
                <h3 className="font-medium mb-2">Welcome!</h3>
                <p className={cn(
                  "text-sm",
                  theme === "dark" ? "text-zinc-400" : "text-zinc-600"
                )}>
                  This is a preview of your configured application.
                </p>
              </Card>

              {/* Payments section */}
              {hasFeature("payments.oneTime") && (
                <Card theme={theme}>
                  <h3 className="font-medium mb-2">Payments</h3>
                  <p className={cn(
                    "text-sm mb-3",
                    theme === "dark" ? "text-zinc-400" : "text-zinc-600"
                  )}>
                    Stripe integration enabled
                  </p>
                  <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">
                    Make Payment
                  </button>
                </Card>
              )}

              {/* File Upload */}
              {hasFeature("storage.upload") && (
                <Card theme={theme}>
                  <h3 className="font-medium mb-2">File Uploads</h3>
                  <div className={cn(
                    "border-2 border-dashed rounded-lg p-4 text-center",
                    theme === "dark" ? "border-zinc-700" : "border-zinc-300"
                  )}>
                    <p className={cn(
                      "text-sm",
                      theme === "dark" ? "text-zinc-400" : "text-zinc-600"
                    )}>
                      Drop files here
                    </p>
                  </div>
                </Card>
              )}
            </div>
          ) : (
            /* Basic layout */
            <div className="max-w-2xl mx-auto text-center py-12">
              <h1 className="text-2xl font-bold mb-4">Welcome to Your App</h1>
              <p className={cn(
                theme === "dark" ? "text-zinc-400" : "text-zinc-600"
              )}>
                Configure more features to see them in action.
              </p>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className={cn(
          "border-t px-4 py-3 text-center text-sm",
          theme === "dark"
            ? "border-zinc-800 text-zinc-500"
            : "border-zinc-200 text-zinc-500"
        )}>
          Built with Starter Studio • {tier} tier • {features.size > 0 ? features.size : 0} features
        </footer>
      </div>
    </div>
  );
}

function Card({
  children,
  theme,
}: {
  children: React.ReactNode;
  theme: ThemeMode;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        theme === "dark"
          ? "bg-zinc-900 border-zinc-800"
          : "bg-white border-zinc-200"
      )}
    >
      {children}
    </div>
  );
}

function StatCard({
  title,
  value,
  theme,
}: {
  title: string;
  value: string;
  theme: ThemeMode;
}) {
  return (
    <Card theme={theme}>
      <p className={cn(
        "text-sm",
        theme === "dark" ? "text-zinc-400" : "text-zinc-600"
      )}>
        {title}
      </p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </Card>
  );
}
