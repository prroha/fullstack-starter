"use client";

import { useState, useMemo, useId } from "react";
import { SearchInput, Select, Badge, Button } from "@/components/ui";
import type { ComponentTier } from "@/lib/showcase";
import { cn } from "@/lib/utils";

interface SearchFilterProps {
  onSearchChange: (query: string) => void;
  onTierChange: (tier: ComponentTier | "all") => void;
  onTagSelect: (tag: string | null) => void;
  availableTags: string[];
  selectedTag: string | null;
}

const tierOptions = [
  { value: "all", label: "All Tiers" },
  { value: "basic", label: "Basic (Free)" },
  { value: "starter", label: "Starter" },
  { value: "pro", label: "Pro" },
  { value: "business", label: "Business" },
  { value: "enterprise", label: "Enterprise" },
];

export function SearchFilter({
  onSearchChange,
  onTierChange,
  onTagSelect,
  availableTags,
  selectedTag,
}: SearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const filterId = useId();

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearchChange(value);
  };

  const popularTags = useMemo(() => {
    return availableTags.slice(0, 10);
  }, [availableTags]);

  return (
    <div className="space-y-4" role="search" aria-label="Filter components">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label htmlFor={`${filterId}-search`} className="sr-only">
            Search components
          </label>
          <SearchInput
            id={`${filterId}-search`}
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search components..."
            debounceDelay={200}
          />
        </div>
        <div className="w-full sm:w-48">
          <label htmlFor={`${filterId}-tier`} className="sr-only">
            Filter by tier
          </label>
          <Select
            id={`${filterId}-tier`}
            options={tierOptions}
            defaultValue="all"
            onChange={(value) => onTierChange(value as ComponentTier | "all")}
            aria-label="Filter by tier"
          />
        </div>
      </div>

      {popularTags.length > 0 && (
        <div
          className="flex flex-wrap gap-2 items-center"
          role="group"
          aria-label="Filter by tag"
        >
          <span
            id={`${filterId}-tags-label`}
            className="text-sm text-muted-foreground mr-1 sm:mr-2"
          >
            Filter by:
          </span>
          {popularTags.map((tag) => (
            <Button
              key={tag}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onTagSelect(selectedTag === tag ? null : tag)}
              className="min-h-[36px] h-auto p-0"
              aria-pressed={selectedTag === tag}
              aria-describedby={`${filterId}-tags-label`}
            >
              <Badge
                variant={selectedTag === tag ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/10 transition-colors px-3 py-1.5"
              >
                {tag}
              </Badge>
            </Button>
          ))}
          {selectedTag && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onTagSelect(null)}
              className="text-muted-foreground hover:text-foreground ml-1 sm:ml-2 min-h-[36px]"
              aria-label={`Clear ${selectedTag} filter`}
            >
              Clear filter
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
