"use client";

import * as React from "react";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { API_CONFIG } from "@/lib/constants";

// Core UI Components
import {
  Button,
  Input,
  Textarea,
  Select,
  Switch,
  Checkbox,
  Modal,
  SearchInput,
  Label,
  Spinner,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  EmptySearch,
  EmptyList,
  ImageUpload,
} from "@/components/ui";

// Admin Components
import { AdminPageHeader, TierBadge } from "@/components/admin";

// =====================================================
// Types
// =====================================================

type Tier = "STARTER" | "PRO" | "BUSINESS" | "ENTERPRISE";

interface Feature {
  id: string;
  name: string;
  key: string;
}

interface Template {
  id: string;
  name: string;
  slug: string;
  description: string;
  tier: Tier;
  basePriceCents: number;
  includedFeatureIds: string[];
  previewImageUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TemplateFormData {
  name: string;
  slug: string;
  description: string;
  tier: Tier;
  basePriceDollars: string;
  includedFeatureIds: string[];
  previewImageUrl: string | null;
  isActive: boolean;
}

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

// =====================================================
// Mock Data
// =====================================================

const MOCK_FEATURES: Feature[] = [
  { id: "f1", name: "User Authentication", key: "auth" },
  { id: "f2", name: "Payment Processing", key: "payments" },
  { id: "f3", name: "Real-time Updates", key: "realtime" },
  { id: "f4", name: "File Uploads", key: "file-upload" },
  { id: "f5", name: "Admin Dashboard", key: "admin" },
  { id: "f6", name: "Analytics", key: "analytics" },
  { id: "f7", name: "Email Notifications", key: "email" },
  { id: "f8", name: "API Access", key: "api" },
  { id: "f9", name: "Multi-tenancy", key: "multitenancy" },
  { id: "f10", name: "SSO Integration", key: "sso" },
];

const INITIAL_TEMPLATES: Template[] = [
  {
    id: "t1",
    name: "Starter Bundle",
    slug: "starter-bundle",
    description: "Essential features for small projects and MVPs.",
    tier: "STARTER",
    basePriceCents: 4900,
    includedFeatureIds: ["f1", "f2", "f7"],
    isActive: true,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "t2",
    name: "Pro Suite",
    slug: "pro-suite",
    description: "Advanced features for growing businesses with real-time capabilities.",
    tier: "PRO",
    basePriceCents: 14900,
    includedFeatureIds: ["f1", "f2", "f3", "f4", "f6", "f7"],
    isActive: true,
    createdAt: "2024-01-16T10:00:00Z",
    updatedAt: "2024-01-20T15:30:00Z",
  },
  {
    id: "t3",
    name: "Business Complete",
    slug: "business-complete",
    description: "Full-featured solution for established businesses with admin tools.",
    tier: "BUSINESS",
    basePriceCents: 29900,
    includedFeatureIds: ["f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8"],
    isActive: true,
    createdAt: "2024-01-17T10:00:00Z",
    updatedAt: "2024-01-25T09:15:00Z",
  },
  {
    id: "t4",
    name: "Enterprise Platform",
    slug: "enterprise-platform",
    description: "Enterprise-grade solution with SSO, multi-tenancy, and priority support.",
    tier: "ENTERPRISE",
    basePriceCents: 99900,
    includedFeatureIds: ["f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8", "f9", "f10"],
    isActive: true,
    createdAt: "2024-01-18T10:00:00Z",
    updatedAt: "2024-02-01T11:45:00Z",
  },
  {
    id: "t5",
    name: "Legacy Basic",
    slug: "legacy-basic",
    description: "Deprecated basic template - no longer available for new purchases.",
    tier: "STARTER",
    basePriceCents: 2900,
    includedFeatureIds: ["f1"],
    isActive: false,
    createdAt: "2023-06-01T10:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
];

// =====================================================
// Helper Functions
// =====================================================

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}


// =====================================================
// Icons
// =====================================================

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
      />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
      />
    </svg>
  );
}

function PackageIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
      />
    </svg>
  );
}

// =====================================================
// Delete Confirmation Modal
// =====================================================

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  templateName: string;
  isDeleting: boolean;
}

function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  templateName,
  isDeleting,
}: DeleteConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Template"
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} isLoading={isDeleting}>
            Delete
          </Button>
        </>
      }
    >
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete the template{" "}
          <span className="font-semibold text-foreground">&quot;{templateName}&quot;</span>?
        </p>
        <p className="text-sm text-muted-foreground">
          This action cannot be undone. Users who have purchased this template will retain access.
        </p>
      </div>
    </Modal>
  );
}

// =====================================================
// Template Form Modal
// =====================================================

