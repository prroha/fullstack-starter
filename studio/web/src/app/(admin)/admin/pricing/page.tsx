"use client";

import { useState, useEffect, useMemo } from "react";
import {
  DollarSign,
  Percent,
  Tag,
  Plus,
  Pencil,
  Trash2,
  Check,
  Sparkles,
  Crown,
  Briefcase,
  Building2,
  Package,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  Button,
  Input,
  Select,
  Textarea,
  Switch,
  Label,
  Badge,
  StatCard,
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Dialog,
  DialogBody,
  DialogFooter,
  SkeletonCard,
  EmptySearch,
  EmptyList,
} from "@/components/ui";
import { AdminPageHeader, TierBadge } from "@/components/admin";
import { cn, formatCurrency, formatDate, formatNumber } from "@/lib/utils";

// =============================================================================
// Types
// =============================================================================

type DiscountType = "PERCENTAGE" | "FIXED";

interface PricingTier {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number; // in cents
  includedFeatures: string[];
  isPopular: boolean;
  displayOrder: number;
  color: string | null;
  isActive: boolean;
  stats?: {
    totalOrders: number;
    totalRevenue: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface BundleDiscount {
  id: string;
  name: string;
  description: string | null;
  type: DiscountType;
  value: number; // percentage (0-100) or cents for fixed
  minItems: number;
  applicableTiers: string[];
  applicableFeatures: string[];
  isActive: boolean;
  startsAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TierFormData {
  name: string;
  description: string;
  price: number; // in dollars
  includedFeatures: string;
  isPopular: boolean;
  color: string;
  isActive: boolean;
}

interface BundleFormData {
  name: string;
  description: string;
  type: DiscountType;
  value: number;
  minItems: number;
  applicableTiers: string[];
  isActive: boolean;
  startsAt: string;
  expiresAt: string;
}

interface PricingStats {
  totalTiers: number;
  activeTiers: number;
  totalBundles: number;
  activeBundles: number;
}

// =============================================================================
// Constants
// =============================================================================

const TIER_ICONS: Record<string, React.ReactNode> = {
  starter: <Sparkles className="h-6 w-6" />,
  pro: <Crown className="h-6 w-6" />,
  business: <Briefcase className="h-6 w-6" />,
  enterprise: <Building2 className="h-6 w-6" />,
};

const TIER_COLORS: Record<string, string> = {
  starter: "text-emerald-500",
  pro: "text-blue-500",
  business: "text-purple-500",
  enterprise: "text-amber-500",
};

const DISCOUNT_TYPE_OPTIONS = [
  { value: "PERCENTAGE", label: "Percentage" },
  { value: "FIXED", label: "Fixed Amount" },
];

const INITIAL_TIER_FORM: TierFormData = {
  name: "",
  description: "",
  price: 0,
  includedFeatures: "",
  isPopular: false,
  color: "",
  isActive: true,
};

const INITIAL_BUNDLE_FORM: BundleFormData = {
  name: "",
  description: "",
  type: "PERCENTAGE",
  value: 10,
  minItems: 2,
  applicableTiers: [],
  isActive: true,
  startsAt: "",
  expiresAt: "",
};

// =============================================================================
// Mock Data
// =============================================================================

const MOCK_TIERS: PricingTier[] = [
  {
    id: "1",
    slug: "starter",
    name: "STARTER",
    description: "Perfect for exploring the platform. Get started with core features at no cost.",
    price: 0,
    includedFeatures: ["Basic authentication", "Core UI components", "Email support", "Community access"],
    isPopular: false,
    displayOrder: 0,
    color: "emerald",
    isActive: true,
    stats: { totalOrders: 1234, totalRevenue: 0 },
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    slug: "pro",
    name: "PRO",
    description: "For professional developers who need advanced features and priority support.",
    price: 14900,
    includedFeatures: ["Everything in Starter", "Premium modules", "Priority support", "1 year updates", "API access"],
    isPopular: true,
    displayOrder: 1,
    color: "blue",
    isActive: true,
    stats: { totalOrders: 567, totalRevenue: 8434300 },
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "3",
    slug: "business",
    name: "BUSINESS",
    description: "Scale your business with advanced features, team collaboration, and dedicated support.",
    price: 29900,
    includedFeatures: ["Everything in Pro", "Custom branding", "Team licenses", "White-label option", "Dedicated support"],
    isPopular: false,
    displayOrder: 2,
    color: "purple",
    isActive: true,
    stats: { totalOrders: 234, totalRevenue: 6996600 },
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "4",
    slug: "enterprise",
    name: "ENTERPRISE",
    description: "Full enterprise solution with custom integrations, SLA, and white-glove onboarding.",
    price: 49900,
    includedFeatures: ["Everything in Business", "Custom integrations", "SLA guarantee", "White-glove onboarding", "Source code access"],
    isPopular: false,
    displayOrder: 3,
    color: "amber",
    isActive: true,
    stats: { totalOrders: 45, totalRevenue: 2245500 },
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
];

const MOCK_BUNDLES: BundleDiscount[] = [
  {
    id: "1",
    name: "Multi-Module Discount",
    description: "Save 15% when purchasing 3 or more modules",
    type: "PERCENTAGE",
    value: 15,
    minItems: 3,
    applicableTiers: ["pro", "business", "enterprise"],
    applicableFeatures: [],
    isActive: true,
    startsAt: null,
    expiresAt: null,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    name: "Enterprise Bundle",
    description: "Get $100 off when buying 5+ features with Enterprise tier",
    type: "FIXED",
    value: 10000,
    minItems: 5,
    applicableTiers: ["enterprise"],
    applicableFeatures: [],
    isActive: true,
    startsAt: null,
    expiresAt: null,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "3",
    name: "Holiday Bundle Special",
    description: "Limited time: 20% off any bundle of 2+ items",
    type: "PERCENTAGE",
    value: 20,
    minItems: 2,
    applicableTiers: [],
    applicableFeatures: [],
    isActive: false,
    startsAt: "2024-12-01T00:00:00Z",
    expiresAt: "2024-12-31T23:59:59Z",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
];

// =============================================================================
// Helper Functions
// =============================================================================

function formatDiscountValue(bundle: BundleDiscount): string {
  if (bundle.type === "PERCENTAGE") {
    return `${bundle.value}%`;
  }
  return formatCurrency(bundle.value);
}

function getBundleStatus(bundle: BundleDiscount): "ACTIVE" | "INACTIVE" | "SCHEDULED" | "EXPIRED" {
  if (!bundle.isActive) return "INACTIVE";

  const now = new Date();
  if (bundle.startsAt && new Date(bundle.startsAt) > now) return "SCHEDULED";
  if (bundle.expiresAt && new Date(bundle.expiresAt) < now) return "EXPIRED";

  return "ACTIVE";
}

// =============================================================================
// Sub-Components
// =============================================================================

function TierCard({
  tier,
  onEdit,
}: {
  tier: PricingTier;
  onEdit: (tier: PricingTier) => void;
}) {
  const icon = TIER_ICONS[tier.slug] || <Package className="h-6 w-6" />;
  const colorClass = TIER_COLORS[tier.slug] || "text-gray-500";

  return (
    <Card className={cn("relative", !tier.isActive && "opacity-60")}>
      {tier.isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="default" className="shadow-md">
            Most Popular
          </Badge>
        </div>
      )}

      <CardHeader bordered className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg bg-muted", colorClass)}>
              {icon}
            </div>
            <div>
              <h3 className="font-bold text-lg">{tier.name}</h3>
              {!tier.isActive && (
                <Badge variant="secondary" size="sm">Inactive</Badge>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onEdit(tier)}>
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="py-4">
        <div className="mb-4">
          <span className="text-3xl font-bold">
            {tier.price === 0 ? "Free" : formatCurrency(tier.price)}
          </span>
          {tier.price > 0 && (
            <span className="text-muted-foreground text-sm ml-1">one-time</span>
          )}
        </div>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {tier.description}
        </p>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Included Features:</h4>
          <ul className="space-y-1.5">
            {tier.includedFeatures.slice(0, 4).map((feature, idx) => (
              <li key={idx} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-success shrink-0" />
                <span className="text-muted-foreground">{feature}</span>
              </li>
            ))}
            {tier.includedFeatures.length > 4 && (
              <li className="text-sm text-muted-foreground pl-6">
                +{tier.includedFeatures.length - 4} more features
              </li>
            )}
          </ul>
        </div>
      </CardContent>

      <CardFooter bordered className="py-3 bg-muted/30">
        <div className="flex items-center justify-between w-full text-sm">
          <span className="text-muted-foreground">
            {formatNumber(tier.stats?.totalOrders || 0)} orders
          </span>
          <span className="font-medium">
            {formatCurrency(tier.stats?.totalRevenue || 0)} revenue
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}

function BundleStatusBadge({ status }: { status: "ACTIVE" | "INACTIVE" | "SCHEDULED" | "EXPIRED" }) {
  const variants: Record<typeof status, "success" | "secondary" | "warning" | "destructive"> = {
    ACTIVE: "success",
    INACTIVE: "secondary",
    SCHEDULED: "warning",
    EXPIRED: "destructive",
  };

  const labels: Record<typeof status, string> = {
    ACTIVE: "Active",
    INACTIVE: "Inactive",
    SCHEDULED: "Scheduled",
    EXPIRED: "Expired",
  };

  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
}

function BundleCard({
  bundle,
  tiers,
  onEdit,
  onDelete,
  onToggle,
}: {
  bundle: BundleDiscount;
  tiers: PricingTier[];
  onEdit: (bundle: BundleDiscount) => void;
  onDelete: (bundle: BundleDiscount) => void;
  onToggle: (bundle: BundleDiscount) => void;
}) {
  const status = getBundleStatus(bundle);

  return (
    <Card className={cn(!bundle.isActive && "opacity-60")}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium truncate">{bundle.name}</h4>
              <BundleStatusBadge status={status} />
            </div>
            {bundle.description && (
              <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                {bundle.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div className="flex items-center gap-1">
                {bundle.type === "PERCENTAGE" ? (
                  <Percent className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="font-medium">{formatDiscountValue(bundle)}</span>
                <span className="text-muted-foreground">off</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Package className="h-4 w-4" />
                <span>Min {bundle.minItems} items</span>
              </div>
              {bundle.applicableTiers.length > 0 && (
                <div className="flex items-center gap-1">
                  {bundle.applicableTiers.slice(0, 2).map((slug) => {
                    const tier = tiers.find((t) => t.slug === slug);
                    return tier ? (
                      <TierBadge key={slug} tier={tier.name} />
                    ) : null;
                  })}
                  {bundle.applicableTiers.length > 2 && (
                    <span className="text-xs text-muted-foreground">
                      +{bundle.applicableTiers.length - 2} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Switch
              checked={bundle.isActive}
              onChange={() => onToggle(bundle)}
              aria-label="Toggle active status"
            />
            <Button variant="ghost" size="icon" onClick={() => onEdit(bundle)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(bundle)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export default function PricingPage() {
  // State
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [bundles, setBundles] = useState<BundleDiscount[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isTierModalOpen, setIsTierModalOpen] = useState(false);
  const [isBundleModalOpen, setIsBundleModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<PricingTier | null>(null);
  const [editingBundle, setEditingBundle] = useState<BundleDiscount | null>(null);
  const [deletingBundle, setDeletingBundle] = useState<BundleDiscount | null>(null);
  const [tierFormData, setTierFormData] = useState<TierFormData>(INITIAL_TIER_FORM);
  const [bundleFormData, setBundleFormData] = useState<BundleFormData>(INITIAL_BUNDLE_FORM);
  const [isSaving, setIsSaving] = useState(false);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      setTiers(MOCK_TIERS);
      setBundles(MOCK_BUNDLES);
      setLoading(false);
    };

    loadData();
  }, []);

  // Computed Stats
  const stats: PricingStats = useMemo(() => {
    return {
      totalTiers: tiers.length,
      activeTiers: tiers.filter((t) => t.isActive).length,
      totalBundles: bundles.length,
      activeBundles: bundles.filter((b) => b.isActive).length,
    };
  }, [tiers, bundles]);

  // =============================================================================
  // Tier Handlers
  // =============================================================================

  const handleOpenEditTierModal = (tier: PricingTier) => {
    setEditingTier(tier);
    setTierFormData({
      name: tier.name,
      description: tier.description,
      price: tier.price / 100,
      includedFeatures: tier.includedFeatures.join("\n"),
      isPopular: tier.isPopular,
      color: tier.color || "",
      isActive: tier.isActive,
    });
    setIsTierModalOpen(true);
  };

  const handleCloseTierModal = () => {
    setIsTierModalOpen(false);
    setEditingTier(null);
    setTierFormData(INITIAL_TIER_FORM);
  };

  const handleSaveTier = async () => {
    if (!editingTier) return;

    setIsSaving(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    const updatedTier: PricingTier = {
      ...editingTier,
      name: tierFormData.name,
      description: tierFormData.description,
      price: Math.round(tierFormData.price * 100),
      includedFeatures: tierFormData.includedFeatures
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean),
      isPopular: tierFormData.isPopular,
      color: tierFormData.color || null,
      isActive: tierFormData.isActive,
      updatedAt: new Date().toISOString(),
    };

    setTiers((prev) =>
      prev.map((t) => (t.id === editingTier.id ? updatedTier : t))
    );

    setIsSaving(false);
    handleCloseTierModal();
    toast.success("Pricing tier updated successfully");
  };

  // =============================================================================
  // Bundle Handlers
  // =============================================================================

  const handleOpenCreateBundleModal = () => {
    setEditingBundle(null);
    setBundleFormData(INITIAL_BUNDLE_FORM);
    setIsBundleModalOpen(true);
  };

  const handleOpenEditBundleModal = (bundle: BundleDiscount) => {
    setEditingBundle(bundle);
    setBundleFormData({
      name: bundle.name,
      description: bundle.description || "",
      type: bundle.type,
      value: bundle.type === "FIXED" ? bundle.value / 100 : bundle.value,
      minItems: bundle.minItems,
      applicableTiers: bundle.applicableTiers,
      isActive: bundle.isActive,
      startsAt: bundle.startsAt ? bundle.startsAt.split("T")[0] : "",
      expiresAt: bundle.expiresAt ? bundle.expiresAt.split("T")[0] : "",
    });
    setIsBundleModalOpen(true);
  };

  const handleCloseBundleModal = () => {
    setIsBundleModalOpen(false);
    setEditingBundle(null);
    setBundleFormData(INITIAL_BUNDLE_FORM);
  };

  const handleSaveBundle = async () => {
    setIsSaving(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    const bundleData: Omit<BundleDiscount, "id" | "createdAt" | "updatedAt"> = {
      name: bundleFormData.name,
      description: bundleFormData.description || null,
      type: bundleFormData.type,
      value: bundleFormData.type === "FIXED"
        ? Math.round(bundleFormData.value * 100)
        : bundleFormData.value,
      minItems: bundleFormData.minItems,
      applicableTiers: bundleFormData.applicableTiers,
      applicableFeatures: [],
      isActive: bundleFormData.isActive,
      startsAt: bundleFormData.startsAt
        ? new Date(bundleFormData.startsAt).toISOString()
        : null,
      expiresAt: bundleFormData.expiresAt
        ? new Date(bundleFormData.expiresAt).toISOString()
        : null,
    };

    if (editingBundle) {
      setBundles((prev) =>
        prev.map((b) =>
          b.id === editingBundle.id
            ? { ...b, ...bundleData, updatedAt: new Date().toISOString() }
            : b
        )
      );
      toast.success("Bundle discount updated successfully");
    } else {
      const newBundle: BundleDiscount = {
        ...bundleData,
        id: String(Date.now()),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setBundles((prev) => [newBundle, ...prev]);
      toast.success("Bundle discount created successfully");
    }

    setIsSaving(false);
    handleCloseBundleModal();
  };

  const handleToggleBundle = async (bundle: BundleDiscount) => {
    // Simulate API call
    setBundles((prev) =>
      prev.map((b) =>
        b.id === bundle.id
          ? { ...b, isActive: !b.isActive, updatedAt: new Date().toISOString() }
          : b
      )
    );
    toast.success(`Bundle ${bundle.isActive ? "deactivated" : "activated"}`);
  };

  const handleOpenDeleteDialog = (bundle: BundleDiscount) => {
    setDeletingBundle(bundle);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setDeletingBundle(null);
  };

  const handleDeleteBundle = async () => {
    if (!deletingBundle) return;

    setIsSaving(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    setBundles((prev) => prev.filter((b) => b.id !== deletingBundle.id));

    setIsSaving(false);
    handleCloseDeleteDialog();
    toast.success("Bundle discount deleted");
  };

  const handleToggleTier = (tier: string) => {
    setBundleFormData((prev) => ({
      ...prev,
      applicableTiers: prev.applicableTiers.includes(tier)
        ? prev.applicableTiers.filter((t) => t !== tier)
        : [...prev.applicableTiers, tier],
    }));
  };

  // =============================================================================
  // Render
  // =============================================================================

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <AdminPageHeader
        title="Pricing Management"
        description="Configure pricing tiers and bundle discounts"
      />

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Pricing Tiers"
          value={formatNumber(stats.totalTiers)}
          icon={<Tag className="h-5 w-5" />}
          isLoading={loading}
        />
        <StatCard
          label="Active Tiers"
          value={formatNumber(stats.activeTiers)}
          icon={<Check className="h-5 w-5" />}
          variant="success"
          isLoading={loading}
        />
        <StatCard
          label="Bundle Discounts"
          value={formatNumber(stats.totalBundles)}
          icon={<Package className="h-5 w-5" />}
          isLoading={loading}
        />
        <StatCard
          label="Active Bundles"
          value={formatNumber(stats.activeBundles)}
          icon={<Percent className="h-5 w-5" />}
          variant="success"
          isLoading={loading}
        />
      </div>

      {/* Pricing Tiers Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Pricing Tiers</h2>
            <p className="text-sm text-muted-foreground">
              Configure the pricing for each tier
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {tiers.map((tier) => (
              <TierCard
                key={tier.id}
                tier={tier}
                onEdit={handleOpenEditTierModal}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bundle Discounts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Bundle Discounts</h2>
            <p className="text-sm text-muted-foreground">
              Offer discounts for purchasing multiple items
            </p>
          </div>
          <Button onClick={handleOpenCreateBundleModal}>
            <Plus className="h-4 w-4 mr-2" />
            Add Bundle
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <SkeletonCard key={i} className="h-24" />
            ))}
          </div>
        ) : bundles.length === 0 ? (
          <Card className="p-6">
            <EmptyList
              title="No bundle discounts"
              description="Create bundle discounts to incentivize customers to purchase more items."
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {bundles.map((bundle) => (
              <BundleCard
                key={bundle.id}
                bundle={bundle}
                tiers={tiers}
                onEdit={handleOpenEditBundleModal}
                onDelete={handleOpenDeleteDialog}
                onToggle={handleToggleBundle}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Tier Modal */}
      <Dialog
        isOpen={isTierModalOpen}
        onClose={handleCloseTierModal}
        title={`Edit ${editingTier?.name || "Tier"}`}
        size="lg"
      >
        <DialogBody className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label required>Name</Label>
            <Input
              value={tierFormData.name}
              onChange={(e) =>
                setTierFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="e.g., PRO"
            />
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label required>Price ($)</Label>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={tierFormData.price}
              onChange={(e) =>
                setTierFormData((prev) => ({
                  ...prev,
                  price: Number(e.target.value),
                }))
              }
              placeholder="0.00"
            />
            <p className="text-xs text-muted-foreground">
              Set to 0 for a free tier
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label required>Description</Label>
            <Textarea
              value={tierFormData.description}
              onChange={(e) =>
                setTierFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={3}
              placeholder="Describe what this tier offers..."
            />
          </div>

          {/* Included Features */}
          <div className="space-y-2">
            <Label>Included Features</Label>
            <Textarea
              value={tierFormData.includedFeatures}
              onChange={(e) =>
                setTierFormData((prev) => ({
                  ...prev,
                  includedFeatures: e.target.value,
                }))
              }
              rows={5}
              placeholder="Enter one feature per line..."
            />
            <p className="text-xs text-muted-foreground">
              Enter one feature per line
            </p>
          </div>

          {/* Popular & Active */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label>Popular</Label>
                <p className="text-xs text-muted-foreground">
                  Show "Most Popular" badge
                </p>
              </div>
              <Switch
                checked={tierFormData.isPopular}
                onChange={(checked) =>
                  setTierFormData((prev) => ({ ...prev, isPopular: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label>Active</Label>
                <p className="text-xs text-muted-foreground">
                  Available for purchase
                </p>
              </div>
              <Switch
                checked={tierFormData.isActive}
                onChange={(checked) =>
                  setTierFormData((prev) => ({ ...prev, isActive: checked }))
                }
              />
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={handleCloseTierModal}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveTier}
            isLoading={isSaving}
            disabled={!tierFormData.name || !tierFormData.description}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Create/Edit Bundle Modal */}
      <Dialog
        isOpen={isBundleModalOpen}
        onClose={handleCloseBundleModal}
        title={editingBundle ? "Edit Bundle Discount" : "Create Bundle Discount"}
        size="lg"
      >
        <DialogBody className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label required>Name</Label>
            <Input
              value={bundleFormData.name}
              onChange={(e) =>
                setBundleFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="e.g., Multi-Module Discount"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={bundleFormData.description}
              onChange={(e) =>
                setBundleFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={2}
              placeholder="Describe the discount..."
            />
          </div>

          {/* Discount Type & Value */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Discount Type</Label>
              <Select
                value={bundleFormData.type}
                onChange={(value) =>
                  setBundleFormData((prev) => ({
                    ...prev,
                    type: value as DiscountType,
                  }))
                }
                options={DISCOUNT_TYPE_OPTIONS}
              />
            </div>
            <div className="space-y-2">
              <Label>
                Discount Value{" "}
                {bundleFormData.type === "PERCENTAGE" ? "(%)" : "($)"}
              </Label>
              <Input
                type="number"
                min={0}
                max={bundleFormData.type === "PERCENTAGE" ? 100 : undefined}
                step={bundleFormData.type === "FIXED" ? 0.01 : 1}
                value={bundleFormData.value}
                onChange={(e) =>
                  setBundleFormData((prev) => ({
                    ...prev,
                    value: Number(e.target.value),
                  }))
                }
              />
            </div>
          </div>

          {/* Minimum Items */}
          <div className="space-y-2">
            <Label required>Minimum Items</Label>
            <Input
              type="number"
              min={2}
              value={bundleFormData.minItems}
              onChange={(e) =>
                setBundleFormData((prev) => ({
                  ...prev,
                  minItems: Number(e.target.value),
                }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Minimum number of items required to apply discount
            </p>
          </div>

          {/* Applicable Tiers */}
          <div className="space-y-2">
            <Label>Applicable Tiers</Label>
            <div className="flex flex-wrap gap-2">
              {tiers.map((tier) => (
                <Button
                  key={tier.slug}
                  variant={
                    bundleFormData.applicableTiers.includes(tier.slug)
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => handleToggleTier(tier.slug)}
                >
                  {tier.name}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Leave empty to apply to all tiers
            </p>
          </div>

          {/* Valid Period */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={bundleFormData.startsAt}
                onChange={(e) =>
                  setBundleFormData((prev) => ({
                    ...prev,
                    startsAt: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={bundleFormData.expiresAt}
                onChange={(e) =>
                  setBundleFormData((prev) => ({
                    ...prev,
                    expiresAt: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          {/* Is Active */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label>Active</Label>
              <p className="text-xs text-muted-foreground">
                Enable this bundle discount
              </p>
            </div>
            <Switch
              checked={bundleFormData.isActive}
              onChange={(checked) =>
                setBundleFormData((prev) => ({ ...prev, isActive: checked }))
              }
            />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={handleCloseBundleModal}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveBundle}
            isLoading={isSaving}
            disabled={!bundleFormData.name || bundleFormData.value <= 0}
          >
            {editingBundle ? "Save Changes" : "Create Bundle"}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Delete Bundle Confirmation Dialog */}
      <Dialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        title="Delete Bundle Discount"
        size="sm"
      >
        <DialogBody>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-destructive/10">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p>
                Are you sure you want to delete{" "}
                <span className="font-medium">{deletingBundle?.name}</span>?
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                This action cannot be undone. Customers will no longer be able to
                use this bundle discount.
              </p>
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={handleCloseDeleteDialog}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteBundle}
            isLoading={isSaving}
          >
            Delete Bundle
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
