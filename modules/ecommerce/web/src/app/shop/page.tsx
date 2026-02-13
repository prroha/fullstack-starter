"use client";

import { useState, useEffect, useCallback } from "react";
import { productApi } from "@/lib/ecommerce/api";
import type { Product, ProductCategory, ProductFilters } from "@/lib/ecommerce/types";
import ProductGrid from "@/components/ecommerce/product-grid";
import { SearchInput } from "@/components/ui/search-input";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

// =============================================================================
// Constants
// =============================================================================

const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Top Rated", value: "rating" },
] as const;

const PAGE_SIZE = 12;

// =============================================================================
// Shop Page
// =============================================================================

export default function ShopPage() {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSort, setSelectedSort] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // ---------------------------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------------------------

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: ProductFilters = {
        page,
        limit: PAGE_SIZE,
      };

      if (search.trim()) filters.search = search.trim();
      if (selectedCategory) filters.category = selectedCategory;
      if (selectedSort) filters.sort = selectedSort;

      const result = await productApi.list(filters);
      setProducts(result.items);
      setTotalPages(result.pagination.totalPages);
      setTotal(result.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, selectedSort, page]);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await productApi.getCategories();
      setCategories(data);
    } catch {
      // Categories are non-critical; silently fail
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, selectedCategory, selectedSort]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Shop
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Browse our collection of products and find what you need.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <SearchInput
            placeholder="Search products..."
            debounceDelay={400}
            onSearch={setSearch}
            size="lg"
            className="w-full"
          />

          {/* Filter Row */}
          <div className="flex flex-wrap items-end gap-3">
            {/* Category Filter */}
            <Select
              value={selectedCategory}
              onChange={setSelectedCategory}
              options={[
                { value: "", label: "All Categories" },
                ...categories.map((cat) => ({
                  value: cat.slug,
                  label: cat.name,
                })),
              ]}
            />

            {/* Sort Filter */}
            <Select
              value={selectedSort}
              onChange={setSelectedSort}
              options={[
                { value: "", label: "Sort By" },
                ...SORT_OPTIONS.map((opt) => ({
                  value: opt.value,
                  label: opt.label,
                })),
              ]}
            />

            {/* Clear Filters */}
            {(selectedCategory || selectedSort || search) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("");
                  setSelectedSort("");
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Results Info */}
        {!loading && !error && (
          <p className="mb-6 text-sm text-muted-foreground">
            {total === 0
              ? "No products found"
              : `Showing ${(page - 1) * PAGE_SIZE + 1}-${Math.min(page * PAGE_SIZE, total)} of ${total} products`}
          </p>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
            <p className="text-destructive">{error}</p>
            <Button
              onClick={fetchProducts}
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Product Grid */}
        {!loading && !error && products.length > 0 && (
          <ProductGrid products={products} />
        )}

        {/* Empty State */}
        {!loading && !error && products.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-lg font-medium text-foreground">
              No products found
            </p>
            <p className="mt-2 text-muted-foreground">
              Try adjusting your filters or search terms.
            </p>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-10">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalItems={total}
              pageSize={PAGE_SIZE}
              showItemCount
            />
          </div>
        )}
      </div>
    </div>
  );
}
