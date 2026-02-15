"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Save,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  ExternalLink,
  AlertTriangle,
  Info,
} from "lucide-react";
import { showSuccess, showError, showInfo } from "@/lib/toast";
import { cn, formatCurrency } from "@/lib/utils";
import { validators, validate } from "@/lib/validation";
import {
  adminApi,
  ApiError,
  type Setting as ApiSetting,
  type SettingType as ApiSettingType,
  type UpdateSettingData,
} from "@/lib/api";
import {
  Button,
  Input,
  Textarea,
  Select,
  Switch,
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Badge,
} from "@/components/ui";
import { AdminPageHeader } from "@/components/admin";

// ============================================================================
// Types
// ============================================================================

// Local setting type enum (maps to API SettingType)
type LocalSettingType = "STRING" | "NUMBER" | "BOOLEAN" | "JSON";

interface SettingsState {
  // General Settings
  siteName: string;
  siteDescription: string;
  supportEmail: string;
  contactPhone: string;
  logoUrl: string;

  // Payment Settings
  currency: string;
  taxRate: number;
  enableStripe: boolean;
  stripeLiveMode: boolean;
  stripePublicKey: string;
  stripeSecretKey: string;

  // Download Settings
  downloadLinkExpiryDays: number;
  maxDownloadsPerLicense: number;
  enableDownloadNotifications: boolean;

  // Email Settings
  fromEmail: string;
  fromName: string;
  enableOrderConfirmationEmails: boolean;
  enableDownloadReadyEmails: boolean;

  // Feature Flags
  enablePreviews: boolean;
  enableCustomBuilds: boolean;
  enableCoupons: boolean;
  maintenanceMode: boolean;
}

interface PricingTier {
  name: string;
  price: number;
  features: string[];
}

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_SETTINGS: SettingsState = {
  // General Settings
  siteName: "Starter Studio",
  siteDescription: "Build production-ready fullstack applications in days, not months.",
  supportEmail: "support@starterstudio.dev",
  contactPhone: "+1 (555) 123-4567",
  logoUrl: "/logo.svg",

  // Payment Settings
  currency: "USD",
  taxRate: 0,
  enableStripe: true,
  stripeLiveMode: false,
  stripePublicKey: "pk_test_xxxxxxxxxxxxx",
  stripeSecretKey: "sk_test_xxxxxxxxxxxxx",

  // Download Settings
  downloadLinkExpiryDays: 7,
  maxDownloadsPerLicense: 5,
  enableDownloadNotifications: true,

  // Email Settings
  fromEmail: "noreply@starterstudio.dev",
  fromName: "Starter Studio",
  enableOrderConfirmationEmails: true,
  enableDownloadReadyEmails: true,

  // Feature Flags
  enablePreviews: true,
  enableCustomBuilds: false,
  enableCoupons: true,
  maintenanceMode: false,
};

const MOCK_PRICING_TIERS: PricingTier[] = [
  {
    name: "Starter",
    price: 4900,
    features: ["Core authentication", "Basic UI components", "Email support"],
  },
  {
    name: "Pro",
    price: 14900,
    features: ["Everything in Starter", "Premium modules", "Priority support", "1 year updates"],
  },
  {
    name: "Business",
    price: 29900,
    features: ["Everything in Pro", "Custom branding", "White-label license", "Dedicated support"],
  },
];

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
  { value: "AUD", label: "AUD - Australian Dollar" },
  { value: "JPY", label: "JPY - Japanese Yen" },
  { value: "INR", label: "INR - Indian Rupee" },
];

// ============================================================================
// Helper Components
// ============================================================================

interface SectionCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  onSave?: () => void;
  onReset?: () => void;
  hasChanges?: boolean;
  saving?: boolean;
}

