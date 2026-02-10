"use client";

import { useState, useMemo } from "react";
import { SearchInput, Select, Badge } from "@/components/ui";
import type { ComponentTier } from "@/lib/showcase";

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

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearchChange(value);
  };

  const popularTags = useMemo(() => {
    return availableTags.slice(0, 10);
  }, [availableTags]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchInput
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search components..."
            debounceDelay={200}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            options={tierOptions}
            defaultValue="all"
            onChange={(value) => onTierChange(value as ComponentTier | "all")}
          />
        </div>
      </div>

      {popularTags.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground mr-1 sm:mr-2">Filter by:</span>
          {popularTags.map((tag) => (
            <button
              key={tag}
              onClick={() => onTagSelect(selectedTag === tag ? null : tag)}
              className="focus:outline-none min-h-[36px] flex items-center"
            >
              <Badge
                variant={selectedTag === tag ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/10 transition-colors px-3 py-1.5"
              >
                {tag}
              </Badge>
            </button>
          ))}
          {selectedTag && (
            <button
              onClick={() => onTagSelect(null)}
              className="text-sm text-muted-foreground hover:text-foreground ml-1 sm:ml-2 min-h-[36px] px-2"
            >
              Clear filter
            </button>
          )}
        </div>
      )}
    </div>
  );
}
