"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Search,
  Package,
  Puzzle,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { showError, showSuccess } from "@/lib/toast";
import {
  adminApi,
  ApiError,
  type Module as ApiModule,
  type Feature as ApiFeature,
  type CreateModuleData,
  type UpdateModuleData,
  type CreateFeatureData,
  type UpdateFeatureData,
} from "@/lib/api";

// Shared UI components
import {
  Button,
  Badge,
  Switch,
  Select,
  Input,
  Textarea,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Dialog,
  DialogBody,
  DialogFooter,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Checkbox,
} from "@/components/ui";
import { EmptyState } from "@core/components/shared";
import { AdminPageHeader, TierBadge } from "@/components/admin";

// =====================================================
// Types
// =====================================================

interface Module {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  iconName?: string;
  displayOrder: number;
  isActive: boolean;
  features: Feature[];
  createdAt: string;
  updatedAt: string;
}

interface Feature {
  id: string;
  slug: string;
  name: string;
  description: string;
  moduleId: string;
  module?: {
    id: string;
    name: string;
    slug: string;
    category: string;
  };
  price: number;
  tier: string | null;
  requires: string[];
  conflicts: string[];
  fileMappings: Record<string, unknown> | null;
  iconName?: string;
  displayOrder: number;
  isActive: boolean;
  isNew: boolean;
  isPopular: boolean;
  createdAt: string;
  updatedAt: string;
}

type TabType = "modules" | "features";
type ModalType = "feature" | "module" | "bulk-price" | null;

const MODULE_CATEGORIES = [
  "core",
  "payment",
  "auth",
  "content",
  "communication",
  "analytics",
];

const TIER_OPTIONS = [
  { value: "", label: "None (All Tiers)" },
  { value: "STARTER", label: "Starter" },
  { value: "PRO", label: "Pro" },
  { value: "BUSINESS", label: "Business" },
  { value: "ENTERPRISE", label: "Enterprise" },
];


// =====================================================
// Utility Functions
// =====================================================

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    core: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    payment: "bg-green-500/10 text-green-700 dark:text-green-400",
    auth: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
    content: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
    communication: "bg-pink-500/10 text-pink-700 dark:text-pink-400",
    analytics: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
  };
  return colors[category] || "bg-muted text-muted-foreground";
}

// =====================================================
// Form Field Component (simplified local version)
// =====================================================

