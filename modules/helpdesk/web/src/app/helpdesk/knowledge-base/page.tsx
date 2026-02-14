"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { Alert } from "@/components/feedback/alert";
import ArticleCard from "@/components/helpdesk/article-card";
import { articleApi, categoryApi } from "@/lib/helpdesk/api";
import { ARTICLE_STATUS_OPTIONS } from "@/lib/helpdesk/constants";
import type {
  KnowledgeBaseArticle,
  HelpdeskCategory,
  PaginatedResponse,
} from "@/lib/helpdesk/types";
import { BookOpen } from "lucide-react";

const PAGE_SIZE = 12;

// =============================================================================
// Page Component
// =============================================================================

export default function KnowledgeBasePage() {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse<KnowledgeBaseArticle> | null>(null);
  const [categories, setCategories] = useState<HelpdeskCategory[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await articleApi.list(page, PAGE_SIZE, {
        search: search || undefined,
        status: statusFilter || undefined,
        categoryId: categoryFilter || undefined,
      });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load articles");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, categoryFilter]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  useEffect(() => {
    categoryApi.list().then(setCategories).catch(() => {});
  }, []);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleStatusChange = useCallback((value: string) => {
    setStatusFilter(value);
    setPage(1);
  }, []);

  const handleCategoryChange = useCallback((value: string) => {
    setCategoryFilter(value);
    setPage(1);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  // ---------------------------------------------------------------------------
  // Filter options
  // ---------------------------------------------------------------------------

  const statusOptions = [
    { value: "", label: "All Statuses" },
    ...ARTICLE_STATUS_OPTIONS,
  ];

  const categoryOptions = [
    { value: "", label: "All Categories" },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Error state (blocking)
  // ---------------------------------------------------------------------------

  if (error && !data) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-7xl text-center">
          <Alert variant="destructive">{error}</Alert>
          <Button onClick={fetchArticles} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const articles = data?.items ?? [];
  const pagination = data?.pagination;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Knowledge Base
              </h1>
              <p className="mt-1 text-muted-foreground">
                Manage help articles and documentation
              </p>
            </div>
            <Button onClick={() => router.push("/helpdesk/knowledge-base/new")}>
              New Article
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <SearchInput
            placeholder="Search articles by title or content..."
            debounceDelay={400}
            onSearch={handleSearch}
            className="flex-1"
          />
          <div className="flex gap-3">
            <Select
              value={statusFilter}
              onChange={handleStatusChange}
              options={statusOptions}
            />
            <Select
              value={categoryFilter}
              onChange={handleCategoryChange}
              options={categoryOptions}
            />
          </div>
        </div>

        {/* Error banner (when data already loaded but refresh failed) */}
        {error && data && (
          <Alert variant="destructive" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Loading overlay for subsequent fetches */}
        {loading && data && (
          <div className="flex justify-center py-4">
            <Spinner size="md" />
          </div>
        )}

        {/* Article grid or empty state */}
        {!loading && articles.length === 0 ? (
          search || statusFilter || categoryFilter ? (
            <EmptyState
              variant="noResults"
              title="No articles found"
              description="No articles match your current filters. Try adjusting your search or filters."
              action={{
                label: "Clear Filters",
                onClick: () => {
                  handleSearch("");
                  setStatusFilter("");
                  setCategoryFilter("");
                },
                variant: "outline",
              }}
            />
          ) : (
            <EmptyState
              icon={BookOpen}
              title="No articles yet"
              description="Create your first knowledge base article to help your customers"
              action={{
                label: "New Article",
                onClick: () => router.push("/helpdesk/knowledge-base/new"),
              }}
            />
          )
        ) : (
          !loading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  onClick={() =>
                    router.push(`/helpdesk/knowledge-base/${article.id}`)
                  }
                />
              ))}
            </div>
          )
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            pageSize={PAGE_SIZE}
            onPageChange={handlePageChange}
            showItemCount
          />
        )}
      </div>
    </div>
  );
}
