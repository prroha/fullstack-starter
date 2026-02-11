"use client";

import { Suspense, useState, useMemo } from "react";
import { Container, Grid, Spinner } from "@/components/ui";
import { ComponentCard, CategoryNav, SearchFilter } from "@/components/showcase";
import {
  componentRegistry,
  searchComponents,
  getPopularComponents,
  type ComponentTier,
} from "@/lib/showcase";

function ShowcasePageContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTier, setSelectedTier] = useState<ComponentTier | "all">("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Get all unique tags
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    componentRegistry.forEach((c) => c.tags.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, []);

  // Filter components
  const filteredComponents = useMemo(() => {
    let components = searchQuery
      ? searchComponents(searchQuery)
      : componentRegistry;

    if (selectedTier !== "all") {
      components = components.filter((c) => c.tier === selectedTier);
    }

    if (selectedTag) {
      components = components.filter((c) => c.tags.includes(selectedTag));
    }

    return components;
  }, [searchQuery, selectedTier, selectedTag]);

  const popularComponents = getPopularComponents();

  return (
    <Container className="py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Component Showcase</h1>
        <p className="text-lg text-muted-foreground">
          Browse our library of {componentRegistry.length}+ production-ready UI components
        </p>
      </div>

      {/* Search & Filter */}
      <div className="mb-8">
        <SearchFilter
          onSearchChange={setSearchQuery}
          onTierChange={setSelectedTier}
          onTagSelect={setSelectedTag}
          availableTags={availableTags}
          selectedTag={selectedTag}
        />
      </div>

      {/* Category Navigation */}
      <div className="mb-8">
        <CategoryNav />
      </div>

      {/* Popular Components (only when not searching) */}
      {!searchQuery && !selectedTag && selectedTier === "all" && (
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Popular Components</h2>
          <Grid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} gap="md">
            {popularComponents.slice(0, 8).map((component) => (
              <ComponentCard key={component.slug} component={component} />
            ))}
          </Grid>
        </div>
      )}

      {/* All/Filtered Components */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {searchQuery || selectedTag || selectedTier !== "all"
              ? `Results (${filteredComponents.length})`
              : "All Components"}
          </h2>
        </div>

        {filteredComponents.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-muted/30">
            <p className="text-muted-foreground">
              No components found matching your criteria.
            </p>
          </div>
        ) : (
          <Grid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} gap="md">
            {filteredComponents.map((component) => (
              <ComponentCard key={component.slug} component={component} />
            ))}
          </Grid>
        )}
      </div>
    </Container>
  );
}

function ShowcasePageFallback() {
  return (
    <Container className="py-12">
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-muted-foreground">Loading showcase...</p>
        </div>
      </div>
    </Container>
  );
}

export default function ShowcasePage() {
  return (
    <Suspense fallback={<ShowcasePageFallback />}>
      <ShowcasePageContent />
    </Suspense>
  );
}