function FormField({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

// =====================================================
// Multi-Select Component (local - not in shared library)
// =====================================================

function MultiSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-9 w-full items-center justify-between px-2.5 py-1.5 text-sm font-normal"
      >
        <span className={cn("truncate", value.length === 0 && "text-muted-foreground")}>
          {value.length > 0 ? `${value.length} selected` : placeholder || "Select..."}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </Button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 z-20 mt-1 max-h-48 overflow-auto rounded-md border border-border bg-background shadow-lg">
            {options.length === 0 ? (
              <p className="p-2 text-sm text-muted-foreground">No options</p>
            ) : (
              options.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent cursor-pointer"
                >
                  <Checkbox
                    checked={value.includes(opt.value)}
                    onChange={(checked) => {
                      if (checked) {
                        onChange([...value, opt.value]);
                      } else {
                        onChange(value.filter((v) => v !== opt.value));
                      }
                    }}
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

// =====================================================
// Module Card Component
// =====================================================

function ModuleCard({
  module,
  featureCount,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
}: {
  module: Module;
  featureCount: number;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-background rounded-lg border">
      <Button
        variant="ghost"
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 h-auto text-left hover:bg-muted/50"
      >
        {isExpanded ? (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-medium truncate">{module.name}</h3>
            <Badge className={getCategoryColor(module.category)}>{module.category}</Badge>
            {!module.isActive && <Badge variant="secondary">Inactive</Badge>}
          </div>
          <p className="text-sm text-muted-foreground mt-1 truncate">{module.description}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium">{featureCount}</p>
            <p className="text-xs text-muted-foreground">features</p>
          </div>
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              aria-label={`Edit module ${module.name}`}
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              aria-label={`Delete module ${module.name}`}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </Button>
      {isExpanded && (
        <div className="px-4 pb-4 border-t">
          <dl className="grid grid-cols-2 gap-4 mt-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Slug</dt>
              <dd className="font-mono">{module.slug}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Display Order</dt>
              <dd>{module.displayOrder}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}

// =====================================================
// Features Table Component
// =====================================================

function FeaturesTable({
  features,
  modules,
  onEdit,
  onDelete,
  selectedIds,
  onSelectToggle,
  onSelectAll,
}: {
  features: Feature[];
  modules: Module[];
  onEdit: (feature: Feature) => void;
  onDelete: (feature: Feature) => void;
  selectedIds: Set<string>;
  onSelectToggle: (id: string) => void;
  onSelectAll: () => void;
}) {
  const allSelected = features.length > 0 && features.every((f) => selectedIds.has(f.id));
  const someSelected = features.some((f) => selectedIds.has(f.id));

  // Group features by module
  const groupedFeatures = useMemo(() => {
    const groups: Record<string, Feature[]> = {};
    features.forEach((f) => {
      const moduleId = f.moduleId;
      if (!groups[moduleId]) groups[moduleId] = [];
      groups[moduleId].push(f);
    });
    return groups;
  }, [features]);

  if (features.length === 0) {
    return (
      <EmptyState
        icon={Puzzle}
        title="No features found"
        description="Create your first feature to get started"
      />
    );
  }

  return (
    <div className="bg-background rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected && !allSelected}
                  onChange={onSelectAll}
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Module</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Min Tier</TableHead>
              <TableHead>Dependencies</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(groupedFeatures).map(([moduleId, moduleFeatures]) => {
              const module = modules.find((m) => m.id === moduleId);
              return moduleFeatures.map((feature, idx) => (
                <TableRow key={feature.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(feature.id)}
                      onChange={() => onSelectToggle(feature.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{feature.name}</span>
                        {feature.isNew && <Badge variant="success" size="sm">New</Badge>}
                        {feature.isPopular && <Badge variant="warning" size="sm">Popular</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">{feature.slug}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {idx === 0 && module && (
                      <Badge className={getCategoryColor(module.category)}>{module.name}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={cn("font-medium", feature.price === 0 && "text-muted-foreground")}>
                      {feature.price === 0 ? "Free" : formatCurrency(feature.price)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {feature.tier ? (
                      <TierBadge tier={feature.tier} />
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {feature.requires.length > 0 ? (
                        feature.requires.map((req) => (
                          <Badge key={req} variant="secondary" size="sm">
                            {req}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                      {feature.conflicts.length > 0 && (
                        <>
                          {feature.conflicts.map((c) => (
                            <Badge key={c} variant="destructive" size="sm">
                              !{c}
                            </Badge>
                          ))}
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {feature.isActive ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(feature)}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        aria-label={`Edit feature ${feature.name}`}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(feature)}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        aria-label={`Delete feature ${feature.name}`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ));
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// =====================================================
// Feature Form Modal
// =====================================================

function FeatureModal({
  isOpen,
  onClose,
  feature,
  modules,
  allFeatures,
  onSave,
  isSaving,
}: {
  isOpen: boolean;
  onClose: () => void;
  feature: Feature | null;
  modules: Module[];
  allFeatures: Feature[];
  onSave: (data: Partial<Feature>) => void;
  isSaving: boolean;
}) {
  const [formData, setFormData] = useState<Partial<Feature>>({
    name: "",
    slug: "",
    description: "",
    moduleId: "",
    price: 0,
    tier: null,
    requires: [],
    conflicts: [],
    fileMappings: null,
    isActive: true,
    isNew: false,
    isPopular: false,
  });
  const [priceInDollars, setPriceInDollars] = useState("0");
  const [fileMappingsJson, setFileMappingsJson] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (feature) {
      setFormData({
        ...feature,
        tier: feature.tier || null,
      });
      setPriceInDollars((feature.price / 100).toFixed(2));
      setFileMappingsJson(feature.fileMappings ? JSON.stringify(feature.fileMappings, null, 2) : "");
    } else {
      setFormData({
        name: "",
        slug: "",
        description: "",
        moduleId: modules[0]?.id || "",
        price: 0,
        tier: null,
        requires: [],
        conflicts: [],
        fileMappings: null,
        isActive: true,
        isNew: false,
        isPopular: false,
      });
      setPriceInDollars("0");
      setFileMappingsJson("");
    }
    setErrors({});
  }, [feature, modules, isOpen]);

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: prev?.slug || !feature ? generateSlug(name) : prev?.slug,
    }));
  };

  const handlePriceChange = (value: string) => {
    setPriceInDollars(value);
    const cents = Math.round(parseFloat(value || "0") * 100);
    setFormData((prev) => ({ ...prev, price: cents }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name?.trim()) newErrors.name = "Name is required";
    if (!formData.slug?.trim()) newErrors.slug = "Slug is required";
    if (!formData.description?.trim()) newErrors.description = "Description is required";
    if (!formData.moduleId) newErrors.moduleId = "Module is required";
    if (fileMappingsJson) {
      try {
        JSON.parse(fileMappingsJson);
      } catch {
        newErrors.fileMappings = "Invalid JSON format";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const data = {
      ...formData,
      fileMappings: fileMappingsJson ? JSON.parse(fileMappingsJson) : null,
    };
    onSave(data);
  };

  const otherFeatures = allFeatures.filter((f) => f.id !== feature?.id);
  const featureOptions = otherFeatures.map((f) => ({ value: f.slug, label: f.name }));

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={feature ? "Edit Feature" : "Create Feature"}
      size="xl"
    >
      <DialogBody className="max-h-[70vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Name" required error={errors.name}>
              <Input
                type="text"
                value={formData.name || ""}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Two-Factor Authentication"
              />
            </FormField>
            <FormField label="Slug" required error={errors.slug}>
              <Input
                type="text"
                value={formData.slug || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                className="font-mono"
                placeholder="e.g., two-factor-auth"
              />
            </FormField>
          </div>

          <FormField label="Description" required error={errors.description}>
            <Textarea
              value={formData.description || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              rows={2}
              placeholder="Brief description of the feature"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Module" required error={errors.moduleId}>
              <Select
                value={formData.moduleId || ""}
                onChange={(v) => setFormData((prev) => ({ ...prev, moduleId: v }))}
                options={modules.map((m) => ({ value: m.id, label: m.name }))}
                placeholder="Select module"
              />
            </FormField>
            <FormField label="Minimum Tier">
              <Select
                value={formData.tier || ""}
                onChange={(v) => setFormData((prev) => ({ ...prev, tier: v || null }))}
                options={TIER_OPTIONS}
              />
            </FormField>
          </div>

          <FormField label="Price (in dollars)" hint={`Stored as ${formData.price || 0} cents`}>
            <div className="relative">
              <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                step="0.01"
                min="0"
                value={priceInDollars}
                onChange={(e) => handlePriceChange(e.target.value)}
                className="pl-8"
                placeholder="0.00"
              />
            </div>
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Requires (Dependencies)">
              <MultiSelect
                value={formData.requires || []}
                onChange={(v) => setFormData((prev) => ({ ...prev, requires: v }))}
                options={featureOptions}
                placeholder="Select dependencies"
              />
            </FormField>
            <FormField label="Conflicts With">
              <MultiSelect
                value={formData.conflicts || []}
                onChange={(v) => setFormData((prev) => ({ ...prev, conflicts: v }))}
                options={featureOptions}
                placeholder="Select conflicts"
              />
            </FormField>
          </div>

          <FormField label="File Mappings (JSON)" error={errors.fileMappings}>
            <Textarea
              value={fileMappingsJson}
              onChange={(e) => setFileMappingsJson(e.target.value)}
              rows={4}
              className="font-mono"
              placeholder='{"folder": ["file1.tsx", "file2.ts"]}'
            />
          </FormField>

          <div className="flex items-center gap-6 pt-2">
            <Switch
              checked={formData.isActive ?? true}
              onChange={(v) => setFormData((prev) => ({ ...prev, isActive: v }))}
              label="Active"
            />
            <Switch
              checked={formData.isNew ?? false}
              onChange={(v) => setFormData((prev) => ({ ...prev, isNew: v }))}
              label="New"
            />
            <Switch
              checked={formData.isPopular ?? false}
              onChange={(v) => setFormData((prev) => ({ ...prev, isPopular: v }))}
              label="Popular"
            />
          </div>
        </form>
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} isLoading={isSaving}>
          {feature ? "Update" : "Create"}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

// =====================================================
// Module Form Modal
// =====================================================

function ModuleModal({
  isOpen,
  onClose,
  module,
  onSave,
  isSaving,
}: {
  isOpen: boolean;
  onClose: () => void;
  module: Module | null;
  onSave: (data: Partial<Module>) => void;
  isSaving: boolean;
}) {
  const [formData, setFormData] = useState<Partial<Module>>({
    name: "",
    slug: "",
    description: "",
    category: "core",
    displayOrder: 0,
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (module) {
      setFormData(module);
    } else {
      setFormData({
        name: "",
        slug: "",
        description: "",
        category: "core",
        displayOrder: 0,
        isActive: true,
      });
    }
    setErrors({});
  }, [module, isOpen]);

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: prev?.slug || !module ? generateSlug(name) : prev?.slug,
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name?.trim()) newErrors.name = "Name is required";
    if (!formData.slug?.trim()) newErrors.slug = "Slug is required";
    if (!formData.description?.trim()) newErrors.description = "Description is required (min 10 chars)";
    if (!formData.category) newErrors.category = "Category is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave(formData);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={module ? "Edit Module" : "Create Module"}
      size="md"
    >
      <DialogBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Name" required error={errors.name}>
            <Input
              type="text"
              value={formData.name || ""}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Authentication"
            />
          </FormField>

          <FormField label="Slug" required error={errors.slug}>
            <Input
              type="text"
              value={formData.slug || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
              className="font-mono"
              placeholder="e.g., authentication"
            />
          </FormField>

          <FormField label="Description" required error={errors.description}>
            <Textarea
              value={formData.description || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
              placeholder="Brief description of the module (at least 10 characters)"
            />
          </FormField>

          <FormField label="Category" required error={errors.category}>
            <Select
              value={formData.category || ""}
              onChange={(v) => setFormData((prev) => ({ ...prev, category: v }))}
              options={MODULE_CATEGORIES.map((c) => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }))}
            />
          </FormField>

          <FormField label="Display Order">
            <Input
              type="number"
              value={formData.displayOrder || 0}
              onChange={(e) => setFormData((prev) => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
            />
          </FormField>

          <div className="pt-2">
            <Switch
              checked={formData.isActive ?? true}
              onChange={(v) => setFormData((prev) => ({ ...prev, isActive: v }))}
              label="Active"
            />
          </div>
        </form>
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} isLoading={isSaving}>
          {module ? "Update" : "Create"}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

// =====================================================
// Bulk Price Update Modal
// =====================================================

function BulkPriceModal({
  isOpen,
  onClose,
  features,
  selectedIds,
  onSave,
  isSaving,
}: {
  isOpen: boolean;
  onClose: () => void;
  features: Feature[];
  selectedIds: Set<string>;
  onSave: (data: { featureIds: string[]; adjustmentType: "percentage" | "fixed"; value: number }) => void;
  isSaving: boolean;
}) {
  const [adjustmentType, setAdjustmentType] = useState<"percentage" | "fixed">("percentage");
  const [value, setValue] = useState("");
  const [localSelectedIds, setLocalSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      setLocalSelectedIds(new Set(selectedIds));
      setAdjustmentType("percentage");
      setValue("");
    }
  }, [isOpen, selectedIds]);

  const selectedFeatures = features.filter((f) => localSelectedIds.has(f.id));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numValue = parseFloat(value) || 0;
    const adjustedValue = adjustmentType === "fixed" ? Math.round(numValue * 100) : numValue;
    onSave({
      featureIds: Array.from(localSelectedIds),
      adjustmentType,
      value: adjustedValue,
    });
  };

  // Preview calculation
  const preview = useMemo(() => {
    const numValue = parseFloat(value) || 0;
    return selectedFeatures.slice(0, 5).map((f) => {
      let newPrice: number;
      if (adjustmentType === "percentage") {
        newPrice = Math.round(f.price * (1 + numValue / 100));
      } else {
        newPrice = f.price + Math.round(numValue * 100);
      }
      return {
        ...f,
        newPrice: Math.max(0, newPrice),
      };
    });
  }, [selectedFeatures, adjustmentType, value]);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Bulk Price Update"
      size="lg"
    >
      <DialogBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-primary" />
              <span>
                {localSelectedIds.size > 0
                  ? `${localSelectedIds.size} features selected`
                  : "Select features to update"}
              </span>
            </div>
          </div>

          <FormField label="Select Features">
            <div className="max-h-48 overflow-auto border rounded-md divide-y">
              {features.map((f) => (
                <label
                  key={f.id}
                  className="flex items-center justify-between px-3 py-2 hover:bg-muted/50 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={localSelectedIds.has(f.id)}
                      onChange={(checked) => {
                        const newSet = new Set(localSelectedIds);
                        if (checked) {
                          newSet.add(f.id);
                        } else {
                          newSet.delete(f.id);
                        }
                        setLocalSelectedIds(newSet);
                      }}
                    />
                    <span className="text-sm">{f.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{formatCurrency(f.price)}</span>
                </label>
              ))}
            </div>
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Adjustment Type">
              <Select
                value={adjustmentType}
                onChange={(v) => setAdjustmentType(v as "percentage" | "fixed")}
                options={[
                  { value: "percentage", label: "Percentage (%)" },
                  { value: "fixed", label: "Fixed Amount ($)" },
                ]}
              />
            </FormField>
            <FormField
              label={adjustmentType === "percentage" ? "Percentage" : "Amount (dollars)"}
              hint="Use positive values to increase, negative to decrease"
            >
              <div className="relative">
                <Input
                  type="number"
                  step={adjustmentType === "percentage" ? "1" : "0.01"}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={adjustmentType === "percentage" ? "e.g., 10 or -10" : "e.g., 5.00 or -2.50"}
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {adjustmentType === "percentage" ? "%" : "$"}
                </span>
              </div>
            </FormField>
          </div>

          {preview.length > 0 && value && (
            <div className="border rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-muted/50 text-sm font-medium">Preview</div>
              <div className="divide-y">
                {preview.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span>{p.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground line-through">{formatCurrency(p.price)}</span>
                      <span className="font-medium">{formatCurrency(p.newPrice)}</span>
                    </div>
                  </div>
                ))}
                {selectedFeatures.length > 5 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    ...and {selectedFeatures.length - 5} more
                  </div>
                )}
              </div>
            </div>
          )}
        </form>
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          isLoading={isSaving}
          disabled={localSelectedIds.size === 0 || !value}
        >
          Update {localSelectedIds.size} Features
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

// =====================================================
// Delete Confirmation Modal
// =====================================================

function DeleteConfirmModal({
  isOpen,
  onClose,
  title,
  message,
  onConfirm,
  isDeleting,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
    >
      <DialogBody>
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-destructive/10">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <p className="text-sm">{message}</p>
            <p className="text-sm text-muted-foreground mt-1">This action cannot be undone.</p>
          </div>
        </div>
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isDeleting}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={onConfirm} isLoading={isDeleting}>
          Delete
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

// =====================================================
// Main Page Component
// =====================================================

export default function FeaturesAdminPage() {
  // State
  const [activeTab, setActiveTab] = useState<TabType>("features");
  const [modules, setModules] = useState<Module[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Modal state
  const [modalType, setModalType] = useState<ModalType>(null);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "feature" | "module"; item: Feature | Module } | null>(null);

  // Search and filter
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<Set<string>>(new Set());

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [modulesResult, featuresResult] = await Promise.all([
          adminApi.getModules(),
          adminApi.getFeatures(),
        ]);

        setModules(modulesResult.items as unknown as Module[]);
        setFeatures(featuresResult.items as unknown as Feature[]);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        showError("Failed to load features and modules", error instanceof ApiError ? error.message : undefined);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Filtered features
  const filteredFeatures = useMemo(() => {
    if (!searchQuery.trim()) return features;
    const query = searchQuery.toLowerCase();
    return features.filter(
      (f) =>
        f.name.toLowerCase().includes(query) ||
        f.slug.toLowerCase().includes(query) ||
        f.description.toLowerCase().includes(query)
    );
  }, [features, searchQuery]);

  // Feature counts per module
  const featureCountByModule = useMemo(() => {
    const counts: Record<string, number> = {};
    features.forEach((f) => {
      counts[f.moduleId] = (counts[f.moduleId] || 0) + 1;
    });
    return counts;
  }, [features]);

  // Handlers
  const handleToggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const handleSelectFeatureToggle = (id: string) => {
    setSelectedFeatureIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllFeatures = () => {
    if (selectedFeatureIds.size === filteredFeatures.length) {
      setSelectedFeatureIds(new Set());
    } else {
      setSelectedFeatureIds(new Set(filteredFeatures.map((f) => f.id)));
    }
  };

  const handleSaveFeature = async (data: Partial<Feature>) => {
    setSaving(true);
    try {
      const payload: CreateFeatureData = {
        slug: data.slug || "",
        name: data.name || "",
        description: data.description || "",
        moduleId: data.moduleId || "",
        price: data.price || 0,
        tier: data.tier || null,
        requires: data.requires || [],
        conflicts: data.conflicts || [],
        fileMappings: data.fileMappings || undefined,
        isActive: data.isActive ?? true,
        isNew: data.isNew ?? false,
        isPopular: data.isPopular ?? false,
      };

      if (editingFeature) {
        // Update existing feature
        const updatedFeature = await adminApi.updateFeature(editingFeature.id, payload as UpdateFeatureData);

        setFeatures((prev) =>
          prev.map((f) => (f.id === editingFeature.id ? (updatedFeature as unknown as Feature) : f))
        );
        showSuccess("Feature updated successfully");
      } else {
        // Create new feature
        const newFeature = await adminApi.createFeature(payload);

        setFeatures((prev) => [...prev, newFeature as unknown as Feature]);
        showSuccess("Feature created successfully");
      }

      setModalType(null);
      setEditingFeature(null);
    } catch (error) {
      console.error("Failed to save feature:", error);
      showError("Failed to save feature", error instanceof ApiError ? error.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveModule = async (data: Partial<Module>) => {
    setSaving(true);
    try {
      const payload: CreateModuleData = {
        slug: data.slug || "",
        name: data.name || "",
        description: data.description || "",
        category: data.category || "core",
        displayOrder: data.displayOrder || modules.length + 1,
        isActive: data.isActive ?? true,
        iconName: data.iconName,
      };

      if (editingModule) {
        // Update existing module
        const updatedModule = await adminApi.updateModule(editingModule.id, payload as UpdateModuleData);

        setModules((prev) =>
          prev.map((m) => (m.id === editingModule.id ? (updatedModule as unknown as Module) : m))
        );
        showSuccess("Module updated successfully");
      } else {
        // Create new module
        const newModule = await adminApi.createModule(payload);

        setModules((prev) => [...prev, newModule as unknown as Module]);
        showSuccess("Module created successfully");
      }

      setModalType(null);
      setEditingModule(null);
    } catch (error) {
      console.error("Failed to save module:", error);
      showError("Failed to save module", error instanceof ApiError ? error.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.type === "feature") {
        await adminApi.deleteFeature(deleteTarget.item.id);
        setFeatures((prev) => prev.filter((f) => f.id !== deleteTarget.item.id));
        setSelectedFeatureIds((prev) => {
          const next = new Set(prev);
          next.delete(deleteTarget.item.id);
          return next;
        });
        showSuccess("Feature deleted successfully");
      } else {
        await adminApi.deleteModule(deleteTarget.item.id);
        setModules((prev) => prev.filter((m) => m.id !== deleteTarget.item.id));
        showSuccess("Module deleted successfully");
      }
      setDeleteTarget(null);
    } catch (error) {
      console.error(`Failed to delete ${deleteTarget.type}:`, error);
      showError(`Failed to delete ${deleteTarget.type}`, error instanceof ApiError ? error.message : undefined);
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkPriceUpdate = async (data: {
    featureIds: string[];
    adjustmentType: "percentage" | "fixed";
    value: number;
  }) => {
    setSaving(true);
    try {
      // Calculate new prices based on adjustment type and update via API
      const updates = data.featureIds.map((id) => {
        const feature = features.find((f) => f.id === id);
        if (!feature) return null;

        let newPrice: number;
        if (data.adjustmentType === "percentage") {
          newPrice = Math.round(feature.price * (1 + data.value / 100));
        } else {
          newPrice = feature.price + data.value;
        }
        return { id, price: Math.max(0, newPrice) };
      }).filter((u): u is { id: string; price: number } => u !== null);

      await adminApi.bulkUpdatePrices(updates);

      // Update local state with new prices
      setFeatures((prev) =>
        prev.map((f) => {
          const update = updates.find((u) => u.id === f.id);
          if (update) {
            return { ...f, price: update.price, updatedAt: new Date().toISOString() };
          }
          return f;
        })
      );

      setModalType(null);
      setSelectedFeatureIds(new Set());
      showSuccess(`${data.featureIds.length} features updated successfully`);
    } catch (error) {
      console.error("Failed to update prices:", error);
      showError("Failed to update prices", error instanceof ApiError ? error.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-64 bg-muted rounded animate-pulse mt-2" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-28 bg-muted rounded animate-pulse" />
            <div className="h-9 w-28 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="h-12 bg-muted rounded animate-pulse" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Features & Modules"
        description="Manage feature configuration and pricing"
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setEditingModule(null);
                setModalType("module");
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Module
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setEditingFeature(null);
                setModalType("feature");
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Feature
            </Button>
            <Button
              variant="secondary"
              onClick={() => setModalType("bulk-price")}
              disabled={features.length === 0}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Bulk Price Update
            </Button>
          </>
        }
      />

      {/* Tabs */}
      <Tabs
        index={activeTab === "modules" ? 0 : 1}
        onChange={(index) => setActiveTab(index === 0 ? "modules" : "features")}
      >
        <TabList>
          <Tab>
            <Package className="h-4 w-4 mr-2" />
            Modules ({modules.length})
          </Tab>
          <Tab>
            <Puzzle className="h-4 w-4 mr-2" />
            Features ({features.length})
          </Tab>
        </TabList>
        <TabPanels>
          {/* Modules Tab Panel */}
          <TabPanel>
            <div className="space-y-4">
              {modules.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title="No modules found"
                  description="Create your first module to organize features"
                  action={{
                    label: "Add Module",
                    onClick: () => {
                      setEditingModule(null);
                      setModalType("module");
                    },
                  }}
                />
              ) : (
                modules.map((module) => (
                  <ModuleCard
                    key={module.id}
                    module={module}
                    featureCount={featureCountByModule[module.id] || 0}
                    isExpanded={expandedModules.has(module.id)}
                    onToggle={() => handleToggleModule(module.id)}
                    onEdit={() => {
                      setEditingModule(module);
                      setModalType("module");
                    }}
                    onDelete={() => setDeleteTarget({ type: "module", item: module })}
                  />
                ))
              )}
            </div>
          </TabPanel>

          {/* Features Tab Panel */}
          <TabPanel>
            <div className="space-y-4">
              {/* Search */}
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search features..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {selectedFeatureIds.size > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {selectedFeatureIds.size} selected
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedFeatureIds(new Set())}
                    >
                      Clear
                    </Button>
                  </div>
                )}
              </div>

              {/* Features Table */}
              <FeaturesTable
                features={filteredFeatures}
                modules={modules}
                onEdit={(feature) => {
                  setEditingFeature(feature);
                  setModalType("feature");
                }}
                onDelete={(feature) => setDeleteTarget({ type: "feature", item: feature })}
                selectedIds={selectedFeatureIds}
                onSelectToggle={handleSelectFeatureToggle}
                onSelectAll={handleSelectAllFeatures}
              />
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Modals */}
      <FeatureModal
        isOpen={modalType === "feature"}
        onClose={() => {
          setModalType(null);
          setEditingFeature(null);
        }}
        feature={editingFeature}
        modules={modules}
        allFeatures={features}
        onSave={handleSaveFeature}
        isSaving={saving}
      />

      <ModuleModal
        isOpen={modalType === "module"}
        onClose={() => {
          setModalType(null);
          setEditingModule(null);
        }}
        module={editingModule}
        onSave={handleSaveModule}
        isSaving={saving}
      />

      <BulkPriceModal
        isOpen={modalType === "bulk-price"}
        onClose={() => setModalType(null)}
        features={features}
        selectedIds={selectedFeatureIds}
        onSave={handleBulkPriceUpdate}
        isSaving={saving}
      />

      <DeleteConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title={`Delete ${deleteTarget?.type === "feature" ? "Feature" : "Module"}`}
        message={
          deleteTarget?.type === "feature"
            ? `Are you sure you want to delete "${(deleteTarget.item as Feature).name}"?`
            : `Are you sure you want to delete "${(deleteTarget?.item as Module)?.name}"? This module has ${featureCountByModule[(deleteTarget?.item as Module)?.id] || 0} features.`
        }
        onConfirm={handleDelete}
        isDeleting={deleting}
      />
    </div>
  );
}
