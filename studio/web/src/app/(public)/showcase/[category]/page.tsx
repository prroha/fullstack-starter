"use client";

import { use, useState, useMemo } from "react";
import { notFound } from "next/navigation";
import { Container, Grid } from "@/components/ui";
import { ComponentCard, CategoryNav, SearchFilter } from "@/components/showcase";
import {
  getCategories,
  getCategoryInfo,
  getComponentsByCategory,
  searchComponents,
  type ComponentCategory,
  type ComponentTier,
} from "@/lib/showcase";

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const { category } = use(params);

  // Validate category
  const validCategories = getCategories();
  if (!validCategories.includes(category as ComponentCategory)) {
    notFound();
  }

  const categoryInfo = getCategoryInfo(category as ComponentCategory);
  const categoryComponents = getComponentsByCategory(category as ComponentCategory);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTier, setSelectedTier] = useState<ComponentTier | "all">("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Get tags for this category
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    categoryComponents.forEach((c) => c.tags.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [categoryComponents]);

  // Filter components
  const filteredComponents = useMemo(() => {
    let components = searchQuery
      ? searchComponents(searchQuery).filter((c) => c.category === category)
      : categoryComponents;

    if (selectedTier !== "all") {
      components = components.filter((c) => c.tier === selectedTier);
    }

    if (selectedTag) {
      components = components.filter((c) => c.tags.includes(selectedTag));
    }

    return components;
  }, [searchQuery, selectedTier, selectedTag, category, categoryComponents]);

  return (
    <Container className="py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{categoryInfo.name}</h1>
        <p className="text-lg text-muted-foreground">
          {categoryInfo.description} ({categoryComponents.length} components)
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

      {/* Components Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {searchQuery || selectedTag || selectedTier !== "all"
              ? `Results (${filteredComponents.length})`
              : `${categoryInfo.name} Components`}
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
