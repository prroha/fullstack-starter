"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Wand2,
  Package,
  Mail,
  User,
  Check,
  Copy,
  Download,
  ChevronDown,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { adminApi } from "@/lib/api";
import { showSuccess, showError } from "@/lib/toast";
import {
  Button,
  Input,
  Label,
  Badge,
  Switch,
  Textarea,
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui";
import { AdminPageHeader, TierBadge } from "@/components/admin";

interface GenerateOptions {
  tiers: Array<{
    slug: string;
    name: string;
    price: number;
    includedFeatures: string[];
  }>;
  features: Array<{
    slug: string;
    name: string;
    price: number;
    tier: string | null;
    requires: string[];
    conflicts: string[];
    module: { name: string; slug: string; category: string };
  }>;
  templates: Array<{
    id: string;
    slug: string;
    name: string;
    tier: string;
    includedFeatures: string[];
  }>;
}

interface GenerateResult {
  order: {
    id: string;
    orderNumber: string;
    customerEmail: string;
    tier: string;
    status: string;
    selectedFeatures: string[];
    createdAt: string;
  };
  license: {
    id: string;
    licenseKey: string;
    downloadToken: string;
    expiresAt: string;
  };
  downloadUrl: string;
}

export default function GeneratePage() {
  // Options
  const [options, setOptions] = useState<GenerateOptions | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [selectedTier, setSelectedTier] = useState("");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [sendEmail, setSendEmail] = useState(false);
  const [notes, setNotes] = useState("");
  const [generating, setGenerating] = useState(false);

  // Result
  const [result, setResult] = useState<GenerateResult | null>(null);

  // Expanded modules
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // Load options
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const data = await adminApi.get<GenerateOptions>("/admin/generate/options");
        setOptions(data);
        if (data.tiers.length > 0) {
          setSelectedTier(data.tiers[0].slug);
        }
      } catch (err) {
        showError("Failed to load generation options");
      } finally {
        setLoading(false);
      }
    };
    loadOptions();
  }, []);

  // Get current tier
  const currentTier = options?.tiers.find((t) => t.slug === selectedTier);
  const tierIncludedFeatures = new Set(currentTier?.includedFeatures || []);

  // Group features by module
  const featuresByModule = options?.features.reduce(
    (acc, feature) => {
      const moduleKey = feature.module.slug;
      if (!acc[moduleKey]) {
        acc[moduleKey] = {
          name: feature.module.name,
          category: feature.module.category,
          features: [],
        };
      }
      acc[moduleKey].features.push(feature);
      return acc;
    },
    {} as Record<string, { name: string; category: string; features: typeof options.features }>
  ) || {};

  const toggleModule = (slug: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const toggleFeature = (slug: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const applyTemplate = (templateId: string) => {
    const template = options?.templates.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setSelectedTier(template.tier);
      setSelectedFeatures(template.includedFeatures);
    }
  };

  const handleGenerate = async () => {
    if (!customerEmail || !selectedTier || selectedFeatures.length === 0) {
      showError("Please fill in all required fields");
      return;
    }

    setGenerating(true);
    try {
      const data = await adminApi.post<GenerateResult>("/admin/generate", {
        customerEmail,
        customerName: customerName || undefined,
        tier: selectedTier,
        selectedFeatures,
        templateId: selectedTemplate,
        sendEmail,
        notes: notes || undefined,
      });
      setResult(data);
      showSuccess("Project generated successfully!");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showSuccess(`${label} copied to clipboard`);
  };

  const handleReset = () => {
    setResult(null);
    setCustomerEmail("");
    setCustomerName("");
    setSelectedFeatures([]);
    setSelectedTemplate(null);
    setNotes("");
    setSendEmail(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid gap-6 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Show result
  if (result) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Generation Complete"
          description="The project has been generated successfully"
        />

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-full bg-success/10">
                <Check className="h-6 w-6 text-success" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Project Generated</h2>
                <p className="text-muted-foreground">
                  Order #{result.order.orderNumber}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <h3 className="font-semibold">Order Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Customer</span>
                    <span>{result.order.customerEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tier</span>
                    <TierBadge tier={result.order.tier} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Features</span>
                    <span>{result.order.selectedFeatures.length} selected</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant="success">Completed</Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">License Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">License Key</span>
                    <div className="flex items-center gap-1">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {result.license.licenseKey}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(result.license.licenseKey, "License key")}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Download Token</span>
                    <div className="flex items-center gap-1">
                      <code className="text-xs bg-muted px-2 py-1 rounded truncate max-w-[200px]">
                        {result.license.downloadToken}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(result.license.downloadToken, "Download token")}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expires</span>
                    <span>{new Date(result.license.expiresAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter bordered className="gap-3">
            <Button onClick={handleReset}>
              <Wand2 className="h-4 w-4 mr-2" />
              Generate Another
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open(
                `${process.env.NEXT_PUBLIC_API_URL}${result.downloadUrl}`,
                "_blank"
              )}
            >
              <Download className="h-4 w-4 mr-2" />
              Download ZIP
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Generate App"
        description="Generate a custom app for a customer without payment"
        actions={
          <Button
            onClick={handleGenerate}
            disabled={generating || !customerEmail || !selectedTier || selectedFeatures.length === 0}
            isLoading={generating}
          >
            <Wand2 className="h-4 w-4 mr-2" />
            {generating ? "Generating..." : "Generate Project"}
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Customer Details + Tier Selection */}
        <div className="space-y-6">
          {/* Customer Details */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer Details
              </h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label required>Email</Label>
                <Input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="customer@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label>Send Email</Label>
                  <p className="text-xs text-muted-foreground">
                    Send order confirmation with download link
                  </p>
                </div>
                <Switch checked={sendEmail} onChange={setSendEmail} />
              </div>
              <div className="space-y-2">
                <Label>Internal Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Optional notes..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Tier Selection */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold flex items-center gap-2">
                <Package className="h-4 w-4" />
                Tier
              </h2>
            </CardHeader>
            <CardContent className="space-y-2">
              {options?.tiers.map((tier) => (
                <Button
                  key={tier.slug}
                  variant="outline"
                  onClick={() => setSelectedTier(tier.slug)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 h-auto text-left",
                    selectedTier === tier.slug
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  )}
                >
                  <div>
                    <p className="font-medium">{tier.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {tier.includedFeatures.length} features included
                    </p>
                  </div>
                  {selectedTier === tier.slug && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Quick Templates */}
          {options?.templates && options.templates.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="font-semibold">Quick Templates</h2>
              </CardHeader>
              <CardContent className="space-y-2">
                {options.templates.map((template) => (
                  <Button
                    key={template.id}
                    variant="outline"
                    onClick={() => applyTemplate(template.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 h-auto text-left",
                      selectedTemplate === template.id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    )}
                  >
                    <div>
                      <p className="font-medium">{template.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {template.includedFeatures.length} features
                      </p>
                    </div>
                    {selectedTemplate === template.id && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Center: Feature Selection */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">
                  Features ({selectedFeatures.length} selected)
                </h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const all = options?.features.map((f) => f.slug) || [];
                      setSelectedFeatures(all);
                    }}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFeatures([])}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {Object.entries(featuresByModule).map(([moduleSlug, module]) => (
                  <div key={moduleSlug}>
                    <Button
                      variant="ghost"
                      onClick={() => toggleModule(moduleSlug)}
                      className="w-full flex items-center justify-between p-4 h-auto rounded-none"
                    >
                      <div className="flex items-center gap-2">
                        {expandedModules.has(moduleSlug) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <span className="font-medium">{module.name}</span>
                        <Badge variant="secondary" size="sm">
                          {module.features.filter((f) => selectedFeatures.includes(f.slug)).length}/{module.features.length}
                        </Badge>
                      </div>
                      <Badge variant="outline" size="sm">{module.category}</Badge>
                    </Button>
                    {expandedModules.has(moduleSlug) && (
                      <div className="px-4 pb-4 space-y-2">
                        {module.features.map((feature) => {
                          const isSelected = selectedFeatures.includes(feature.slug);
                          const isIncluded = tierIncludedFeatures.has(feature.slug);
                          return (
                            <label
                              key={feature.slug}
                              className={cn(
                                "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
                                isSelected
                                  ? "border-primary bg-primary/5"
                                  : isIncluded
                                    ? "border-success/20 bg-success/10"
                                    : "hover:bg-muted/50"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleFeature(feature.slug)}
                                  className="rounded"
                                />
                                <div>
                                  <p className="text-sm font-medium">{feature.name}</p>
                                  {isIncluded && (
                                    <p className="text-xs text-success">Included in tier</p>
                                  )}
                                </div>
                              </div>
                              {feature.price > 0 && !isIncluded && (
                                <span className="text-sm text-muted-foreground">
                                  {formatCurrency(feature.price)}
                                </span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
