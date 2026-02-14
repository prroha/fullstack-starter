import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  formatArticleStatus,
  getArticleStatusBadge,
  formatRelativeTime,
} from "@/lib/helpdesk/formatters";
import type { KnowledgeBaseArticle } from "@/lib/helpdesk/types";

// =============================================================================
// Props
// =============================================================================

interface ArticleCardProps {
  article: KnowledgeBaseArticle;
  onClick?: () => void;
}

// =============================================================================
// Component
// =============================================================================

export default function ArticleCard({ article, onClick }: ArticleCardProps) {
  return (
    <div
      className={`rounded-lg border border-border bg-card p-4 transition-colors ${
        onClick ? "cursor-pointer hover:bg-accent/50" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-foreground truncate">{article.title}</h3>
          {article.excerpt && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {article.excerpt}
            </p>
          )}
        </div>
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

      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
        {article.category && (
          <Badge variant="outline">{article.category.name}</Badge>
        )}
        <span>{article.viewCount} views</span>
        {(article.helpfulCount > 0 || article.notHelpfulCount > 0) && (
          <span>
            {article.helpfulCount}/{article.helpfulCount + article.notHelpfulCount} helpful
          </span>
        )}
        <span className="ml-auto">{formatRelativeTime(article.updatedAt)}</span>
      </div>
    </div>
  );
}
