// =====================================================
// Shared Components (Cross-cutting)
// =====================================================

// Error Boundary
export {
  ErrorBoundary,
  DefaultErrorFallback,
  SectionErrorBoundary,
  CardErrorBoundary,
  FormErrorBoundary,
  ErrorBoundaryProvider,
  useErrorBoundary,
} from "./error-boundary";
export type { ErrorBoundaryProps, ErrorBoundaryState, FallbackProps } from "./error-boundary";

// Empty States
export {
  EmptyState,
  EmptyUsers,
  EmptySearch,
  EmptyNotifications,
  EmptyList,
  EmptyFiles,
  OfflineState,
  ErrorState,
} from "./empty-state";
export type { EmptyStateProps, EmptyStateAction, EmptyStateVariant } from "./empty-state";

// SEO
export {
  createSeoConfig,
  generateMetadata,
  generateViewport,
  generateJsonLd,
  generateBreadcrumbJsonLd,
  generateWebsiteJsonLd,
  createJsonLdScript,
  defaultSeoConfig,
} from "./seo";
export type { SeoConfig, PageSeoOptions, JsonLdScriptProps } from "./seo";

// Skeleton Composites
export {
  SkeletonUserCard,
  SkeletonProfilePage,
  SkeletonDashboardEnhanced,
  SkeletonFormEnhanced,
  SkeletonProductCard,
  SkeletonComment,
  SkeletonNotification,
  SkeletonSearchResults,
} from "./skeleton-composites";

// Email Verification Banner
export { EmailVerificationBanner } from "./email-verification-banner";
