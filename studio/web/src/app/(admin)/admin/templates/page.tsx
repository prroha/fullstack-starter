"use client";

import * as React from "react";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { API_CONFIG } from "@/lib/constants";
import { showSuccess, showError } from "@/lib/toast";
import { validators, validate, hasErrors, type FormErrors } from "@/lib/validation";

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
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  EmptySearch,
  EmptyList,
  ImageUpload,
  FormError,
} from "@/components/ui";

// Admin Components
import { AdminPageHeader, TierBadge, AdminTableSkeleton } from "@/components/admin";

// =====================================================
// Types
// =====================================================

type Tier = "STARTER" | "PRO" | "BUSINESS" | "ENTERPRISE";

interface Feature {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  moduleId: string;
}

interface Template {
  id: string;
  slug: string;
  name: string;
  description: string;
  shortDescription: string;
  price: number;
  compareAtPrice: number;
  tier: Tier;
  includedFeatures: string[];
  iconName: string;
  color: string;
  previewImageUrl: string | null;
  displayOrder: number;
  isFeatured: boolean;
  isActive: boolean;
}

interface TemplateFormData {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  tier: Tier;
  price: string;
  compareAtPrice: string;
  includedFeatures: string[];
  iconName: string;
  color: string;
  previewImageUrl: string | null;
  displayOrder: number;
  isFeatured: boolean;
  isActive: boolean;
}

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

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
  shortDescription: "",
  tier: "STARTER",
  price: "",
  compareAtPrice: "",
  includedFeatures: [],
  iconName: "",
  color: "#000000",
  previewImageUrl: null,
  displayOrder: 0,
  isFeatured: false,
  isActive: true,
};

type TemplateFormErrors = FormErrors<"name" | "slug" | "price">;

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
  const [errors, setErrors] = React.useState<TemplateFormErrors>({});

  // Validate form fields
  const validateForm = React.useCallback((): boolean => {
    const newErrors: TemplateFormErrors = {};

    // Name validation: required, minLength 2
    const nameError = validate(formData.name, validators.required, validators.minLength(2));
    if (nameError) newErrors.name = nameError;

    // Slug validation: required, slug format
    const slugRequired = validate(formData.slug, validators.required);
    if (slugRequired) {
      newErrors.slug = slugRequired;
    } else {
      const slugFormat = validate(formData.slug, validators.slug);
      if (slugFormat) newErrors.slug = slugFormat;
    }

    // Price validation: required, positive number
    const priceRequired = validate(formData.price, validators.required);
    if (priceRequired) {
      newErrors.price = priceRequired;
    } else {
      const priceValid = validate(formData.price, validators.positiveNumericString);
      if (priceValid) newErrors.price = priceValid;
    }

    setErrors(newErrors);
    return !hasErrors(newErrors);
  }, [formData.name, formData.slug, formData.price]);

  // Check if form has validation errors (for disabling submit button)
  const formHasErrors = React.useMemo(() => {
    // Only show as having errors if user has interacted and there are actual errors
    return hasErrors(errors);
  }, [errors]);

  // Reset form when modal opens/closes or initialData changes
  React.useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name,
          slug: initialData.slug,
          description: initialData.description,
          shortDescription: initialData.shortDescription || "",
          tier: initialData.tier,
          price: (initialData.price / 100).toFixed(2),
          compareAtPrice: initialData.compareAtPrice ? (initialData.compareAtPrice / 100).toFixed(2) : "",
          includedFeatures: [...initialData.includedFeatures],
          iconName: initialData.iconName || "",
          color: initialData.color || "#000000",
          previewImageUrl: initialData.previewImageUrl || null,
          displayOrder: initialData.displayOrder || 0,
          isFeatured: initialData.isFeatured || false,
          isActive: initialData.isActive,
        });
        setAutoSlug(false);
      } else {
        setFormData(DEFAULT_FORM_DATA);
        setAutoSlug(true);
      }
      // Clear errors when modal opens/closes
      setErrors({});
    }
  }, [isOpen, initialData]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
      slug: autoSlug ? generateSlug(name) : prev.slug,
    }));
    // Clear name error when user types
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: undefined }));
    }
    // Also clear slug error if auto-generating
    if (autoSlug && errors.slug) {
      setErrors((prev) => ({ ...prev, slug: undefined }));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAutoSlug(false);
    setFormData((prev) => ({
      ...prev,
      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
    }));
    // Clear slug error when user types
    if (errors.slug) {
      setErrors((prev) => ({ ...prev, slug: undefined }));
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, price: e.target.value }));
    // Clear price error when user types
    if (errors.price) {
      setErrors((prev) => ({ ...prev, price: undefined }));
    }
  };

  const handleFeatureToggle = (featureSlug: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      includedFeatures: checked
        ? [...prev.includedFeatures, featureSlug]
        : prev.includedFeatures.filter((slug) => slug !== featureSlug),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate before submit
    if (!validateForm()) {
      showError("Please fix the form errors before submitting");
      return;
    }
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
          <Button
            type="submit"
            form="template-form"
            isLoading={isSubmitting}
            disabled={formHasErrors || isSubmitting}
          >
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
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
          />
          <FormError message={errors.name} />
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
            aria-invalid={!!errors.slug}
            aria-describedby={errors.slug ? "slug-error" : "slug-help"}
          />
          {errors.slug ? (
            <FormError message={errors.slug} />
          ) : (
            <p id="slug-help" className="text-xs text-muted-foreground">
              URL-friendly identifier. Auto-generated from name if not edited.
            </p>
          )}
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

          {/* Price */}
          <div className="space-y-1.5">
            <Label htmlFor="price" required>
              Price (USD)
            </Label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                $
              </span>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={handlePriceChange}
                placeholder="49.00"
                className="pl-6"
                aria-invalid={!!errors.price}
                aria-describedby={errors.price ? "price-error" : undefined}
              />
            </div>
            <FormError message={errors.price} />
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
                  checked={formData.includedFeatures.includes(feature.slug)}
                  onChange={(e) => handleFeatureToggle(feature.slug, e.target.checked)}
                  size="sm"
                />
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {formData.includedFeatures.length} feature(s) selected
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
            aria-label="Toggle template active status"
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
    <AdminTableSkeleton
      columns={8}
      rows={5}
      showStats={false}
      filterCount={2}
    />
  );
}