function SectionCard({
  title,
  description,
  children,
  onSave,
  onReset,
  hasChanges,
  saving,
}: SectionCardProps) {
  return (
    <Card className="bg-background">
      <CardHeader bordered className="p-4 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          {hasChanges && (
            <Badge variant="warning" className="flex items-center gap-1.5 self-start" role="status" aria-live="polite">
              <AlertCircle className="h-3 w-3" aria-hidden="true" />
              Unsaved changes
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-6">{children}</CardContent>
      {(onSave || onReset) && (
        <CardFooter bordered className="px-4 sm:px-6 py-4 bg-muted/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3">
          {onReset && (
            <Button
              type="button"
              variant="ghost"
              onClick={onReset}
              className="w-full sm:w-auto"
            >
              <RotateCcw className="h-4 w-4 mr-2" aria-hidden="true" />
              Reset to defaults
            </Button>
          )}
          {onSave && (
            <Button
              type="button"
              onClick={onSave}
              disabled={saving || !hasChanges}
              isLoading={saving}
              className="w-full sm:w-auto"
            >
              {!saving && <Save className="h-4 w-4 mr-2" aria-hidden="true" />}
              Save changes
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}

interface FormFieldProps {
  label: string;
  htmlFor: string;
  helpText?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

function FormField({ label, htmlFor, helpText, error, required, children }: FormFieldProps) {
  const helpId = helpText ? `${htmlFor}-help` : undefined;
  const errorId = error ? `${htmlFor}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="block text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1" aria-hidden="true">*</span>}
        {required && <span className="sr-only">(required)</span>}
      </label>
      <div aria-describedby={describedBy}>
        {children}
      </div>
      {helpText && !error && (
        <p id={helpId} className="text-xs text-muted-foreground flex items-center gap-1">
          <Info className="h-3 w-3" aria-hidden="true" />
          {helpText}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-destructive flex items-center gap-1" role="alert">
          <AlertCircle className="h-3 w-3" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

interface MaskedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

function MaskedInput({ className, ...props }: MaskedInputProps) {
  const [showValue, setShowValue] = useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={showValue ? "text" : "password"}
        className={cn("pr-10", className)}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setShowValue(!showValue)}
        className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
        aria-label={showValue ? "Hide value" : "Show value"}
      >
        {showValue ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
      </Button>
    </div>
  );
}

// Toggle removed — use Switch from @/components/ui for standard toggles.
// For warning-styled toggles, Switch with className override is used inline.

interface LogoPreviewProps {
  url: string;
}

function LogoPreview({ url }: LogoPreviewProps) {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [url]);

  if (!url) {
    return (
      <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50">
        <span className="text-xs text-muted-foreground">No logo</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-32 h-32 border-2 border-dashed border-destructive/50 rounded-lg flex items-center justify-center bg-destructive/10">
        <span className="text-xs text-destructive">Invalid URL</span>
      </div>
    );
  }

  return (
    <div className="w-32 h-32 border rounded-lg flex items-center justify-center bg-muted/50 p-4">
      <img
        src={url}
        alt="Logo preview"
        className="max-w-full max-h-full object-contain"
        onError={() => setError(true)}
      />
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [originalSettings, setOriginalSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof SettingsState, string>>>({});

  // Track changes per section
  const generalHasChanges =
    settings.siteName !== originalSettings.siteName ||
    settings.siteDescription !== originalSettings.siteDescription ||
    settings.supportEmail !== originalSettings.supportEmail ||
    settings.contactPhone !== originalSettings.contactPhone ||
    settings.logoUrl !== originalSettings.logoUrl;

  const paymentHasChanges =
    settings.currency !== originalSettings.currency ||
    settings.taxRate !== originalSettings.taxRate ||
    settings.enableStripe !== originalSettings.enableStripe ||
    settings.stripeLiveMode !== originalSettings.stripeLiveMode ||
    settings.stripePublicKey !== originalSettings.stripePublicKey ||
    settings.stripeSecretKey !== originalSettings.stripeSecretKey;

  const downloadHasChanges =
    settings.downloadLinkExpiryDays !== originalSettings.downloadLinkExpiryDays ||
    settings.maxDownloadsPerLicense !== originalSettings.maxDownloadsPerLicense ||
    settings.enableDownloadNotifications !== originalSettings.enableDownloadNotifications;

  const emailHasChanges =
    settings.fromEmail !== originalSettings.fromEmail ||
    settings.fromName !== originalSettings.fromName ||
    settings.enableOrderConfirmationEmails !== originalSettings.enableOrderConfirmationEmails ||
    settings.enableDownloadReadyEmails !== originalSettings.enableDownloadReadyEmails;

  const featureHasChanges =
    settings.enablePreviews !== originalSettings.enablePreviews ||
    settings.enableCustomBuilds !== originalSettings.enableCustomBuilds ||
    settings.enableCoupons !== originalSettings.enableCoupons ||
    settings.maintenanceMode !== originalSettings.maintenanceMode;

  const hasAnyChanges =
    generalHasChanges ||
    paymentHasChanges ||
    downloadHasChanges ||
    emailHasChanges ||
    featureHasChanges;

  // Load settings from API
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const result = await adminApi.getSettings({ limit: 100 });

        if (result.items && result.items.length > 0) {
          // Convert settings array to state object
          const loadedSettings: SettingsState = { ...DEFAULT_SETTINGS };

          // Helper to safely set setting value
          const setSetting = (settings: SettingsState, key: keyof SettingsState, value: unknown) => {
            (settings as unknown as Record<string, unknown>)[key] = value;
          };

          for (const item of result.items) {
            const key = item.key as keyof SettingsState;
            if (key in loadedSettings) {
              // Convert value based on type
              switch (item.type) {
                case "number":
                  setSetting(loadedSettings, key, parseFloat(item.value) || 0);
                  break;
                case "boolean":
                  setSetting(loadedSettings, key, item.value === "true");
                  break;
                case "json":
                  try {
                    setSetting(loadedSettings, key, JSON.parse(item.value));
                  } catch {
                    setSetting(loadedSettings, key, item.value);
                  }
                  break;
                case "string":
                default:
                  setSetting(loadedSettings, key, item.value);
                  break;
              }
            }
          }

          setSettings(loadedSettings);
          setOriginalSettings(loadedSettings);
        } else {
          // Use defaults if no settings returned
          setSettings(DEFAULT_SETTINGS);
          setOriginalSettings(DEFAULT_SETTINGS);
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
        const errorMessage = error instanceof ApiError ? error.message : "Failed to load settings";
        showError(errorMessage);
        // Fall back to defaults on error
        setSettings(DEFAULT_SETTINGS);
        setOriginalSettings(DEFAULT_SETTINGS);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Validation
  const validateSettings = useCallback(
    (section: string): boolean => {
      const newErrors: Partial<Record<keyof SettingsState, string>> = {};

      if (section === "general") {
        // Site name is required
        const siteNameError = validate(settings.siteName, validators.required);
        if (siteNameError) newErrors.siteName = siteNameError;

        // Support email - validate format if provided
        if (settings.supportEmail) {
          const emailError = validate(settings.supportEmail, validators.email);
          if (emailError) newErrors.supportEmail = emailError;
        }

        // Logo URL - validate format if provided
        if (settings.logoUrl) {
          const urlError = validate(settings.logoUrl, validators.url);
          if (urlError) newErrors.logoUrl = urlError;
        }
      }

      if (section === "payment") {
        // Tax rate must be a valid percentage
        const taxRateError = validate(settings.taxRate, validators.percentage);
        if (taxRateError) newErrors.taxRate = taxRateError;

        // Stripe key validation for live mode
        if (settings.enableStripe && settings.stripeLiveMode) {
          if (!settings.stripePublicKey.startsWith("pk_live")) {
            newErrors.stripePublicKey = "Live mode requires a live public key (pk_live_...)";
          }
          if (!settings.stripeSecretKey.startsWith("sk_live")) {
            newErrors.stripeSecretKey = "Live mode requires a live secret key (sk_live_...)";
          }
        }

        // Stripe keys are required when Stripe is enabled
        if (settings.enableStripe) {
          const publicKeyError = validate(settings.stripePublicKey, validators.required);
          if (publicKeyError) newErrors.stripePublicKey = "Stripe public key is required";

          const secretKeyError = validate(settings.stripeSecretKey, validators.required);
          if (secretKeyError) newErrors.stripeSecretKey = "Stripe secret key is required";
        }
      }

      if (section === "download") {
        // Download link expiry must be at least 1 day
        const expiryError = validate(settings.downloadLinkExpiryDays, validators.greaterThanZero);
        if (expiryError) newErrors.downloadLinkExpiryDays = "Expiry must be at least 1 day";

        // Max downloads must be at least 1
        const maxDownloadsError = validate(settings.maxDownloadsPerLicense, validators.greaterThanZero);
        if (maxDownloadsError) newErrors.maxDownloadsPerLicense = "Must allow at least 1 download";
      }

      if (section === "email") {
        // From email is required and must be valid
        const fromEmailRequired = validate(settings.fromEmail, validators.required);
        if (fromEmailRequired) {
          newErrors.fromEmail = "From email is required";
        } else {
          const fromEmailFormat = validate(settings.fromEmail, validators.email);
          if (fromEmailFormat) newErrors.fromEmail = fromEmailFormat;
        }

        // From name is required
        const fromNameError = validate(settings.fromName, validators.required);
        if (fromNameError) newErrors.fromName = "From name is required";
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [settings]
  );

  // Helper to determine setting type (returns API-compatible lowercase types)
  const getSettingType = (key: keyof SettingsState): ApiSettingType => {
    const value = settings[key];
    if (typeof value === "boolean") return "boolean";
    if (typeof value === "number") return "number";
    if (typeof value === "object") return "json";
    return "string";
  };

  // Helper to convert value to string for API
  const valueToString = (value: unknown, type: ApiSettingType): string => {
    switch (type) {
      case "boolean":
        return value ? "true" : "false";
      case "number":
        return String(value);
      case "json":
        return JSON.stringify(value);
      case "string":
      default:
        return String(value);
    }
  };

  // Save section settings
  const saveSection = async (section: string) => {
    if (!validateSettings(section)) {
      showError("Please fix the errors before saving");
      return;
    }

    setSavingSection(section);

    try {
      // Map section to setting keys
      const sectionKeys: Record<string, (keyof SettingsState)[]> = {
        general: ["siteName", "siteDescription", "supportEmail", "contactPhone", "logoUrl"],
        payment: [
          "currency",
          "taxRate",
          "enableStripe",
          "stripeLiveMode",
          "stripePublicKey",
          "stripeSecretKey",
        ],
        download: [
          "downloadLinkExpiryDays",
          "maxDownloadsPerLicense",
          "enableDownloadNotifications",
        ],
        email: [
          "fromEmail",
          "fromName",
          "enableOrderConfirmationEmails",
          "enableDownloadReadyEmails",
        ],
        features: ["enablePreviews", "enableCustomBuilds", "enableCoupons", "maintenanceMode"],
      };

      const keys = sectionKeys[section] || [];

      // Save each setting via API using adminApi
      for (const key of keys) {
        const type = getSettingType(key);
        const value = valueToString(settings[key], type);

        const updateData: UpdateSettingData = { value, type };
        await adminApi.updateSetting(key, updateData);
      }

      // Update original settings for the saved section
      const newOriginal = { ...originalSettings };
      for (const key of keys) {
        (newOriginal as Record<string, unknown>)[key] = settings[key];
      }
      setOriginalSettings(newOriginal);

      showSuccess(`${section.charAt(0).toUpperCase() + section.slice(1)} settings saved`);
    } catch (error) {
      console.error("Failed to save settings:", error);
      const errorMessage = error instanceof ApiError ? error.message : "Please try again.";
      showError("Failed to save settings", errorMessage);
    } finally {
      setSavingSection(null);
    }
  };

  // Reset section to defaults
  const resetSection = (section: string) => {
    const sectionKeys: Record<string, (keyof SettingsState)[]> = {
      general: ["siteName", "siteDescription", "supportEmail", "contactPhone", "logoUrl"],
      payment: [
        "currency",
        "taxRate",
        "enableStripe",
        "stripeLiveMode",
        "stripePublicKey",
        "stripeSecretKey",
      ],
      download: [
        "downloadLinkExpiryDays",
        "maxDownloadsPerLicense",
        "enableDownloadNotifications",
      ],
      email: [
        "fromEmail",
        "fromName",
        "enableOrderConfirmationEmails",
        "enableDownloadReadyEmails",
      ],
      features: ["enablePreviews", "enableCustomBuilds", "enableCoupons", "maintenanceMode"],
    };

    const keys = sectionKeys[section] || [];
    const newSettings = { ...settings };

    for (const key of keys) {
      (newSettings as Record<string, unknown>)[key] = DEFAULT_SETTINGS[key];
    }

    setSettings(newSettings);
    setErrors({});
    showInfo("Settings reset to defaults (not yet saved)");
  };

  // Update a single setting
  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    // Clear error when field is modified
    if (errors[key]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Settings"
          description="Configure your platform settings"
        />
        <div className="space-y-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-6 bg-muted rounded w-48 mb-4" />
              <div className="space-y-4">
                <div className="h-10 bg-muted rounded" />
                <div className="h-10 bg-muted rounded" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <AdminPageHeader
        title="Settings"
        description="Configure your platform settings and preferences"
        actions={
          hasAnyChanges && (
            <Badge variant="warning" className="flex items-center gap-2" role="status">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              You have unsaved changes
            </Badge>
          )
        }
      />

      {/* Maintenance Mode Warning */}
      {settings.maintenanceMode && (
        <div className="flex items-center gap-3 p-4 bg-warning/10 border border-warning/30 rounded-lg" role="alert" aria-live="polite">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0" aria-hidden="true" />
          <div>
            <p className="font-medium text-warning">Maintenance Mode is Active</p>
            <p className="text-sm text-muted-foreground">
              Your store is currently unavailable to customers. Disable maintenance mode to resume
              normal operations.
            </p>
          </div>
        </div>
      )}

      {/* General Settings */}
      <SectionCard
        title="General Settings"
        description="Basic information about your platform"
        hasChanges={generalHasChanges}
        saving={savingSection === "general"}
        onSave={() => saveSection("general")}
        onReset={() => resetSection("general")}
      >
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            label="Site Name"
            htmlFor="siteName"
            helpText="Displayed in the header and emails"
            error={errors.siteName}
            required
          >
            <Input
              id="siteName"
              value={settings.siteName}
              onChange={(e) => updateSetting("siteName", e.target.value)}
              placeholder="Enter site name"
            />
          </FormField>

          <FormField
            label="Support Email"
            htmlFor="supportEmail"
            helpText="Where customers can reach you"
            error={errors.supportEmail}
          >
            <Input
              id="supportEmail"
              type="email"
              value={settings.supportEmail}
              onChange={(e) => updateSetting("supportEmail", e.target.value)}
              placeholder="support@example.com"
            />
          </FormField>

          <FormField
            label="Contact Phone"
            htmlFor="contactPhone"
            helpText="Optional phone number for support"
          >
            <Input
              id="contactPhone"
              type="tel"
              value={settings.contactPhone}
              onChange={(e) => updateSetting("contactPhone", e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
          </FormField>

          <FormField
            label="Logo URL"
            htmlFor="logoUrl"
            helpText="URL to your logo image"
            error={errors.logoUrl}
          >
            <Input
              id="logoUrl"
              value={settings.logoUrl}
              onChange={(e) => updateSetting("logoUrl", e.target.value)}
              placeholder="https://example.com/logo.png"
            />
          </FormField>
        </div>

        <FormField
          label="Site Description"
          htmlFor="siteDescription"
          helpText="Used for SEO and meta descriptions"
        >
          <Textarea
            id="siteDescription"
            value={settings.siteDescription}
            onChange={(e) => updateSetting("siteDescription", e.target.value)}
            rows={3}
            placeholder="Describe your platform..."
          />
        </FormField>

        {settings.logoUrl && (
          <div>
            <label className="block text-sm font-medium mb-2">Logo Preview</label>
            <LogoPreview url={settings.logoUrl} />
          </div>
        )}
      </SectionCard>

      {/* Payment Settings */}
      <SectionCard
        title="Payment Settings"
        description="Configure payment processing and taxes"
        hasChanges={paymentHasChanges}
        saving={savingSection === "payment"}
        onSave={() => saveSection("payment")}
        onReset={() => resetSection("payment")}
      >
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            label="Currency"
            htmlFor="currency"
            helpText="Primary currency for all transactions"
          >
            <Select
              id="currency"
              value={settings.currency}
              onChange={(value) => updateSetting("currency", value)}
              options={CURRENCY_OPTIONS}
            />
          </FormField>

          <FormField
            label="Tax Rate"
            htmlFor="taxRate"
            helpText="Percentage added to order totals"
            error={errors.taxRate}
          >
            <div className="relative">
              <Input
                id="taxRate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={settings.taxRate}
                onChange={(e) => updateSetting("taxRate", parseFloat(e.target.value) || 0)}
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                %
              </span>
            </div>
          </FormField>
        </div>

        <div className="border-t pt-6 space-y-4">
          <h3 className="font-medium">Stripe Integration</h3>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Enable Stripe</p>
              <p className="text-xs text-muted-foreground">
                Accept credit card payments via Stripe
              </p>
            </div>
            <Switch
              checked={settings.enableStripe}
              onChange={(checked) => updateSetting("enableStripe", checked)}
            />
          </div>

          {settings.enableStripe && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Stripe Live Mode</p>
                  <p className="text-xs text-muted-foreground">
                    Process real payments (disable for testing)
                  </p>
                </div>
                <Switch
                  checked={settings.stripeLiveMode}
                  onChange={(checked) => updateSetting("stripeLiveMode", checked)}
                />
              </div>

              {settings.stripeLiveMode && (
                <div className="flex items-center gap-2 p-3 bg-warning/10 rounded-md" role="alert">
                  <AlertTriangle className="h-4 w-4 text-warning shrink-0" aria-hidden="true" />
                  <p className="text-sm text-warning">
                    Live mode is enabled. Real payments will be processed.
                  </p>
                </div>
              )}

              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  label="Stripe Public Key"
                  htmlFor="stripePublicKey"
                  helpText={
                    settings.stripeLiveMode ? "Use pk_live_... key" : "Use pk_test_... key"
                  }
                  error={errors.stripePublicKey}
                >
                  <MaskedInput
                    id="stripePublicKey"
                    value={settings.stripePublicKey}
                    onChange={(e) => updateSetting("stripePublicKey", e.target.value)}
                    placeholder="pk_..."
                  />
                </FormField>

                <FormField
                  label="Stripe Secret Key"
                  htmlFor="stripeSecretKey"
                  helpText={
                    settings.stripeLiveMode ? "Use sk_live_... key" : "Use sk_test_... key"
                  }
                  error={errors.stripeSecretKey}
                >
                  <MaskedInput
                    id="stripeSecretKey"
                    value={settings.stripeSecretKey}
                    onChange={(e) => updateSetting("stripeSecretKey", e.target.value)}
                    placeholder="sk_..."
                  />
                </FormField>
              </div>
            </>
          )}
        </div>
      </SectionCard>

      {/* Download Settings */}
      <SectionCard
        title="Download Settings"
        description="Configure how customers receive their purchases"
        hasChanges={downloadHasChanges}
        saving={savingSection === "download"}
        onSave={() => saveSection("download")}
        onReset={() => resetSection("download")}
      >
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            label="Download Link Expiry"
            htmlFor="downloadLinkExpiryDays"
            helpText="Days until download links expire"
            error={errors.downloadLinkExpiryDays}
          >
            <div className="relative">
              <Input
                id="downloadLinkExpiryDays"
                type="number"
                min="1"
                max="365"
                value={settings.downloadLinkExpiryDays}
                onChange={(e) =>
                  updateSetting("downloadLinkExpiryDays", parseInt(e.target.value) || 1)
                }
                className="pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                days
              </span>
            </div>
          </FormField>

          <FormField
            label="Max Downloads per License"
            htmlFor="maxDownloadsPerLicense"
            helpText="Maximum number of downloads allowed"
            error={errors.maxDownloadsPerLicense}
          >
            <Input
              id="maxDownloadsPerLicense"
              type="number"
              min="1"
              max="100"
              value={settings.maxDownloadsPerLicense}
              onChange={(e) =>
                updateSetting("maxDownloadsPerLicense", parseInt(e.target.value) || 1)
              }
            />
          </FormField>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Enable Download Notifications</p>
            <p className="text-xs text-muted-foreground">
              Send email notifications when downloads are triggered
            </p>
          </div>
          <Switch
            checked={settings.enableDownloadNotifications}
            onChange={(checked) => updateSetting("enableDownloadNotifications", checked)}
          />
        </div>
      </SectionCard>

      {/* Email Settings */}
      <SectionCard
        title="Email Settings"
        description="Configure outgoing email settings"
        hasChanges={emailHasChanges}
        saving={savingSection === "email"}
        onSave={() => saveSection("email")}
        onReset={() => resetSection("email")}
      >
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            label="From Email"
            htmlFor="fromEmail"
            helpText="Email address for outgoing emails"
            error={errors.fromEmail}
            required
          >
            <Input
              id="fromEmail"
              type="email"
              value={settings.fromEmail}
              onChange={(e) => updateSetting("fromEmail", e.target.value)}
              placeholder="noreply@example.com"
            />
          </FormField>

          <FormField
            label="From Name"
            htmlFor="fromName"
            helpText="Display name for outgoing emails"
            error={errors.fromName}
            required
          >
            <Input
              id="fromName"
              value={settings.fromName}
              onChange={(e) => updateSetting("fromName", e.target.value)}
              placeholder="Your Company Name"
            />
          </FormField>
        </div>

        <div className="border-t pt-6 space-y-4">
          <h3 className="font-medium">Email Notifications</h3>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Order Confirmation Emails</p>
              <p className="text-xs text-muted-foreground">
                Send confirmation email when an order is placed
              </p>
            </div>
            <Switch
              checked={settings.enableOrderConfirmationEmails}
              onChange={(checked) => updateSetting("enableOrderConfirmationEmails", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Download Ready Emails</p>
              <p className="text-xs text-muted-foreground">
                Send email when download is ready after purchase
              </p>
            </div>
            <Switch
              checked={settings.enableDownloadReadyEmails}
              onChange={(checked) => updateSetting("enableDownloadReadyEmails", checked)}
            />
          </div>
        </div>
      </SectionCard>

      {/* Feature Flags */}
      <SectionCard
        title="Feature Flags"
        description="Enable or disable platform features"
        hasChanges={featureHasChanges}
        saving={savingSection === "features"}
        onSave={() => saveSection("features")}
        onReset={() => resetSection("features")}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Enable Previews</p>
              <p className="text-xs text-muted-foreground">
                Allow customers to preview templates before purchasing
              </p>
            </div>
            <Switch
              checked={settings.enablePreviews}
              onChange={(checked) => updateSetting("enablePreviews", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Enable Custom Builds</p>
              <p className="text-xs text-muted-foreground">
                Allow customers to customize template features
              </p>
            </div>
            <Switch
              checked={settings.enableCustomBuilds}
              onChange={(checked) => updateSetting("enableCustomBuilds", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Enable Coupons</p>
              <p className="text-xs text-muted-foreground">
                Allow discount codes at checkout
              </p>
            </div>
            <Switch
              checked={settings.enableCoupons}
              onChange={(checked) => updateSetting("enableCoupons", checked)}
            />
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium flex items-center gap-2">
                  Maintenance Mode
                  <Badge variant="destructive" size="sm">
                    Caution
                  </Badge>
                </p>
                <p className="text-xs text-muted-foreground">
                  Take your store offline temporarily
                </p>
              </div>
              <Switch
                checked={settings.maintenanceMode}
                onChange={(checked) => updateSetting("maintenanceMode", checked)}
              />
            </div>

            {settings.maintenanceMode && (
              <div className="mt-3 flex items-center gap-2 p-3 bg-destructive/10 rounded-md" role="alert">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0" aria-hidden="true" />
                <p className="text-sm text-destructive">
                  When enabled, only admins can access the store. All customer-facing pages will
                  show a maintenance message.
                </p>
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      {/* Pricing Tiers (Read-only) */}
      <SectionCard
        title="Pricing Tiers"
        description="Current pricing configuration (read-only reference)"
      >
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {MOCK_PRICING_TIERS.map((tier) => (
            <Card
              key={tier.name}
              variant="outline"
              className="p-4 bg-muted/20"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">{tier.name}</h4>
                <span className="text-lg font-bold">{formatCurrency(tier.price)}</span>
              </div>
              <ul className="space-y-1">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
        <div className="pt-4 border-t">
          <a
            href="/admin/templates"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            Manage templates and pricing
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </SectionCard>

      {/* Global Save All Button (sticky at bottom when there are changes) */}
      {hasAnyChanges && (
        <div className="sticky bottom-4 sm:bottom-6 flex justify-center sm:justify-end">
          <Card className="p-3 sm:p-4 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 shadow-lg w-full sm:w-auto mx-4 sm:mx-0">
            <span className="text-sm text-muted-foreground text-center sm:text-left">
              {[
                generalHasChanges && "General",
                paymentHasChanges && "Payment",
                downloadHasChanges && "Download",
                emailHasChanges && "Email",
                featureHasChanges && "Features",
              ]
                .filter(Boolean)
                .join(", ")}{" "}
              settings have unsaved changes
            </span>
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={async () => {
                if (generalHasChanges) await saveSection("general");
                if (paymentHasChanges) await saveSection("payment");
                if (downloadHasChanges) await saveSection("download");
                if (emailHasChanges) await saveSection("email");
                if (featureHasChanges) await saveSection("features");
              }}
            >
              <Save className="h-4 w-4 mr-2" />
              Save All Changes
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
