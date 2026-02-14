"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import ArticleForm from "@/components/helpdesk/article-form";
import { articleApi } from "@/lib/helpdesk/api";
import type { ArticleCreateInput } from "@/lib/helpdesk/types";

// =============================================================================
// Page Component
// =============================================================================

export default function NewArticlePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: ArticleCreateInput) => {
    setIsSubmitting(true);
    try {
      const article = await articleApi.create(data as ArticleCreateInput);
      router.push(`/helpdesk/knowledge-base/${article.id}`);
    } catch (err) {
      setIsSubmitting(false);
      throw err instanceof Error ? err : new Error("Failed to create article");
    }
  };

  const handleCancel = () => {
    router.push("/helpdesk/knowledge-base");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumb
            items={[
              { label: "Helpdesk", href: "/helpdesk" },
              { label: "Knowledge Base", href: "/helpdesk/knowledge-base" },
              { label: "New Article" },
            ]}
            className="mb-4"
          />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            New Article
          </h1>
          <p className="mt-1 text-muted-foreground">
            Create a new knowledge base article
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-border bg-card p-6">
          <ArticleForm onSubmit={handleSubmit} onCancel={handleCancel} />
        </div>
      </div>
    </div>
  );
}
