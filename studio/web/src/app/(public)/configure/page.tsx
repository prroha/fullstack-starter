"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Menu, ShoppingCart, X } from "lucide-react";
import { Spinner, Button } from "@/components/ui";
import {
  useConfigurator,
  CategorySidebar,
  FeatureList,
  CartSummary,
  TemplatePicker,
} from "@/components/configurator";
import { parseURLConfig, updateURLState } from "@/lib/config";
import type { ModuleCategory } from "@studio/shared";

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
  } = useConfigurator();

  const [selectedCategory, setSelectedCategory] = useState<ModuleCategory | "all">("all");
  const [initialized, setInitialized] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  const totalSelected = resolvedFeatures?.selectedFeatures.length || 0;

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

    setInitialized(true);
  }, [searchParams, initialized, setTier, setFeatures, setTemplate]);

  // Sync state to URL
  useEffect(() => {
    if (!initialized) return;

    updateURLState({
      tier: selectedTier,
      features: selectedFeatures.length > 0 ? selectedFeatures : undefined,
      template: selectedTemplate || undefined,
    });
  }, [selectedTier, selectedFeatures, selectedTemplate, initialized]);

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

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)]">
      {/* Mobile Header Bar */}
      <div className="lg:hidden flex items-center justify-between border-b p-3 bg-background sticky top-16 z-40">
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
        {/* Template Picker (at top) */}
        <div className="p-4 md:p-6 border-b bg-muted/20">
          <TemplatePicker />
        </div>

        {/* Feature Grid */}
        <FeatureList category={selectedCategory} />
      </div>

      {/* Right: Cart Summary (Desktop) */}
      <div className="hidden lg:block">
        <CartSummary />
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
