"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Alert } from "@/components/feedback/alert";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ConfirmButton } from "@/components/ui/confirm-button";
import CategoryForm from "@/components/helpdesk/category-form";
import { settingsApi, categoryApi } from "@/lib/helpdesk/api";
import type {
  HelpdeskSettings,
  HelpdeskCategory,
  CategoryCreateInput,
  BusinessHours,
} from "@/lib/helpdesk/types";

// =============================================================================
// Default Business Hours
// =============================================================================

const DEFAULT_SCHEDULE = [
  { day: "Monday", start: "09:00", end: "17:00" },
  { day: "Tuesday", start: "09:00", end: "17:00" },
  { day: "Wednesday", start: "09:00", end: "17:00" },
  { day: "Thursday", start: "09:00", end: "17:00" },
  { day: "Friday", start: "09:00", end: "17:00" },
];

// =============================================================================
// Page Component
// =============================================================================

export default function HelpdeskSettingsPage() {
  const [settings, setSettings] = useState<HelpdeskSettings | null>(null);
  const [categories, setCategories] = useState<HelpdeskCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Settings fields
  const [companyName, setCompanyName] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [ticketPrefix, setTicketPrefix] = useState("HD");
  const [autoAssign, setAutoAssign] = useState(false);

  // Business hours
  const [timezone, setTimezone] = useState("UTC");
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [settingsData, categoryData] = await Promise.all([
        settingsApi.get(),
        categoryApi.list(),
      ]);
      setSettings(settingsData);
      setCategories(categoryData);

      // Populate fields
      setCompanyName(settingsData.companyName ?? "");
      setSupportEmail(settingsData.supportEmail ?? "");
      setTicketPrefix(settingsData.ticketPrefix);
      setAutoAssign(settingsData.autoAssign);

      if (settingsData.businessHours) {
        setTimezone(settingsData.businessHours.timezone);
        setSchedule(settingsData.businessHours.schedule);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ---------------------------------------------------------------------------
  // Settings handlers
  // ---------------------------------------------------------------------------

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const businessHours: BusinessHours = {
        timezone,
        schedule,
      };

      await settingsApi.update({
        companyName: companyName.trim() || undefined,
        supportEmail: supportEmail.trim() || undefined,
        ticketPrefix: ticketPrefix.trim() || undefined,
        autoAssign,
        businessHours,
      });
      setSuccess("Settings saved successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Schedule handlers
  // ---------------------------------------------------------------------------

  const handleScheduleChange = (
    index: number,
    field: "start" | "end",
    value: string
  ) => {
    const updated = [...schedule];
    updated[index] = { ...updated[index], [field]: value };
    setSchedule(updated);
  };

  // ---------------------------------------------------------------------------
  // Category handlers
  // ---------------------------------------------------------------------------

  const handleAddCategory = async (data: CategoryCreateInput) => {
    const category = await categoryApi.create(data as CategoryCreateInput);
    setCategories([...categories, category]);
  };

  const handleToggleCategory = async (id: string) => {
    try {
      const updated = await categoryApi.toggleActive(id);
      setCategories(categories.map((c) => (c.id === id ? updated : c)));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to toggle category"
      );
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await categoryApi.delete(id);
      setCategories(categories.filter((c) => c.id !== id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete category"
      );
    }
  };

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: "Helpdesk", href: "/helpdesk" },
            { label: "Settings" },
          ]}
        />

        <h1 className="mt-6 text-2xl font-bold text-foreground">
          Helpdesk Settings
        </h1>
        <p className="mt-1 text-muted-foreground">
          Configure your helpdesk preferences and business information
        </p>

        <div className="mt-8 space-y-8">
          {error && (
            <Alert variant="destructive" onDismiss={() => setError(null)}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert variant="success" onDismiss={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          {/* Company Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              Company Information
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Your Company Name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supportEmail">Support Email</Label>
                <Input
                  id="supportEmail"
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  placeholder="support@yourcompany.com"
                />
              </div>
            </div>
          </div>

          {/* Ticket Settings */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              Ticket Settings
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ticketPrefix">Ticket Prefix</Label>
                <Input
                  id="ticketPrefix"
                  value={ticketPrefix}
                  onChange={(e) => setTicketPrefix(e.target.value)}
                  placeholder="HD"
                />
              </div>

              <div className="flex items-end">
                <Button
                  variant={autoAssign ? "secondary" : "outline"}
                  onClick={() => setAutoAssign(!autoAssign)}
                  type="button"
                >
                  {autoAssign
                    ? "Auto-Assign: Enabled"
                    : "Auto-Assign: Disabled"}
                </Button>
              </div>
            </div>
          </div>

          {/* Business Hours */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              Business Hours
            </h2>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="e.g. America/New_York"
              />
            </div>

            <div className="space-y-3">
              {schedule.map((slot, index) => (
                <div
                  key={slot.day}
                  className="flex items-center gap-3"
                >
                  <span className="w-28 text-sm font-medium text-foreground">
                    {slot.day}
                  </span>
                  <Input
                    type="time"
                    value={slot.start}
                    onChange={(e) =>
                      handleScheduleChange(index, "start", e.target.value)
                    }
                    className="w-32"
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="time"
                    value={slot.end}
                    onChange={(e) =>
                      handleScheduleChange(index, "end", e.target.value)
                    }
                    className="w-32"
                  />
                </div>
              ))}
            </div>
          </div>

          <Button onClick={handleSaveSettings} isLoading={isSaving}>
            Save Settings
          </Button>

          {/* Category Management */}
          <div className="space-y-4 border-t border-border pt-8">
            <h2 className="text-lg font-semibold text-foreground">
              Categories
            </h2>
            <p className="text-sm text-muted-foreground">
              Manage ticket and article categories
            </p>

            {categories.length > 0 && (
              <div className="space-y-2">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-foreground">
                        {cat.name}
                      </span>
                      {cat.description && (
                        <span className="text-sm text-muted-foreground">
                          {cat.description}
                        </span>
                      )}
                      {!cat.isActive && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleCategory(cat.id)}
                      >
                        {cat.isActive ? "Deactivate" : "Activate"}
                      </Button>
                      <ConfirmButton
                        confirmMode="dialog"
                        confirmTitle="Delete Category"
                        confirmMessage={`Are you sure you want to delete "${cat.name}"? Tickets and articles in this category will be uncategorized.`}
                        confirmLabel="Delete"
                        onConfirm={() => handleDeleteCategory(cat.id)}
                        variant="ghost"
                        size="sm"
                      >
                        Delete
                      </ConfirmButton>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add new category */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                Add New Category
              </h3>
              <CategoryForm onSubmit={handleAddCategory} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