// =====================================================
// Main Page Component
// =====================================================

export default function TemplatesPage() {
  // State
  const [templates, setTemplates] = React.useState<Template[]>([]);
  const [features, setFeatures] = React.useState<Feature[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
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

  // Fetch templates and features on mount
  React.useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [templatesRes, featuresRes] = await Promise.all([
          fetch(`${API_CONFIG.BASE_URL}/admin/templates`, {
            credentials: "include",
          }),
          fetch(`${API_CONFIG.BASE_URL}/admin/features`, {
            credentials: "include",
          }),
        ]);

        if (!templatesRes.ok) {
          throw new Error("Failed to fetch templates");
        }
        if (!featuresRes.ok) {
          throw new Error("Failed to fetch features");
        }

        const templatesData = await templatesRes.json();
        const featuresData = await featuresRes.json();

        setTemplates(templatesData.data?.items || []);
        setFeatures(featuresData.data?.items || []);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        showError("Failed to load templates and features");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

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

    const priceInCents = Math.round(parseFloat(formData.price) * 100);
    const compareAtPriceInCents = formData.compareAtPrice
      ? Math.round(parseFloat(formData.compareAtPrice) * 100)
      : null;

    const payload = {
      name: formData.name,
      slug: formData.slug,
      description: formData.description,
      shortDescription: formData.shortDescription,
      tier: formData.tier,
      price: priceInCents,
      compareAtPrice: compareAtPriceInCents,
      includedFeatures: formData.includedFeatures,
      iconName: formData.iconName,
      color: formData.color,
      previewImageUrl: formData.previewImageUrl,
      displayOrder: formData.displayOrder,
      isFeatured: formData.isFeatured,
      isActive: formData.isActive,
    };

    try {
      if (editingTemplate) {
        const response = await fetch(`${API_CONFIG.BASE_URL}/admin/templates/${editingTemplate.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to update template");
        }

        const result = await response.json();
        const updatedTemplate = result.data;

        setTemplates((prev) =>
          prev.map((t) => (t.id === editingTemplate.id ? updatedTemplate : t))
        );
        showSuccess("Template updated successfully");
      } else {
        const response = await fetch(`${API_CONFIG.BASE_URL}/admin/templates`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to create template");
        }

        const result = await response.json();
        const newTemplate = result.data;

        setTemplates((prev) => [newTemplate, ...prev]);
        showSuccess("Template created successfully");
      }

      setIsFormModalOpen(false);
      setEditingTemplate(undefined);
    } catch (error) {
      console.error("Failed to save template:", error);
      showError("Failed to save template", error instanceof Error ? error.message : undefined);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTemplate) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/admin/templates/${deletingTemplate.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete template");
      }

      setTemplates((prev) => prev.filter((t) => t.id !== deletingTemplate.id));
      showSuccess("Template deleted successfully");
      setIsDeleteModalOpen(false);
      setDeletingTemplate(null);
    } catch (error) {
      console.error("Failed to delete template:", error);
      showError("Failed to delete template", error instanceof Error ? error.message : undefined);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (template: Template) => {
    // Optimistic update
    const previousState = template.isActive;
    setTemplates((prev) =>
      prev.map((t) =>
        t.id === template.id ? { ...t, isActive: !t.isActive } : t
      )
    );

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/admin/templates/${template.id}/toggle`, {
        method: "PATCH",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to toggle template status");
      }

      const result = await response.json();
      // Update with server response to ensure consistency
      setTemplates((prev) =>
        prev.map((t) => (t.id === template.id ? result.data : t))
      );
      showSuccess(`Template ${!previousState ? "activated" : "deactivated"} successfully`);
    } catch (error) {
      // Revert on error
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === template.id ? { ...t, isActive: previousState } : t
        )
      );
      console.error("Failed to toggle template:", error);
      showError("Failed to toggle template status");
    }
  };

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
      <div className="flex flex-col gap-3 sm:flex-row" role="search" aria-label="Filter templates">
        <div className="w-full sm:flex-1 sm:max-w-sm">
          <SearchInput
            placeholder="Search templates..."
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery("")}
            aria-label="Search templates"
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as StatusFilter)}
            className="w-full sm:w-32"
            aria-label="Filter by status"
          />
          <Select
            options={tierOptions}
            value={tierFilter}
            onChange={setTierFilter}
            className="w-full sm:w-36"
            aria-label="Filter by tier"
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingState />
      ) : filteredTemplates.length === 0 ? (
        <EmptyState onAddClick={handleAddTemplate} hasFilters={hasFilters} />
      ) : (
        <div className="bg-background rounded-lg border">
          <div className="overflow-x-auto">
            <Table className="min-w-[700px]">
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
                const featureCount = template.includedFeatures?.length || 0;
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
                      {formatCurrency(template.price)}
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
                        aria-label={`${template.isActive ? "Deactivate" : "Activate"} ${template.name}`}
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
        </div>
      )}

      {/* Summary */}
      {!isLoading && filteredTemplates.length > 0 && (
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground">
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
