"use client";

import { useState, useEffect, useCallback } from "react";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Alert } from "@/components/feedback/alert";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { settingsApi } from "@/lib/events/api";
import { EVENT_VIEW_OPTIONS } from "@/lib/events/constants";
import type { EventSettings as EventSettingsType } from "@/lib/events/types";

export default function EventSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [defaultView, setDefaultView] = useState("LIST");
  const [currency, setCurrency] = useState("USD");
  const [timezone, setTimezone] = useState("UTC");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const settingsData = await settingsApi.get();
      setDefaultView(settingsData.defaultView);
      setCurrency(settingsData.currency);
      setTimezone(settingsData.timezone);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await settingsApi.update({
        defaultView: defaultView as EventSettingsType["defaultView"],
        currency,
        timezone,
      });
      setSuccess("Settings saved successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (<div className="flex items-center justify-center min-h-screen"><Spinner size="lg" /></div>);
  }

  const currencyOptions = [
    { value: "USD", label: "USD - US Dollar" },
    { value: "EUR", label: "EUR - Euro" },
    { value: "GBP", label: "GBP - British Pound" },
    { value: "CAD", label: "CAD - Canadian Dollar" },
    { value: "AUD", label: "AUD - Australian Dollar" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: "Events", href: "/events" }, { label: "Settings" }]} />
        <h1 className="mt-6 text-2xl font-bold text-foreground">Event Settings</h1>
        <p className="mt-1 text-muted-foreground">Configure your event management preferences</p>

        <div className="mt-8 space-y-8">
          {error && (<Alert variant="destructive" onDismiss={() => setError(null)}>{error}</Alert>)}
          {success && (<Alert variant="success" onDismiss={() => setSuccess(null)}>{success}</Alert>)}

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Display Preferences</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Default View</Label>
                <Select value={defaultView} onChange={setDefaultView} options={EVENT_VIEW_OPTIONS} />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={currency} onChange={setCurrency} options={currencyOptions} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Regional Settings</h2>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input id="timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="e.g. America/New_York" />
            </div>
          </div>

          <Button onClick={handleSave} isLoading={isSaving}>Save Settings</Button>
        </div>
      </div>
    </div>
  );
}
