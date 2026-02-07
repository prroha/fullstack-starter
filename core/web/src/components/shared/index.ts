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
