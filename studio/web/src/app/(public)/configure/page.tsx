"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Menu, ShoppingCart, X, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Spinner, Button, Badge } from "@/components/ui";
import {
  useConfigurator,
  CategorySidebar,
  FeatureList,
  CartSummary,
  TemplatePicker,
} from "@/components/configurator";
import { parseURLConfig, updateURLState } from "@/lib/config";
import type { ModuleCategory } from "@studio/shared";
import { cn } from "@/lib/utils";

type WizardStep = "template" | "configure";

function StepIndicator({ currentStep }: { currentStep: WizardStep }) {
  return (
    <div className="flex items-center justify-center gap-2 py-4 px-4 border-b bg-background">
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
            currentStep === "template"
              ? "bg-primary text-primary-foreground"
              : "bg-primary/20 text-primary"
          )}
        >
          {currentStep === "configure" ? (
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            "1"
          )}
        </div>
        <span
          className={cn(
            "text-sm font-medium",
            currentStep === "template" ? "text-foreground" : "text-muted-foreground"
          )}
        >
          Choose Template
        </span>
      </div>

      <div className="w-8 h-px bg-border" />

      <div className="flex items-center gap-2">
        <div
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
            currentStep === "configure"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          2
        </div>
        <span
          className={cn(
            "text-sm font-medium",
            currentStep === "configure" ? "text-foreground" : "text-muted-foreground"
          )}
        >
          Configure Features
        </span>
      </div>
    </div>
  );
}

function ConfigurePageContent() {
  const searchParams = useSearchParams();
  const {
    loading,
    error,
    selectedTier,
    selectedFeatures,
    selectedTemplate,
    setTier,
    setFeatures,
    setTemplate,
    resolvedFeatures,
    templates,
  } = useConfigurator();

  const [step, setStep] = useState<WizardStep>("template");
  const [selectedCategory, setSelectedCategory] = useState<ModuleCategory | "all">("all");
  const [initialized, setInitialized] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  const totalSelected = resolvedFeatures?.selectedFeatures.length || 0;

  const goToStep = useCallback((newStep: WizardStep) => {
    setStep(newStep);
  }, []);

  const handleTemplateSelected = useCallback(() => {
    goToStep("configure");
  }, [goToStep]);

  // Initialize from URL on mount
  useEffect(() => {
    if (initialized) return;

    const urlConfig = parseURLConfig(searchParams);

    if (urlConfig.tier) {
      setTier(urlConfig.tier);
    }
    if (urlConfig.features) {
      setFeatures(urlConfig.features);
    }
    if (urlConfig.template) {
      setTemplate(urlConfig.template);
    }

    // If step=configure in URL or template/features are set, go to configure step
    if (urlConfig.step === "configure" || urlConfig.template || urlConfig.features) {
      setStep("configure");
    }

    setInitialized(true);
  }, [searchParams, initialized, setTier, setFeatures, setTemplate]);

  // Sync state to URL
  useEffect(() => {
    if (!initialized) return;

    updateURLState({
      tier: selectedTier,
      features: selectedFeatures.length > 0 ? selectedFeatures : undefined,
      template: selectedTemplate || undefined,
      step: step === "configure" ? "configure" : undefined,
    });
  }, [selectedTier, selectedFeatures, selectedTemplate, initialized, step]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-muted-foreground">Loading configurator...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold text-destructive mb-2">
            Failed to Load
          </h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  // Step 1: Template Selection
  if (step === "template") {
    const selectedTemplateName = selectedTemplate
      ? templates.find((t) => t.slug === selectedTemplate)?.name
      : null;

    return (
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <StepIndicator currentStep="template" />

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
            <TemplatePicker
              variant="full"
              onTemplateSelected={handleTemplateSelected}
            />

            {/* Continue button for Custom Build (since it doesn't auto-advance) */}
            <div className="flex justify-center mt-8">
              <Button
                size="lg"
                onClick={() => goToStep("configure")}
                className="gap-2 min-w-[200px]"
              >
                {selectedTemplateName
                  ? `Continue with ${selectedTemplateName}`
                  : "Continue with Custom Build"}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Feature Configuration
  const selectedTemplateName = selectedTemplate
    ? templates.find((t) => t.slug === selectedTemplate)?.name
    : "Custom Build";

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <StepIndicator currentStep="configure" />

      {/* Context bar: back button + selected template */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b bg-muted/30">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={() => goToStep("template")}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </Button>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Template:</span>
          <Badge variant="secondary">{selectedTemplateName}</Badge>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        {/* Mobile Header Bar */}
        <div className="lg:hidden flex items-center justify-between border-b p-3 bg-background sticky top-0 z-40">
          <Button
            variant="outline"
            size="sm"
            className="min-h-[44px] gap-2"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Open categories menu"
          >
            <Menu className="h-4 w-4" aria-hidden="true" />
            Categories
          </Button>
          <Button
            variant="default"
            size="sm"
            className="min-h-[44px] gap-2"
            onClick={() => setMobileCartOpen(true)}
            aria-label={`Open cart with ${totalSelected} items`}
          >
            <ShoppingCart className="h-4 w-4" aria-hidden="true" />
            Cart ({totalSelected})
          </Button>
        </div>

        {/* Mobile Category Sidebar Overlay */}
        {mobileSidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Categories"
          >
            <div
              className="fixed inset-y-0 left-0 w-[280px] max-w-[85vw] bg-background shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="font-semibold">Categories</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="min-h-[44px] min-w-[44px]"
                  onClick={() => setMobileSidebarOpen(false)}
                  aria-label="Close categories"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </Button>
              </div>
              <div className="overflow-y-auto h-[calc(100%-60px)]">
                <CategorySidebar
                  selectedCategory={selectedCategory}
                  onSelectCategory={(cat) => {
                    setSelectedCategory(cat);
                    setMobileSidebarOpen(false);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Mobile Cart Overlay */}
        {mobileCartOpen && (
          <div
            className="lg:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileCartOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Your selection"
          >
            <div
              className="fixed inset-y-0 right-0 w-[320px] max-w-[90vw] bg-background shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="font-semibold">Your Selection</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="min-h-[44px] min-w-[44px]"
                  onClick={() => setMobileCartOpen(false)}
                  aria-label="Close cart"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </Button>
              </div>
              <div className="overflow-y-auto h-[calc(100%-60px)]">
                <CartSummary />
              </div>
            </div>
          </div>
        )}

        {/* Left: Category Sidebar (Desktop) */}
        <div className="hidden lg:block">
          <CategorySidebar
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </div>

        {/* Middle: Feature List */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <FeatureList category={selectedCategory} />
        </div>

        {/* Right: Cart Summary (Desktop) */}
        <div className="hidden lg:flex lg:flex-col lg:h-full lg:overflow-hidden">
          <CartSummary />
        </div>
      </div>
    </div>
  );
}

function ConfigurePageFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-4 text-muted-foreground">Loading configurator...</p>
      </div>
    </div>
  );
}

export default function ConfigurePage() {
  return (
    <Suspense fallback={<ConfigurePageFallback />}>
      <ConfigurePageContent />
    </Suspense>
  );
}