interface TemplateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TemplateFormData) => void;
  initialData?: Template;
  features: Feature[];
  isSubmitting: boolean;
}

const DEFAULT_FORM_DATA: TemplateFormData = {
  name: "",
  slug: "",
  description: "",
  tier: "STARTER",
  basePriceDollars: "",
  includedFeatureIds: [],
  previewImageUrl: null,
  isActive: true,
};

function TemplateFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  features,
  isSubmitting,
}: TemplateFormModalProps) {
  const isEditing = !!initialData;
  const [formData, setFormData] = React.useState<TemplateFormData>(DEFAULT_FORM_DATA);
  const [autoSlug, setAutoSlug] = React.useState(true);
  const [isUploadingImage, setIsUploadingImage] = React.useState(false);

  // Reset form when modal opens/closes or initialData changes
  React.useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name,
          slug: initialData.slug,
          description: initialData.description,
          tier: initialData.tier,
          basePriceDollars: (initialData.basePriceCents / 100).toFixed(2),
          includedFeatureIds: [...initialData.includedFeatureIds],
          previewImageUrl: initialData.previewImageUrl || null,
          isActive: initialData.isActive,
        });
        setAutoSlug(false);
      } else {
        setFormData(DEFAULT_FORM_DATA);
        setAutoSlug(true);
      }
    }
  }, [isOpen, initialData]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
      slug: autoSlug ? generateSlug(name) : prev.slug,
    }));
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAutoSlug(false);
    setFormData((prev) => ({
      ...prev,
      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
    }));
  };

  const handleFeatureToggle = (featureId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      includedFeatureIds: checked
        ? [...prev.includedFeatureIds, featureId]
        : prev.includedFeatureIds.filter((id) => id !== featureId),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    setIsUploadingImage(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("image", file);

      const response = await fetch(`${API_CONFIG.BASE_URL}/admin/uploads/image`, {
        method: "POST",
        body: formDataUpload,
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to upload image");
      }

      const data = await response.json();
      const imageUrl = data.data.url;

      setFormData((prev) => ({ ...prev, previewImageUrl: imageUrl }));
      return imageUrl;
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleImageRemove = () => {
    setFormData((prev) => ({ ...prev, previewImageUrl: null }));
  };

  const tierOptions = [
    { value: "STARTER", label: "Starter" },
    { value: "PRO", label: "Pro" },
    { value: "BUSINESS", label: "Business" },
    { value: "ENTERPRISE", label: "Enterprise" },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Template" : "Add Template"}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="template-form" isLoading={isSubmitting}>
            {isEditing ? "Save Changes" : "Create Template"}
          </Button>
        </>
      }
    >
      <form id="template-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="name" required>
            Name
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={handleNameChange}
            placeholder="e.g., Starter Bundle"
            required
          />
        </div>

        {/* Slug */}
        <div className="space-y-1.5">
          <Label htmlFor="slug" required>
            Slug
          </Label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={handleSlugChange}
            placeholder="e.g., starter-bundle"
            required
          />
          <p className="text-xs text-muted-foreground">
            URL-friendly identifier. Auto-generated from name if not edited.
          </p>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Brief description of what this template includes..."
            rows={3}
          />
        </div>

        {/* Preview Image */}
        <div className="space-y-1.5">
          <Label>Preview Image</Label>
          <ImageUpload
            currentImageUrl={formData.previewImageUrl}
            onUpload={handleImageUpload}
            onRemove={handleImageRemove}
            isUploading={isUploadingImage}
            disabled={isSubmitting}
            aspectRatio="video"
          />
        </div>

        {/* Tier and Price Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Tier */}
          <div className="space-y-1.5">
            <Label htmlFor="tier" required>
              Tier
            </Label>
            <Select
              id="tier"
              options={tierOptions}
              value={formData.tier}
              onChange={(value) => setFormData((prev) => ({ ...prev, tier: value as Tier }))}
              required
            />
          </div>

          {/* Base Price */}
          <div className="space-y-1.5">
            <Label htmlFor="basePriceDollars" required>
              Base Price (USD)
            </Label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                $
              </span>
              <Input
                id="basePriceDollars"
                type="number"
                step="0.01"
                min="0"
                value={formData.basePriceDollars}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, basePriceDollars: e.target.value }))
                }
                placeholder="49.00"
                className="pl-6"
                required
              />
            </div>
          </div>
        </div>

        {/* Included Features */}
        <div className="space-y-1.5">
          <Label>Included Features</Label>
          <div className="rounded-md border border-input bg-background p-3 max-h-48 overflow-y-auto">
            <div className="grid grid-cols-2 gap-2">
              {features.map((feature) => (
                <Checkbox
                  key={feature.id}
                  id={`feature-${feature.id}`}
                  label={feature.name}
                  checked={formData.includedFeatureIds.includes(feature.id)}
                  onChange={(e) => handleFeatureToggle(feature.id, e.target.checked)}
                  size="sm"
                />
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {formData.includedFeatureIds.length} feature(s) selected
          </p>
        </div>

        {/* Is Active */}
        <div className="flex items-center justify-between rounded-md border border-input bg-background p-3">
          <div>
            <p className="text-sm font-medium">Active</p>
            <p className="text-xs text-muted-foreground">
              Active templates are available for purchase
            </p>
          </div>
          <Switch
            checked={formData.isActive}
            onChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked }))}
          />
        </div>
      </form>
    </Modal>
  );
}

