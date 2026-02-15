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
        "flex-1 overflow-auto bg-muted p-8",
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
 * Preview content that uses feature flags.
 * Scopes theme via data-theme so all CSS-variable-based classes resolve
 * to the correct palette regardless of the page-level theme.
 */
function PreviewContent({ theme }: { theme: ThemeMode }) {
  const { tier, features, hasFeature } = useFeatureFlags();

  return (
    <div
      className="w-full h-full bg-background text-foreground"
      data-theme={theme}
    >
      {/* Mock App Shell */}
      <div className="min-h-full flex flex-col">
        {/* Header */}
        <header className="border-b border-border px-4 py-3 flex items-center justify-between">
          <div className="font-semibold">Your App</div>
          <div className="flex items-center gap-2">
            {hasFeature("auth.basic") && (
              <button className="px-3 py-1.5 rounded-md text-sm bg-secondary text-secondary-foreground hover:bg-secondary/80">
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
                  <PreviewStatCard title="Total Users" value="1,234" />
                  <PreviewStatCard title="Revenue" value="$45,678" />
                  <PreviewStatCard title="Orders" value="567" />
                </>
              )}

              {/* Placeholder cards */}
              <PreviewCard>
                <h3 className="font-medium mb-2">Welcome!</h3>
                <p className="text-sm text-muted-foreground">
                  This is a preview of your configured application.
                </p>
              </PreviewCard>

              {/* Payments section */}
              {hasFeature("payments.oneTime") && (
                <PreviewCard>
                  <h3 className="font-medium mb-2">Payments</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Stripe integration enabled
                  </p>
                  <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">
                    Make Payment
                  </button>
                </PreviewCard>
              )}

              {/* File Upload */}
              {hasFeature("storage.upload") && (
                <PreviewCard>
                  <h3 className="font-medium mb-2">File Uploads</h3>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      Drop files here
                    </p>
                  </div>
                </PreviewCard>
              )}
            </div>
          ) : (
            /* Basic layout */
            <div className="max-w-2xl mx-auto text-center py-12">
              <h1 className="text-2xl font-bold mb-4">Welcome to Your App</h1>
              <p className="text-muted-foreground">
                Configure more features to see them in action.
              </p>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-border px-4 py-3 text-center text-sm text-muted-foreground">
          Built with Xitolaunch • {tier} tier • {features.size > 0 ? features.size : 0} features
        </footer>
      </div>
    </div>
  );
}

function PreviewCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card text-card-foreground p-4">
      {children}
    </div>
  );
}

function PreviewStatCard({ title, value }: { title: string; value: string }) {
  return (
    <PreviewCard>
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </PreviewCard>
  );
}
