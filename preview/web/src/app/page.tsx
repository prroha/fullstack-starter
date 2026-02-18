"use client";

import { usePreviewContext } from "@preview/lib/preview-context";
import { PreviewNav } from "@preview/components/preview-nav";

export default function PreviewDashboard() {
  const { session, isLoading } = usePreviewContext();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading preview...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">No Preview Session</h1>
          <p className="text-muted-foreground">
            This preview requires a valid session token. Please launch a preview from the configurator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <PreviewNav />
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground mb-8">
          Welcome to your preview application. Explore the features you selected.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {session.features.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-1">Enabled Features</h3>
              <p className="text-3xl font-bold text-primary">{session.features.length}</p>
            </div>
          )}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-semibold text-foreground mb-1">Tier</h3>
            <p className="text-3xl font-bold text-primary capitalize">{session.tier}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-semibold text-foreground mb-1">Session Status</h3>
            <p className="text-3xl font-bold text-green-600">Active</p>
          </div>
        </div>
      </div>
    </div>
  );
}