// =====================================================
// Empty State
// =====================================================

interface EmptyStateProps {
  onAddClick: () => void;
  hasFilters: boolean;
}

function EmptyState({ onAddClick, hasFilters }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 bg-background rounded-lg border border-dashed border-border">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
        <PackageIcon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">
        {hasFilters ? "No templates found" : "No templates yet"}
      </h3>
      <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
        {hasFilters
          ? "Try adjusting your search or filters to find what you're looking for."
          : "Create your first template to start offering pre-configured app bundles to users."}
      </p>
      {!hasFilters && (
        <Button onClick={onAddClick}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Template
        </Button>
      )}
    </div>
  );
}

// =====================================================
// Loading State
// =====================================================

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 bg-background rounded-lg border">
      <Spinner size="lg" />
      <p className="text-sm text-muted-foreground mt-4">Loading templates...</p>
    </div>
  );
}

// =====================================================
// Main Page Component
// =====================================================

export default function TemplatesPage() {
  // State
  const [templates, setTemplates] = React.useState<Template[]>(INITIAL_TEMPLATES);
  const [features] = React.useState<Feature[]>(MOCK_FEATURES);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("ALL");
  const [tierFilter, setTierFilter] = React.useState<string>("ALL");

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = React.useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [editingTemplate, setEditingTemplate] = React.useState<Template | undefined>();
  const [deletingTemplate, setDeletingTemplate] = React.useState<Template | null>(null);

  // Filter options
  const statusOptions = [
    { value: "ALL", label: "All Status" },
    { value: "ACTIVE", label: "Active" },
    { value: "INACTIVE", label: "Inactive" },
  ];

  const tierOptions = [
    { value: "ALL", label: "All Tiers" },
    { value: "STARTER", label: "Starter" },
    { value: "PRO", label: "Pro" },
    { value: "BUSINESS", label: "Business" },
    { value: "ENTERPRISE", label: "Enterprise" },
  ];

  // Filtered templates
  const filteredTemplates = React.useMemo(() => {
    return templates.filter((template) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = template.name.toLowerCase().includes(query);
        const matchesSlug = template.slug.toLowerCase().includes(query);
        const matchesDescription = template.description.toLowerCase().includes(query);
        if (!matchesName && !matchesSlug && !matchesDescription) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== "ALL") {
        const isActive = statusFilter === "ACTIVE";
        if (template.isActive !== isActive) {
          return false;
        }
      }

      // Tier filter
      if (tierFilter !== "ALL" && template.tier !== tierFilter) {
        return false;
      }

      return true;
    });
  }, [templates, searchQuery, statusFilter, tierFilter]);

  const hasFilters = searchQuery !== "" || statusFilter !== "ALL" || tierFilter !== "ALL";

  // Handlers
  const handleAddTemplate = () => {
    setEditingTemplate(undefined);
    setIsFormModalOpen(true);
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setIsFormModalOpen(true);
  };

  const handleDeleteClick = (template: Template) => {
    setDeletingTemplate(template);
    setIsDeleteModalOpen(true);
  };

  const handleFormSubmit = async (formData: TemplateFormData) => {
    setIsSubmitting(true);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const basePriceCents = Math.round(parseFloat(formData.basePriceDollars) * 100);

    if (editingTemplate) {
      // TODO: Replace with API call - PATCH /api/admin/templates/:id
      // const response = await fetch(`/api/admin/templates/${editingTemplate.id}`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ ...formData, basePriceCents }),
      // });
      // const updatedTemplate = await response.json();

      setTemplates((prev) =>
        prev.map((t) =>
          t.id === editingTemplate.id
            ? {
                ...t,
                name: formData.name,
                slug: formData.slug,
                description: formData.description,
                tier: formData.tier,
                basePriceCents,
                includedFeatureIds: formData.includedFeatureIds,
                previewImageUrl: formData.previewImageUrl,
                isActive: formData.isActive,
                updatedAt: new Date().toISOString(),
              }
            : t
        )
      );
    } else {
      // TODO: Replace with API call - POST /api/admin/templates
      // const response = await fetch('/api/admin/templates', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ ...formData, basePriceCents }),
      // });
      // const newTemplate = await response.json();

      const newTemplate: Template = {
        id: `t${Date.now()}`,
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        tier: formData.tier,
        basePriceCents,
        includedFeatureIds: formData.includedFeatureIds,
        previewImageUrl: formData.previewImageUrl,
        isActive: formData.isActive,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setTemplates((prev) => [newTemplate, ...prev]);
    }

    setIsSubmitting(false);
    setIsFormModalOpen(false);
    setEditingTemplate(undefined);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTemplate) return;

    setIsDeleting(true);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // TODO: Replace with API call - DELETE /api/admin/templates/:id
    // await fetch(`/api/admin/templates/${deletingTemplate.id}`, {
    //   method: 'DELETE',
    // });

    setTemplates((prev) => prev.filter((t) => t.id !== deletingTemplate.id));
    setIsDeleting(false);
    setIsDeleteModalOpen(false);
    setDeletingTemplate(null);
  };

  const handleToggleActive = async (template: Template) => {
    // Optimistic update
    setTemplates((prev) =>
      prev.map((t) =>
        t.id === template.id
          ? { ...t, isActive: !t.isActive, updatedAt: new Date().toISOString() }
          : t
      )
    );

    // TODO: Replace with API call - PATCH /api/admin/templates/:id/toggle
    // try {
    //   await fetch(`/api/admin/templates/${template.id}/toggle`, {
    //     method: 'PATCH',
    //   });
    // } catch (error) {
    //   // Revert on error
    //   setTemplates((prev) =>
    //     prev.map((t) =>
    //       t.id === template.id
    //         ? { ...t, isActive: template.isActive }
    //         : t
    //     )
    //   );
    // }
  };

  // TODO: Replace with API call - GET /api/admin/templates
  // React.useEffect(() => {
  //   async function fetchTemplates() {
  //     setIsLoading(true);
  //     try {
  //       const response = await fetch('/api/admin/templates');
  //       const data = await response.json();
  //       setTemplates(data);
  //     } catch (error) {
  //       console.error('Failed to fetch templates:', error);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   }
  //   fetchTemplates();
  // }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <AdminPageHeader
        title="Templates"
        description="Manage pre-configured app bundles for users to purchase"
        actions={
          <Button onClick={handleAddTemplate}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Template
          </Button>
        }
      />

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 max-w-sm">
          <SearchInput
            placeholder="Search templates..."
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery("")}
          />
        </div>
        <div className="flex gap-3">
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as StatusFilter)}
            className="w-32"
          />
          <Select
            options={tierOptions}
            value={tierFilter}
            onChange={setTierFilter}
            className="w-36"
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingState />
      ) : filteredTemplates.length === 0 ? (
        <EmptyState onAddClick={handleAddTemplate} hasFilters={hasFilters} />
      ) : (
        <div className="bg-background rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead className="text-right">Base Price</TableHead>
                <TableHead className="text-center hidden sm:table-cell">Features</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTemplates.map((template) => {
                const featureCount = template.includedFeatureIds.length;
                return (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-sm">
                      {template.slug}
                    </TableCell>
                    <TableCell className="hidden md:table-cell max-w-xs">
                      <span className="text-sm text-muted-foreground line-clamp-2">
                        {template.description || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <TierBadge tier={template.tier} />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(template.basePriceCents)}
                    </TableCell>
                    <TableCell className="text-center hidden sm:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {formatNumber(featureCount)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={template.isActive}
                        onChange={() => handleToggleActive(template)}
                        size="sm"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditTemplate(template)}
                          aria-label={`Edit ${template.name}`}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(template)}
                          aria-label={`Delete ${template.name}`}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Summary */}
      {!isLoading && filteredTemplates.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {formatNumber(filteredTemplates.length)} of {formatNumber(templates.length)}{" "}
            templates
          </span>
          <span>
            {formatNumber(templates.filter((t) => t.isActive).length)} active,{" "}
            {formatNumber(templates.filter((t) => !t.isActive).length)} inactive
          </span>
        </div>
      )}

      {/* Form Modal */}
      <TemplateFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingTemplate(undefined);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingTemplate}
        features={features}
        isSubmitting={isSubmitting}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingTemplate(null);
        }}
        onConfirm={handleDeleteConfirm}
        templateName={deletingTemplate?.name || ""}
        isDeleting={isDeleting}
      />
    </div>
  );
}
