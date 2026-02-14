"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Alert } from "@/components/feedback/alert";
import ArticleForm from "@/components/helpdesk/article-form";
import { articleApi } from "@/lib/helpdesk/api";
import {
  formatDate,
  formatArticleStatus,
  getArticleStatusBadge,
} from "@/lib/helpdesk/formatters";
import type {
  KnowledgeBaseArticle,
  ArticleUpdateInput,
} from "@/lib/helpdesk/types";

// =============================================================================
// Page Component
// =============================================================================

export default function ArticleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [article, setArticle] = useState<KnowledgeBaseArticle | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchArticle = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await articleApi.getById(id);
      setArticle(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load article");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchArticle();
  }, [fetchArticle]);

  // ---------------------------------------------------------------------------
  // Action handlers
  // ---------------------------------------------------------------------------

  const handleUpdate = async (data: ArticleUpdateInput) => {
    try {
      const updated = await articleApi.update(id, data as ArticleUpdateInput);
      setArticle(updated);
      setIsEditing(false);
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to update article");
    }
  };

  const handlePublish = async () => {
    try {
      setActionLoading("publish");
      const updated = await articleApi.publish(id);
      setArticle(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish article");
    } finally {
      setActionLoading(null);
    }
  };

  const handleArchive = async () => {
    try {
      setActionLoading("archive");
      const updated = await articleApi.archive(id);
      setArticle(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to archive article");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    try {
      setActionLoading("delete");
      await articleApi.delete(id);
      router.push("/helpdesk/knowledge-base");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete article");
      setActionLoading(null);
    }
  };

  const handleFeedback = async (helpful: boolean) => {
    try {
      await articleApi.recordFeedback(id, helpful);
      setFeedbackGiven(true);
      await fetchArticle();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record feedback");
    }
  };

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Error state (blocking)
  // ---------------------------------------------------------------------------

  if (error && !article) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-4xl">
          <Alert variant="destructive" title="Error loading article">
            <p className="mt-1">{error}</p>
            <div className="mt-3 flex items-center gap-3">
              <Button onClick={fetchArticle}>Retry</Button>
              <Button
                variant="outline"
                onClick={() => router.push("/helpdesk/knowledge-base")}
              >
                Back to Knowledge Base
              </Button>
            </div>
          </Alert>
        </div>
      </div>
    );
  }

  if (!article) return null;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumb
            items={[
              { label: "Helpdesk", href: "/helpdesk" },
              { label: "Knowledge Base", href: "/helpdesk/knowledge-base" },
              { label: article.title },
            ]}
            className="mb-4"
          />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {article.title}
              </h1>
              <StatusBadge
                status={
                  getArticleStatusBadge(article.status) as
                    | "active"
                    | "inactive"
                    | "pending"
                    | "success"
                    | "warning"
                    | "error"
                    | "info"
                }
                label={formatArticleStatus(article.status)}
                showDot
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={isEditing ? "secondary" : "outline"}
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? "Cancel Edit" : "Edit"}
              </Button>

              {article.status === "DRAFT" && (
                <Button
                  onClick={handlePublish}
                  isLoading={actionLoading === "publish"}
                >
                  Publish
                </Button>
              )}

              {article.status === "PUBLISHED" && (
                <Button
                  variant="outline"
                  onClick={handleArchive}
                  isLoading={actionLoading === "archive"}
                >
                  Archive
                </Button>
              )}

              <ConfirmButton
                confirmMode="dialog"
                confirmTitle="Delete Article"
                confirmMessage="Are you sure you want to delete this article? This action cannot be undone."
                confirmLabel="Delete"
                onConfirm={handleDelete}
                variant="destructive"
                size="sm"
                disabled={actionLoading === "delete"}
              >
                Delete
              </ConfirmButton>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* Non-blocking error banner */}
        {error && (
          <Alert variant="destructive" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {isEditing ? (
          /* Edit mode */
          <div className="rounded-lg border border-border bg-card p-6">
            <ArticleForm
              article={article}
              onSubmit={handleUpdate}
              onCancel={() => setIsEditing(false)}
            />
          </div>
        ) : (
          /* View mode */
          <>
            {/* Article content */}
            <div className="rounded-lg border border-border bg-card p-6">
              {article.excerpt && (
                <p className="mb-4 text-muted-foreground italic">
                  {article.excerpt}
                </p>
              )}
              <div className="text-foreground whitespace-pre-wrap">
                {article.content}
              </div>
            </div>

            {/* Stats */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Article Stats
              </h3>
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Views</p>
                  <p className="text-lg font-semibold text-foreground">
                    {article.viewCount}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Helpful (Yes)</p>
                  <p className="text-lg font-semibold text-foreground">
                    {article.helpfulCount}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Helpful (No)</p>
                  <p className="text-lg font-semibold text-foreground">
                    {article.notHelpfulCount}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="text-sm font-medium text-foreground">
                    {formatDate(article.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Feedback */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Was this article helpful?
              </h3>
              {feedbackGiven ? (
                <p className="text-sm text-muted-foreground">
                  Thank you for your feedback!
                </p>
              ) : (
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFeedback(true)}
                  >
                    Yes
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFeedback(false)}
                  >
                    No
                  </Button>
                </div>
              )}
            </div>

            {/* Metadata */}
            <div className="border-t border-border pt-4 text-sm text-muted-foreground">
              {article.category && (
                <p>Category: {article.category.name}</p>
              )}
              <p>Last updated: {formatDate(article.updatedAt)}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
